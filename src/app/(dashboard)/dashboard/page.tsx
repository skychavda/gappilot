import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  FileAudio,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Upload,
  Plug,
  Clock,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react'
import type { Transcript, Gap } from '@/types'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

const statusStyles: Record<string, string> = {
  completed: 'bg-teal-50 text-teal-700',
  processing: 'bg-amber-50 text-amber-700',
  pending: 'bg-slate-100 text-slate-500',
  failed: 'bg-red-50 text-red-600',
}

const severityDot: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-blue-400',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalTranscripts },
    { count: totalGaps },
    { count: approvedThisMonth },
    { count: totalApproved },
    { data: recentTranscripts },
    { data: recentApproved },
    { count: platformCount },
  ] = await Promise.all([
    supabase.from('transcripts').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
    supabase.from('gaps').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
    supabase.from('gaps').select('*', { count: 'exact', head: true }).eq('profile_id', user.id).eq('status', 'approved').gte('reviewed_at', startOfMonth),
    supabase.from('gaps').select('*', { count: 'exact', head: true }).eq('profile_id', user.id).eq('status', 'approved'),
    supabase.from('transcripts').select('id, external_call_id, platform, status, gap_count, created_at').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('gaps').select('id, topic, severity, customer_question, reviewed_at').eq('profile_id', user.id).eq('status', 'approved').order('reviewed_at', { ascending: false }).limit(5),
    supabase.from('platform_connections').select('*', { count: 'exact', head: true }).eq('profile_id', user.id).eq('is_active', true),
  ])

  const healthScore =
    totalGaps && totalGaps > 0 ? Math.round(((totalApproved ?? 0) / totalGaps) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Transcripts processed"
          value={totalTranscripts ?? 0}
          icon={FileAudio}
          color="bg-slate-100 text-slate-600"
        />
        <StatCard
          label="Gaps detected"
          value={totalGaps ?? 0}
          icon={AlertTriangle}
          color="bg-red-50 text-red-500"
        />
        <StatCard
          label="Approved this month"
          value={approvedThisMonth ?? 0}
          sub="KB entries added"
          icon={CheckCircle2}
          color="bg-teal-50 text-teal-600"
        />
        <StatCard
          label="KB health score"
          value={`${healthScore}%`}
          sub="Gaps resolved"
          icon={TrendingUp}
          color="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent transcripts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">Recent transcripts</h2>
            <Link
              href="/transcripts"
              className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTranscripts && recentTranscripts.length > 0 ? (
              recentTranscripts.map((t) => (
                <Link
                  key={t.id}
                  href={`/transcripts/${t.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileAudio className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {t.external_call_id ?? t.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-slate-400 capitalize">{t.platform}</p>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      statusStyles[t.status] ?? 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {t.status}
                  </span>
                  {t.gap_count > 0 && (
                    <span className="text-xs text-red-500 font-semibold">
                      {t.gap_count} gap{t.gap_count !== 1 ? 's' : ''}
                    </span>
                  )}
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 flex-shrink-0" />
                </Link>
              ))
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-slate-400">No transcripts yet.</p>
                <Link
                  href="/transcripts"
                  className="mt-2 inline-block text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Upload your first transcript →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-4">Quick actions</h2>
            <div className="space-y-2.5">
              <Link
                href="/transcripts"
                className="flex items-center gap-3 w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload transcript
              </Link>
              {(platformCount ?? 0) === 0 && (
                <Link
                  href="/settings"
                  className="flex items-center gap-3 w-full border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-700 hover:text-teal-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                >
                  <Plug className="w-4 h-4" />
                  Connect a platform
                </Link>
              )}
              <Link
                href="/gaps"
                className="flex items-center gap-3 w-full border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Review gaps
              </Link>
            </div>
          </div>

          {/* Recently approved */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm">Recently approved</h2>
              <Link
                href="/kb"
                className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5"
              >
                KB <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentApproved && recentApproved.length > 0 ? (
                recentApproved.map((g) => (
                  <div key={g.id} className="px-5 py-3 flex items-start gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                        severityDot[g.severity] ?? 'bg-slate-300'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 line-clamp-2">
                        {g.customer_question}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(g.reviewed_at!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-6 text-center">
                  <p className="text-xs text-slate-400">No approvals yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
