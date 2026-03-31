import { inngest } from './client'
import { createAdminClient } from '@/lib/supabase/admin'
import { normaliseTranscript } from '@/lib/adapters'
import { detectGaps } from '@/lib/anthropic'
import type { NormalisedTurn, Platform, GapDetectionResult } from '@/types'

/** Approximate token count — 4 chars ≈ 1 token */
const CHARS_PER_TOKEN = 4
const CHUNK_TOKEN_LIMIT = 4000
const CHUNK_CHAR_LIMIT = CHUNK_TOKEN_LIMIT * CHARS_PER_TOKEN

function chunkTurns(turns: NormalisedTurn[]): NormalisedTurn[][] {
  const chunks: NormalisedTurn[][] = []
  let current: NormalisedTurn[] = []
  let currentChars = 0

  for (const turn of turns) {
    const turnChars = turn.speaker.length + turn.text.length + 3
    if (currentChars + turnChars > CHUNK_CHAR_LIMIT && current.length > 0) {
      chunks.push(current)
      current = []
      currentChars = 0
    }
    current.push(turn)
    currentChars += turnChars
  }

  if (current.length > 0) chunks.push(current)
  return chunks
}

export const processTranscript = inngest.createFunction(
  {
    id: 'process-transcript',
    name: 'Process Transcript',
    retries: 2,
    triggers: [{ event: 'transcript/process' }],
  },
  async ({ event, step }) => {
    const { transcriptId } = event.data as { transcriptId: string; userId: string }
    const supabase = createAdminClient()

    // ── Wrap all steps in top-level error handler ─────────────
    const fail = async (message: string) => {
      await supabase
        .from('transcripts')
        .update({ status: 'failed', error_message: message })
        .eq('id', transcriptId)
      throw new Error(message)
    }

    // ── Step 1: Fetch transcript record from DB ───────────────
    const transcript = await step.run('fetch-transcript-record', async () => {
      const { data, error } = await supabase
        .from('transcripts')
        .select('id, profile_id, platform, status, raw_payload, storage_path')
        .eq('id', transcriptId)
        .single()

      if (error || !data) throw new Error(`Transcript ${transcriptId} not found: ${error?.message}`)
      if (data.status === 'completed') throw new Error('Already processed — skipping')
      return data as {
        id: string
        profile_id: string
        platform: Platform
        status: string
        raw_payload: Record<string, unknown>
        storage_path: string | null
      }
    })

    // Mark processing
    await step.run('mark-processing', async () => {
      await supabase
        .from('transcripts')
        .update({ status: 'processing' })
        .eq('id', transcriptId)
    })

    // ── Step 2: Download raw file from Supabase Storage ───────
    const rawContent = await step.run('download-raw-file', async () => {
      const storagePath = transcript.storage_path

      if (!storagePath) {
        // File was stored inline in raw_payload
        const inline = transcript.raw_payload?.content
        if (typeof inline !== 'string' && typeof inline !== 'object') {
          throw new Error('No storage path and no inline content in raw_payload')
        }
        return inline as string | object
      }

      const { data: blob, error } = await supabase.storage
        .from('transcripts')
        .download(storagePath)

      if (error || !blob) {
        throw new Error(`Failed to download file from storage: ${error?.message}`)
      }

      const text = await blob.text()
      // Detect if it's JSON
      if (storagePath.endsWith('.json')) {
        try {
          return JSON.parse(text) as object
        } catch {
          return text
        }
      }
      return text
    })

    // ── Step 3: Detect platform (already in record) ───────────
    const platform = await step.run('resolve-platform', async () => {
      const p = transcript.platform
      if (!p) throw new Error('Platform not set on transcript record')
      return p
    })

    // ── Step 4: Normalise transcript using platform adapter ───
    const normalisedTurns = await step.run('normalise-transcript', async () => {
      let turns: NormalisedTurn[]
      try {
        turns = normaliseTranscript(rawContent as string | object, platform)
      } catch (err) {
        throw new Error(
          `Normalisation failed for platform "${platform}": ${err instanceof Error ? err.message : String(err)}`
        )
      }
      if (turns.length === 0) throw new Error('Normalisation produced 0 turns — check file format')
      return turns
    })

    // ── Step 5: Save normalised turns back to transcript ──────
    await step.run('save-normalised-turns', async () => {
      const { error } = await supabase
        .from('transcripts')
        .update({
          normalised_turns: normalisedTurns,
          duration_seconds: normalisedTurns.length > 0
            ? Math.ceil(normalisedTurns[normalisedTurns.length - 1].timestamp_ms / 1000)
            : null,
        })
        .eq('id', transcriptId)

      if (error) throw new Error(`Failed to save normalised turns: ${error.message}`)
    })

    // ── Step 6: Chunk normalised transcript into segments ─────
    const chunks = await step.run('chunk-transcript', async () => {
      const c = chunkTurns(normalisedTurns)
      if (c.length === 0) throw new Error('No chunks produced from normalised turns')
      return c
    })

    // ── Steps 7–8: Detect gaps for each chunk ─────────────────
    // Process chunks sequentially — each is a named step for retry granularity
    const allGaps: GapDetectionResult[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunkGaps = await step.run(`detect-gaps-chunk-${i + 1}-of-${chunks.length}`, async () => {
        const chunk = chunks[i]
        let gaps: GapDetectionResult[]

        try {
          gaps = await detectGaps(chunk)
        } catch (err) {
          throw new Error(
            `Gap detection failed on chunk ${i + 1}: ${err instanceof Error ? err.message : String(err)}`
          )
        }

        return gaps
      })

      allGaps.push(...chunkGaps)
    }

    // ── Step 8 (cont.): Insert gap records into DB ────────────
    await step.run('insert-gap-records', async () => {
      if (allGaps.length === 0) return

      const profileId = transcript.profile_id
      const rows = allGaps.map((g) => ({
        transcript_id: transcriptId,
        profile_id: profileId,
        topic: g.topic,
        customer_question: g.customer_question,
        agent_response: g.agent_response,
        failure_type: g.failure_type,
        severity: g.severity,
        suggested_answer: g.suggested_answer,
        kb_entry_question: g.kb_entry.question,
        kb_entry_answer: g.kb_entry.answer,
        status: 'pending',
      }))

      const { error } = await supabase.from('gaps').insert(rows)
      if (error) throw new Error(`Failed to insert gaps: ${error.message}`)
    })

    // ── Step 9: Update transcript to completed ────────────────
    await step.run('mark-completed', async () => {
      const { error } = await supabase
        .from('transcripts')
        .update({
          status: 'completed',
          gap_count: allGaps.length,
          processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', transcriptId)

      if (error) throw new Error(`Failed to mark transcript complete: ${error.message}`)
    })

    // ── Step 10: Increment user's monthly call counter ────────
    await step.run('increment-monthly-usage', async () => {
      const profileId = transcript.profile_id

      // Read current counter, increment — non-fatal if this fails
      const { data: profile } = await supabase
        .from('profiles')
        .select('calls_used_this_month')
        .eq('id', profileId)
        .single()

      const current = (profile as { calls_used_this_month?: number } | null)?.calls_used_this_month ?? 0

      await supabase
        .from('profiles')
        .update({ calls_used_this_month: current + 1 } as Record<string, unknown>)
        .eq('id', profileId)
    })

    return {
      transcriptId,
      platform,
      turnCount: normalisedTurns.length,
      chunkCount: chunks.length,
      gapCount: allGaps.length,
    }
  }
)
