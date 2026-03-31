import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Gap } from '@/types'

function toCSV(gaps: Gap[]): string {
  const headers = [
    'topic',
    'failure_type',
    'severity',
    'customer_question',
    'agent_response',
    'kb_entry_question',
    'kb_entry_answer',
    'reviewed_at',
  ]
  const escape = (val: unknown) =>
    `"${String(val ?? '').replace(/"/g, '""')}"`
  const rows = gaps.map((g) =>
    headers.map((h) => escape(g[h as keyof Gap])).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const format = searchParams.get('format') === 'csv' ? 'csv' : 'json'
  const agentId = searchParams.get('agent_id')
  const transcriptId = searchParams.get('transcript_id')

  let query = supabase
    .from('gaps')
    .select('*')
    .eq('profile_id', user.id)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })

  if (agentId) {
    // Filter via transcript join
    query = query.eq('transcripts.agent_id', agentId)
  }
  if (transcriptId) {
    query = query.eq('transcript_id', transcriptId)
  }

  const { data: gaps, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const exportedAt = new Date().toISOString()
  const filename = `gappilot-gaps-${exportedAt.split('T')[0]}`

  // Log export (non-fatal)
  supabase.from('exports').insert({
    profile_id: user.id,
    format,
    gap_count: gaps?.length ?? 0,
    exported_at: exportedAt,
  }).then(() => {})

  if (format === 'csv') {
    const csv = toCSV((gaps as Gap[]) ?? [])
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    })
  }

  const json = JSON.stringify(
    ((gaps as Gap[]) ?? []).map((g) => ({
      topic: g.topic,
      failure_type: g.failure_type,
      severity: g.severity,
      customer_question: g.customer_question,
      agent_response: g.agent_response,
      kb_entry: { question: g.kb_entry_question, answer: g.kb_entry_answer },
      reviewed_at: g.reviewed_at,
    })),
    null,
    2
  )

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.json"`,
    },
  })
}
