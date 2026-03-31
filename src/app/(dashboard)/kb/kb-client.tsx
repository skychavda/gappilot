'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Download, Edit3, Trash2, Check, X, BookOpen, ChevronDown, CheckCircle2 } from 'lucide-react'
import { updateKBEntry, deleteKBEntry } from '../actions'
import type { KBEntry } from '@/types'

function exportKB(entries: KBEntry[], format: 'json' | 'csv') {
  if (format === 'json') {
    const blob = new Blob(
      [JSON.stringify(entries.map((e) => ({ question: e.question, answer: e.answer, topic: e.topic })), null, 2)],
      { type: 'application/json' }
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gappilot-kb-${Date.now()}.json`
    a.click()
  } else {
    const headers = ['question', 'answer', 'topic', 'source_platform', 'created_at']
    const rows = entries.map((e) =>
      headers.map((h) => `"${String(e[h as keyof KBEntry] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gappilot-kb-${Date.now()}.csv`
    a.click()
  }
}

interface KBClientProps {
  entries: KBEntry[]
}

export function KBClient({ entries: initialEntries }: KBClientProps) {
  const [entries, setEntries] = useState<KBEntry[]>(initialEntries)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.question.toLowerCase().includes(search.toLowerCase()) ||
          e.answer.toLowerCase().includes(search.toLowerCase())
      ),
    [entries, search]
  )

  const handleEditSave = async (id: string) => {
    const newAnswer = editValues[id]
    if (!newAnswer?.trim()) return
    setSavingId(id)
    const result = await updateKBEntry(id, newAnswer)
    if (!result.error) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, answer: newAnswer } : e))
      )
      setEditingId(null)
    }
    setSavingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this KB entry? This cannot be undone.')) return
    setDeletingId(id)
    await deleteKBEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-slate-900">Knowledge base</h2>
          <p className="text-sm text-slate-400 mt-0.5">{entries.length} entries</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            disabled={entries.length === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-2 rounded-lg transition-all disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-10">
              <button
                onClick={() => { exportKB(entries, 'json'); setExportOpen(false) }}
                className="w-full text-left text-sm px-3 py-2 hover:bg-slate-50 text-slate-700"
              >
                Export JSON
              </button>
              <button
                onClick={() => { exportKB(entries, 'csv'); setExportOpen(false) }}
                className="w-full text-left text-sm px-3 py-2 hover:bg-slate-50 text-slate-700"
              >
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search questions and answers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {search ? (
              <>
                <BookOpen className="w-10 h-10 text-slate-200 mb-4" />
                <p className="font-medium text-slate-500">No entries match your search.</p>
                <button
                  onClick={() => setSearch('')}
                  className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700 mb-1">No approved entries yet</p>
                <p className="text-sm text-slate-400 mb-5 max-w-xs">
                  Review gaps and approve answers to build your knowledge base.
                </p>
                <Link
                  href="/dashboard/gaps"
                  className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Review gaps
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((entry) => {
              const isEditing = editingId === entry.id

              return (
                <div key={entry.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Question */}
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 w-12 flex-shrink-0">
                          Q
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{entry.question}</p>
                      </div>

                      {/* Answer */}
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mt-0.5 w-12 flex-shrink-0">
                          A
                        </span>
                        {isEditing ? (
                          <div className="flex-1 space-y-2">
                            <textarea
                              value={editValues[entry.id] ?? entry.answer}
                              onChange={(e) =>
                                setEditValues((prev) => ({ ...prev, [entry.id]: e.target.value }))
                              }
                              rows={3}
                              className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditSave(entry.id)}
                                disabled={savingId === entry.id}
                                className="flex items-center gap-1.5 text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                            {entry.answer}
                          </p>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 pl-14">
                        {entry.topic && (
                          <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            {entry.topic}
                          </span>
                        )}
                        {entry.source_platform && (
                          <span className="text-[11px] text-slate-400 capitalize">
                            via {entry.source_platform}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-300">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(entry.id)
                            setEditValues((prev) => ({ ...prev, [entry.id]: entry.answer }))
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit answer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
