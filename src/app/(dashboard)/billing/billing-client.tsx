'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CreditCard, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { createBillingPortalSession } from '../actions'
import type { Profile } from '@/types'

const plans = {
  solo: {
    name: 'Solo',
    price: '$49/mo',
    limit: 500,
    features: ['500 transcripts/mo', '1 agent', 'Email support'],
  },
  growth: {
    name: 'Growth',
    price: '$149/mo',
    limit: 2000,
    features: ['2,000 transcripts/mo', '5 agents', 'KB health score', 'Priority support'],
  },
  agency: {
    name: 'Agency',
    price: '$399/mo',
    limit: null,
    features: ['Unlimited transcripts', 'Unlimited agents', 'White-label reports', 'API access'],
  },
}

const statusLabels: Record<string, { label: string; color: string }> = {
  trialing: { label: 'Free trial', color: 'text-blue-600 bg-blue-50' },
  active: { label: 'Active', color: 'text-teal-600 bg-teal-50' },
  past_due: { label: 'Past due', color: 'text-red-600 bg-red-50' },
  canceled: { label: 'Canceled', color: 'text-slate-500 bg-slate-100' },
}

interface BillingClientProps {
  profile: Profile | null
  transcriptCount: number
}

export function BillingClient({ profile, transcriptCount }: BillingClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tier = profile?.subscription_tier ?? 'solo'
  const plan = plans[tier as keyof typeof plans] ?? plans.solo
  const status = profile?.subscription_status
  const statusInfo = status ? statusLabels[status] : null

  const limit = plan.limit
  const usagePct = limit ? Math.min((transcriptCount / limit) * 100, 100) : 0
  const usageColor =
    usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-400' : 'bg-teal-500'

  const handleManageBilling = async () => {
    setLoading(true)
    setError(null)
    const result = await createBillingPortalSession()
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.url) {
      window.location.href = result.url
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">{plan.name} plan</h2>
            <p className="text-slate-500 text-sm mt-0.5">{plan.price}</p>
          </div>
          {statusInfo && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          )}
        </div>

        {/* Usage */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600 font-medium">Transcript usage</span>
            <span className="text-slate-500">
              {transcriptCount.toLocaleString()}
              {limit ? ` / ${limit.toLocaleString()} this month` : ' (unlimited)'}
            </span>
          </div>
          {limit && (
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usageColor}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
          {usagePct >= 90 && limit && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">
              You&apos;re near your limit. Upgrade to avoid interruptions.
            </p>
          )}
        </div>

        {/* Included features */}
        <ul className="space-y-2 mb-6">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}

        <button
          onClick={handleManageBilling}
          disabled={loading || !profile?.stripe_customer_id}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          Manage billing
          <ArrowUpRight className="w-4 h-4" />
        </button>
        {!profile?.stripe_customer_id && (
          <p className="text-xs text-slate-400 mt-2">
            No billing account linked yet. Contact support if this is unexpected.
          </p>
        )}
      </div>

      {/* Upgrade options */}
      {tier !== 'agency' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Need more?</h3>
          <p className="text-sm text-slate-500 mb-4">
            Upgrade your plan to unlock more transcripts, agents, and features.
          </p>
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-semibold"
          >
            View all plans
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
