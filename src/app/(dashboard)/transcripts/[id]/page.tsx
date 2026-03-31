import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react'
import type { NormalisedTurn, Gap } from '@/types'

const failureColors: Record<string, string> = {
  unknown_topic: 'bg-red-50 text-red-700',
  incomplete_answer: 'bg-amber-50 text-amber-700',
  wrong_answer: 'bg-orange-50 text-orange-700',
  deflection: 'bg-purple-50 text-purple-700',
  repeated_question: 'bg-blue-50 text-blue-700',
}

const severityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default async function TranscriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: transcript } = await supabase
    .from('transcripts')
    .select('*')
    .eq('id', id)
    .eq('profile_id', user.id)
    .single()

  if (!transcript) notFound()

  const { data: gaps } = await supabase
    .from('gaps')
    .select('id, topic, failure_type, severity, customer_question, status')
    .eq('transcript_id', id)
    .order('created_at', { ascending: true })

  const turns = (transcript.normalised_turns ?? []) as NormalisedTurn[]
  const gapList = (gaps ?? []) as Gap[]

  // Failure type counts
  const failureCounts = gapList.reduce<Record<string, number>>((acc, g) => {
    acc[g.failure_type] = (acc[g.failure_type] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div>
        <Link
          href="/transcripts"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All transcripts
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900 mb-1">
                {transcript.external_call_id ?? `Call ${id.slice(0, 8)}`}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="capitalize font-medium text-slate-700">{transcript.platform}</span>
                {transcript.duration_seconds && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.floor(transcript.duration_seconds / 60)}m {transcript.duration_seconds % 60}s
                  </span>
                )}
                <span>{new Date(transcript.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {transcript.status === 'completed' ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                </span>
              ) : transcript.status === 'failed' ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                  <XCircle className="w-3.5 h-3.5" /> Failed
                </span>
              ) : (
                <span className="text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full capitalize">
                  {transcript.status}
                </span>
              )}
            </div>
          </div>
          {transcript.error_message && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {transcript.error_message}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Transcript viewer */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">
              Transcript — {turns.length} turns
            </h2>
          </div>
          <div className="p-4 space-y-1 max-h-[600px] overflow-y-auto">
            {turns.length > 0 ? (
              turns.map((turn, i) => (
                <div
                  key={i}
                  className={`flex gap-3 px-2 py-2 rounded-lg ${
                    turn.speaker === 'agent' ? '' : 'bg-slate-50'
                  }`}
                >
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wide mt-1 w-16 flex-shrink-0 ${
                      turn.speaker === 'agent' ? 'text-teal-600' : 'text-slate-500'
                    }`}
                  >
                    {turn.speaker === 'agent' ? 'Agent' : 'Customer'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 leading-relaxed">{turn.text}</p>
                    {turn.timestamp_ms > 0 && (
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        {formatMs(turn.timestamp_ms)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">
                Transcript not yet processed.
              </p>
            )}
          </div>
        </div>

        {/* Gaps panel */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-4">
              {gapList.length > 0
                ? `${gapList.length} gap${gapList.length !== 1 ? 's' : ''} detected`
                : 'No gaps detected'}
            </h2>
            {Object.keys(failureCounts).length > 0 && (
              <div className="space-y-2">
                {Object.entries(failureCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        failureColors[type] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gap list */}
          {gapList.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {gapList.map((g) => (
                  <div key={g.id} className="p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          severityColors[g.severity] ?? 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {g.severity}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          failureColors[g.failure_type] ?? 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {g.failure_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 line-clamp-2">
                      {g.customer_question}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                <Link
                  href={`/gaps?transcript=${id}`}
                  className="flex items-center justify-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Review all gaps
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
