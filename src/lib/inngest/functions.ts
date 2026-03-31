import { inngest } from './client'
import { createAdminClient } from '@/lib/supabase/admin'
import { normaliseTranscript } from '@/lib/adapters'
import { detectGaps } from '@/lib/anthropic'
import type { Platform } from '@/types'

export const processTranscript = inngest.createFunction(
  { id: 'process-transcript', name: 'Process Transcript' },
  { event: 'transcript/process' },
  async ({ event, step }) => {
    const { transcriptId } = event.data as { transcriptId: string }
    const supabase = createAdminClient()

    // ── Step 1: Mark as processing ────────────────────────────
    await step.run('mark-processing', async () => {
      await supabase
        .from('transcripts')
        .update({ status: 'processing' })
        .eq('id', transcriptId)
    })

    // ── Step 2: Fetch transcript record ───────────────────────
    const transcript = await step.run('fetch-transcript', async () => {
      const { data, error } = await supabase
        .from('transcripts')
        .select('id, profile_id, platform, raw_payload, storage_path')
        .eq('id', transcriptId)
        .single()
      if (error || !data) throw new Error(`Transcript not found: ${transcriptId}`)
      return data
    })

    // ── Step 3: Load raw content from storage ─────────────────
    const rawContent = await step.run('load-raw-content', async () => {
      const storagePath = (transcript as { storage_path?: string }).storage_path
      if (!storagePath) {
        // Fallback: use raw_payload stored inline
        return transcript.raw_payload
      }
      const { data, error } = await supabase.storage
        .from('transcripts')
        .download(storagePath)
      if (error) throw new Error(`Failed to load file: ${error.message}`)
      return await data.text()
    })

    // ── Step 4: Normalise turns ───────────────────────────────
    const normalisedTurns = await step.run('normalise-turns', async () => {
      return normaliseTranscript(
        rawContent as string | object,
        transcript.platform as Platform
      )
    })

    // ── Step 5: Detect gaps ───────────────────────────────────
    const gaps = await step.run('detect-gaps', async () => {
      if (normalisedTurns.length === 0) return []
      return detectGaps(normalisedTurns)
    })

    // ── Step 6: Store normalised turns + gap count ────────────
    await step.run('update-transcript', async () => {
      await supabase
        .from('transcripts')
        .update({
          normalised_turns: normalisedTurns,
          gap_count: gaps.length,
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', transcriptId)
    })

    // ── Step 7: Insert gap records ────────────────────────────
    await step.run('insert-gaps', async () => {
      if (gaps.length === 0) return

      const profileId = (transcript as { profile_id: string }).profile_id
      await supabase.from('gaps').insert(
        gaps.map((g) => ({
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
      )
    })

    return { transcriptId, gapCount: gaps.length }
  }
)
