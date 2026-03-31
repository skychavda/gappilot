'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Upload, FileText, ChevronRight } from 'lucide-react'
import { UploadModal } from '@/components/dashboard/upload-modal'
import type { Transcript } from '@/types'

const statusStyles: Record<string, { bg: string; label: string }> = {
  completed: { bg: 'bg-teal-50 text-teal-700', label: 'Complete' },
  processing: { bg: 'bg-amber-50 text-amber-700', label: 'Processing' },
  pending: { bg: 'bg-slate-100 text-slate-500', label: 'Queued' },
  failed: { bg: 'bg-red-50 text-red-600', label: 'Error' },
}

const platformColors: Record<string, string> = {
  elevenlabs: 'bg-purple-50 text-purple-700',
  vapi: 'bg-blue-50 text-blue-700',
  retell: 'bg-indigo-50 text-indigo-700',
  bland: 'bg-orange-50 text-orange-700',
  manual: 'bg-slate-100 text-slate-600',
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface TranscriptsClientProps {
  transcripts: Transcript[]
}

export function TranscriptsClient({ transcripts }: TranscriptsClientProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-slate-900 font-semibold">All transcripts</h2>
            <p className="text-sm text-slate-400 mt-0.5">{transcripts.length} total</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload transcript
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {transcripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700 mb-1">No transcripts yet</p>
              <p className="text-sm text-slate-400 mb-5 max-w-xs">
                Upload a call transcript or connect a platform to start finding gaps.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Upload your first transcript
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Call ID</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Platform</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Duration</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Gaps</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transcripts.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/transcripts/${t.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800 truncate max-w-[160px]">
                          {t.external_call_id ?? t.id.slice(0, 12) + '…'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${platformColors[t.platform] ?? 'bg-slate-100 text-slate-500'}`}>
                          {t.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyles[t.status]?.bg ?? 'bg-slate-100 text-slate-500'}`}>
                          {statusStyles[t.status]?.label ?? t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDuration(t.duration_seconds)}</td>
                      <td className="px-4 py-3.5">
                        {t.gap_count > 0 ? (
                          <span className="font-semibold text-red-500">{t.gap_count}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <UploadModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
