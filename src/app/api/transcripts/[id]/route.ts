import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: transcript, error } = await supabase
    .from('transcripts')
    .select('*, gaps(count)')
    .eq('id', id)
    .eq('profile_id', user.id)
    .single()

  if (error || !transcript) {
    return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })
  }

  return NextResponse.json(transcript)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: transcript } = await supabase
    .from('transcripts')
    .select('id, storage_path')
    .eq('id', id)
    .eq('profile_id', user.id)
    .single()

  if (!transcript) return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })

  const admin = createAdminClient()

  // Delete associated gaps and KB entries derived from them
  const { data: gaps } = await admin.from('gaps').select('id').eq('transcript_id', id)
  if (gaps && gaps.length > 0) {
    const gapIds = gaps.map((g) => g.id)
    await admin.from('kb_entries').delete().in('gap_id', gapIds)
    await admin.from('gaps').delete().eq('transcript_id', id)
  }

  // Remove from storage if uploaded
  const storagePath = (transcript as { storage_path?: string }).storage_path
  if (storagePath) {
    await admin.storage.from('transcripts').remove([storagePath])
  }

  await admin.from('transcripts').delete().eq('id', id)

  return new NextResponse(null, { status: 204 })
}
