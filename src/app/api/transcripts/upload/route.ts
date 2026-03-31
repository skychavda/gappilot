import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'

const ALLOWED_EXTENSIONS = new Set(['txt', 'json', 'csv'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const platform = (formData.get('platform') as string) || 'manual'
  const agentId = formData.get('agent_id') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 5 MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload .txt, .json, or .csv.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // Create transcript record (status: pending)
  const { data: transcript, error: insertError } = await admin
    .from('transcripts')
    .insert({
      profile_id: user.id,
      agent_id: agentId,
      platform,
      status: 'pending',
      gap_count: 0,
      raw_payload: {},
    })
    .select('id')
    .single()

  if (insertError || !transcript) {
    return NextResponse.json({ error: 'Failed to create transcript record' }, { status: 500 })
  }

  const transcriptId = transcript.id

  // Upload file to Supabase Storage
  const storagePath = `${user.id}/${transcriptId}.${ext}`
  const bytes = await file.arrayBuffer()
  const { error: storageError } = await admin.storage
    .from('transcripts')
    .upload(storagePath, bytes, { contentType: file.type || 'text/plain', upsert: false })

  if (storageError) {
    // Still proceed — store raw content inline as fallback
    const rawText = await new Blob([bytes]).text()
    await admin
      .from('transcripts')
      .update({ raw_payload: { content: rawText, filename: file.name } })
      .eq('id', transcriptId)
  } else {
    await admin
      .from('transcripts')
      .update({ storage_path: storagePath, raw_payload: { filename: file.name } } as Record<string, unknown>)
      .eq('id', transcriptId)
  }

  // Trigger Inngest processing event
  await inngest.send({
    name: 'transcript/process',
    data: { transcriptId, userId: user.id },
  })

  return NextResponse.json({ transcriptId }, { status: 201 })
}
