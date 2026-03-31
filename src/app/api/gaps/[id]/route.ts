import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, suggested_answer } = body as {
    action?: 'approve' | 'skip' | 'undo'
    suggested_answer?: string
  }

  // Fetch gap and verify ownership
  const { data: gap, error: fetchError } = await supabase
    .from('gaps')
    .select('*')
    .eq('id', id)
    .eq('profile_id', user.id)
    .single()

  if (fetchError || !gap) {
    return NextResponse.json({ error: 'Gap not found' }, { status: 404 })
  }

  const now = new Date().toISOString()

  if (action === 'approve') {
    const finalAnswer = (suggested_answer?.trim()) || gap.kb_entry_answer

    const { error: updateError } = await supabase
      .from('gaps')
      .update({ status: 'approved', reviewed_at: now, kb_entry_answer: finalAnswer })
      .eq('id', id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Fetch transcript platform for kb_entry.source_platform
    const { data: transcript } = await supabase
      .from('transcripts')
      .select('platform')
      .eq('id', gap.transcript_id)
      .single()

    const { data: kbEntry, error: kbError } = await supabase
      .from('kb_entries')
      .insert({
        profile_id: user.id,
        gap_id: id,
        question: gap.kb_entry_question,
        answer: finalAnswer,
        topic: gap.topic,
        source_platform: transcript?.platform ?? null,
        is_active: true,
      })
      .select('id')
      .single()

    if (kbError) return NextResponse.json({ error: kbError.message }, { status: 500 })
    return NextResponse.json({ gap: { ...gap, status: 'approved' }, kb_entry_id: kbEntry?.id })
  }

  if (action === 'skip') {
    await supabase
      .from('gaps')
      .update({ status: 'skipped', reviewed_at: now })
      .eq('id', id)
    return NextResponse.json({ gap: { ...gap, status: 'skipped' } })
  }

  if (action === 'undo') {
    await supabase.from('kb_entries').delete().eq('gap_id', id)
    await supabase
      .from('gaps')
      .update({ status: 'pending', reviewed_at: null })
      .eq('id', id)
    return NextResponse.json({ gap: { ...gap, status: 'pending' } })
  }

  // No action — plain field update (e.g. suggested_answer edit)
  if (suggested_answer !== undefined) {
    await supabase
      .from('gaps')
      .update({ kb_entry_answer: suggested_answer.trim() })
      .eq('id', id)
    return NextResponse.json({ gap: { ...gap, kb_entry_answer: suggested_answer } })
  }

  return NextResponse.json({ error: 'No valid action or field update provided' }, { status: 400 })
}
