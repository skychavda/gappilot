'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X, Edit3, RotateCcw, Download, CheckCheck, ChevronDown, Sparkles, Upload } from 'lucide-react'
import { approveGap, skipGap, undoGapAction, approveAllVisible } from '../actions'
import type { Gap, FailureType, Severity } from '@/types'

const severityBadge: Record<Severity, string> = {
  high: 'bg-red-500 text-white',
  medium: 'bg-amber-400 text-white',
  low: 'bg-blue-400 text-white',
}

const failureBadge: Record<FailureType, string> = {
  unknown_topic: 'bg-red-50 text-red-700 border border-red-100',
  incomplete_answer: 'bg-amber-50 text-amber-700 border border-amber-100',
  wrong_answer: 'bg-orange-50 text-orange-700 border border-orange-100',
  deflection: 'bg-purple-50 text-purple-700 border border-purple-100',
  repeated_question: 'bg-blue-50 text-blue-700 border border-blue-100',
}

const failureLabel: Record<FailureType, string> = {
  unknown_topic: "Doesn't know",
  incomplete_answer: 'Incomplete',
  wrong_answer: 'Wrong answer',
  deflection: 'Deflected',
  repeated_question: 'Repeated Q',
}

function exportData(gaps: Gap[], format: 'json' | 'csv') {
  if (format === 'json') {
    const blob = new Blob(
      [JSON.stringify(gaps.map((g) => ({ question: g.kb_entry_question, answer: g.kb_entry_answer, topic: g.topic, failure_type: g.failure_type, severity: g.severity })), null, 2)],
      { type: 'application/json' }
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gappilot-gaps-${Date.now()}.json`
    a.click()
  } else {
    const headers = ['topic', 'failure_type', 'severity', 'customer_question', 'kb_entry_question', 'kb_entry_answer']
    const rows = gaps.map((g) =>
      headers.map((h) => `"${String(g[h as keyof Gap] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gappilot-gaps-${Date.now()}.csv`
    a.click()
  }
}

interface GapsClientProps {
  gaps: Gap[]
}

export function GapsClient({ gaps: initialGaps }: GapsClientProps) {
  const router = useRouter()
  const [gaps, setGaps] = useState<Gap[]>(initialGaps)
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>({})
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [exportOpen, setExportOpen] = useState(false)

  const filtered = useMemo(() => {
    return gaps.filter((g) => {
      if (filterSeverity !== 'all' && g.severity !== filterSeverity) return false
      if (filterType !== 'all' && g.failure_type !== filterType) return false
      if (filterStatus !== 'all' && g.status !== filterStatus) return false
      return true
    })
  }, [gaps, filterSeverity, filterType, filterStatus])

  const pendingCount = gaps.filter((g) => g.status === 'pending').length

  const setLoading = (id: string, val: boolean) =>
    setLoadingIds((prev) => {
      const next = new Set(prev)
      val ? next.add(id) : next.delete(id)
      return next
    })

  const optimisticUpdate = (id: string, status: Gap['status']) =>
    setGaps((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)))

  const handleApprove = async (gap: Gap) => {
    setLoading(gap.id, true)
    const editedAnswer = editedAnswers[gap.id]
    optimisticUpdate(gap.id, 'approved')
    const result = await approveGap(gap.id, editedAnswer)
    if (result.error) {
      optimisticUpdate(gap.id, 'pending')
    } else {
      setEditingId(null)
      router.refresh()
    }
    setLoading(gap.id, false)
  }

  const handleSkip = async (gapId: string) => {
    setLoading(gapId, true)
    optimisticUpdate(gapId, 'skipped')
    const result = await skipGap(gapId)
    if (result.error) optimisticUpdate(gapId, 'pending')
    setLoading(gapId, false)
  }

  const handleUndo = async (gapId: string) => {
    setLoading(gapId, true)
    optimisticUpdate(gapId, 'pending')
    await undoGapAction(gapId)
    router.refresh()
    setLoading(gapId, false)
  }

  const handleApproveAll = async () => {
    const pendingVisible = filtered.filter((g) => g.status === 'pending').map((g) => g.id)
    setGaps((prev) =>
      prev.map((g) => (pendingVisible.includes(g.id) ? { ...g, status: 'approved' } : g))
    )
    await approveAllVisible(pendingVisible)
    router.refresh()
  }

  const approvedGaps = gaps.filter((g) => g.status === 'approved')
  const hasNoGapsAtAll = gaps.length === 0
  const allReviewed = gaps.length > 0 && pendingCount === 0 && filterStatus === 'pending'

  return (
    <div className="flex gap-5 h-full">
      {/* ── Filter sidebar ──────────────────────────────── */}
      <aside className="hidden lg:block w-52 flex-shrink-0 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-5">
          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Status
            </p>
            <div className="space-y-1">
              {[
                { val: 'all', label: 'All' },
                { val: 'pending', label: 'Pending' },
                { val: 'approved', label: 'Approved' },
                { val: 'skipped', label: 'Skipped' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setFilterStatus(val)}
                  className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${
                    filterStatus === val
                      ? 'bg-teal-50 text-teal-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Severity
            </p>
            <div className="space-y-1">
              {['all', 'high', 'medium', 'low'].map((val) => (
                <button
                  key={val}
                  onClick={() => setFilterSeverity(val)}
                  className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                    filterSeverity === val
                      ? 'bg-teal-50 text-teal-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {val !== 'all' && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        val === 'high' ? 'bg-red-500' : val === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                      }`}
                    />
                  )}
                  <span className="capitalize">{val}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Failure type */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Failure type
            </p>
            <div className="space-y-1">
              {[
                { val: 'all', label: 'All types' },
                { val: 'unknown_topic', label: "Doesn't know" },
                { val: 'incomplete_answer', label: 'Incomplete' },
                { val: 'wrong_answer', label: 'Wrong answer' },
                { val: 'deflection', label: 'Deflected' },
                { val: 'repeated_question', label: 'Repeated Q' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setFilterType(val)}
                  className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${
                    filterType === val
                      ? 'bg-teal-50 text-teal-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main panel ──────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            {pendingCount > 0 && (
              <span className="text-sm font-semibold text-slate-700">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mr-1.5">
                  {pendingCount}
                </span>
                pending
              </span>
            )}
            <span className="text-sm text-slate-400">{filtered.length} visible</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApproveAll}
              disabled={filtered.filter((g) => g.status === 'pending').length === 0}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-teal-700 border border-slate-200 hover:border-teal-300 px-3 py-2 rounded-lg transition-all disabled:opacity-40"
            >
              <CheckCheck className="w-4 h-4" />
              Approve all visible
            </button>

            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                disabled={approvedGaps.length === 0}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-2 rounded-lg transition-all disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-10">
                  <button
                    onClick={() => { exportData(approvedGaps, 'json'); setExportOpen(false) }}
                    className="w-full text-left text-sm px-3 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => { exportData(approvedGaps, 'csv'); setExportOpen(false) }}
                    className="w-full text-left text-sm px-3 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    Export CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gap cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center shadow-sm">
            {hasNoGapsAtAll ? (
              <>
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700 mb-1">No gaps yet</p>
                <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
                  Upload a transcript to start detecting knowledge gaps in your agent.
                </p>
                <Link
                  href="/dashboard/transcripts"
                  className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload a transcript
                </Link>
              </>
            ) : allReviewed ? (
              <>
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-teal-500" />
                </div>
                <p className="font-semibold text-slate-700 mb-1">Your agent is doing great!</p>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                  All gaps have been reviewed. Upload more transcripts to keep improving.
                </p>
              </>
            ) : (
              <>
                <p className="text-slate-400 text-sm">No gaps match the current filters.</p>
                <button
                  onClick={() => { setFilterSeverity('all'); setFilterType('all'); setFilterStatus('all') }}
                  className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((gap) => {
              const isLoading = loadingIds.has(gap.id)
              const isEditing = editingId === gap.id
              const answer = editedAnswers[gap.id] ?? gap.kb_entry_answer

              if (gap.status === 'approved') {
                return (
                  <div
                    key={gap.id}
                    className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Check className="w-5 h-5 text-teal-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-teal-800 truncate">
                          {gap.customer_question}
                        </p>
                        <p className="text-xs text-teal-600 mt-0.5">Added to knowledge base</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUndo(gap.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 font-medium flex-shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Undo
                    </button>
                  </div>
                )
              }

              if (gap.status === 'skipped') {
                return (
                  <div
                    key={gap.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4 opacity-60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <X className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <p className="text-sm text-slate-500 truncate">{gap.customer_question}</p>
                    </div>
                    <button
                      onClick={() => handleUndo(gap.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium flex-shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                  </div>
                )
              }

              return (
                <div
                  key={gap.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    {/* Badges row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                          severityBadge[gap.severity]
                        }`}
                      >
                        {gap.severity}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          failureBadge[gap.failure_type]
                        }`}
                      >
                        {failureLabel[gap.failure_type]}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-auto">{gap.topic}</span>
                    </div>

                    {/* Customer question */}
                    <div>
                      <p className="text-base font-semibold text-slate-900 leading-snug">
                        {gap.customer_question}
                      </p>
                    </div>

                    {/* Agent response */}
                    <div className="bg-slate-50 rounded-xl p-3.5">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        What the agent said
                      </p>
                      <p className="text-sm text-slate-600 italic leading-relaxed">
                        &ldquo;{gap.agent_response}&rdquo;
                      </p>
                    </div>

                    {/* Suggested answer */}
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-semibold text-teal-600 uppercase tracking-wide">
                          ✦ Suggested answer
                        </p>
                        <button
                          onClick={() => setEditingId(isEditing ? null : gap.id)}
                          className="flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-800 font-medium"
                        >
                          <Edit3 className="w-3 h-3" />
                          {isEditing ? 'Done' : 'Edit'}
                        </button>
                      </div>
                      {isEditing ? (
                        <textarea
                          value={answer}
                          onChange={(e) =>
                            setEditedAnswers((prev) => ({ ...prev, [gap.id]: e.target.value }))
                          }
                          rows={4}
                          className="w-full text-sm text-teal-900 bg-white border border-teal-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        />
                      ) : (
                        <p className="text-sm text-teal-800 leading-relaxed">{answer}</p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex border-t border-slate-100">
                    <button
                      onClick={() => handleApprove(gap)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Approve & add to KB
                    </button>
                    <div className="w-px bg-slate-100" />
                    <button
                      onClick={() => handleSkip(gap.id)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Skip
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
