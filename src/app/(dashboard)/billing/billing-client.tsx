'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CreditCard, ArrowUpRight, CheckCircle2, Zap, TrendingUp } from 'lucide-react'
import { createBillingPortalSession } from '../actions'
import type { Profile } from '@/types'
import { CREDIT_PACKAGES, type CreditPackageKey } from '@/lib/pricing'

const subscriptionPlans = {
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
  const [buyingPackage, setBuyingPackage] = useState<CreditPackageKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tier = profile?.subscription_tier

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

  const handleBuyCredits = async (packageKey: CreditPackageKey) => {
    setBuyingPackage(packageKey)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'credits', package: packageKey }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.error) {
        setError(data.error)
      } else if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Failed to start checkout. Please try again.')
    } finally {
      setBuyingPackage(null)
    }
  }

  const handleUpgrade = async (plan: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.error) {
        setError(data.error)
      } else if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Starter: credit-based view ────────────────────────────────
  if (tier === 'starter') {
    const balance = profile?.credits_balance ?? 0
    const isLow = balance > 0 && balance <= 3
    const isEmpty = balance === 0

    return (
      <div className="max-w-2xl space-y-5">
        {/* Credits balance */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Free Starter</h2>
              <p className="text-slate-500 text-sm mt-0.5">Pay-per-use · No monthly fee</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-teal-600 bg-teal-50">
              Free
            </span>
          </div>

          <div
            className={`rounded-xl p-4 mb-5 ${
              isEmpty
                ? 'bg-red-50 border border-red-100'
                : isLow
                ? 'bg-amber-50 border border-amber-100'
                : 'bg-teal-50 border border-teal-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Zap
                className={`w-6 h-6 flex-shrink-0 ${
                  isEmpty ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-teal-600'
                }`}
              />
              <div>
                <p
                  className={`text-2xl font-bold ${
                    isEmpty ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-teal-700'
                  }`}
                >
                  {balance}{' '}
                  <span className="text-base font-medium">credits remaining</span>
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-teal-600'
                  }`}
                >
                  {isEmpty
                    ? 'Top up to continue analysing calls'
                    : isLow
                    ? 'Running low — top up soon'
                    : `1 credit = 1 call analysed · ${transcriptCount} calls processed so far`}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <h3 className="font-semibold text-slate-900 mb-3 text-sm">Top up credits</h3>
          <div className="grid grid-cols-3 gap-3">
            {(
              Object.entries(CREDIT_PACKAGES) as [
                CreditPackageKey,
                (typeof CREDIT_PACKAGES)[CreditPackageKey],
              ][]
            ).map(([key, pkg]) => (
              <button
                key={key}
                onClick={() => handleBuyCredits(key)}
                disabled={!!buyingPackage || loading}
                className="flex flex-col items-center text-center border-2 border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 disabled:opacity-50 rounded-xl p-4 transition-all"
              >
                {buyingPackage === key ? (
                  <Loader2 className="w-4 h-4 animate-spin text-teal-500 mb-2" />
                ) : (
                  <span className="text-2xl font-bold text-slate-900 mb-1">{pkg.credits}</span>
                )}
                <span className="text-xs text-slate-500 mb-2">credits</span>
                <span className="text-sm font-bold text-teal-600">${pkg.price}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">${pkg.pricePerCredit}/each</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upgrade to subscription */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900">Upgrade to a subscription</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Better value if you analyse more than 50 calls/month.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(
              Object.entries(subscriptionPlans) as [
                string,
                (typeof subscriptionPlans)[keyof typeof subscriptionPlans],
              ][]
            ).map(([key, plan]) => (
              <button
                key={key}
                onClick={() => handleUpgrade(key)}
                disabled={loading || !!buyingPackage}
                className="flex flex-col items-start border border-slate-200 hover:border-teal-400 hover:bg-slate-50 disabled:opacity-50 rounded-xl p-3.5 text-left transition-all"
              >
                <span className="font-semibold text-slate-900 text-sm">{plan.name}</span>
                <span className="text-teal-600 font-bold text-sm mt-0.5">{plan.price}</span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {plan.limit ? `${plan.limit.toLocaleString()} calls/mo` : 'Unlimited calls'}
                </span>
              </button>
            ))}
          </div>
          {loading && (
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Redirecting to checkout…
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Subscription plan view ────────────────────────────────────
  const plan =
    subscriptionPlans[tier as keyof typeof subscriptionPlans] ?? subscriptionPlans.solo
  const status = profile?.subscription_status
  const statusInfo = status ? statusLabels[status] : null
  const limit = plan.limit
  const usagePct = limit ? Math.min((transcriptCount / limit) * 100, 100) : 0
  const usageColor =
    usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-400' : 'bg-teal-500'

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">{plan.name} plan</h2>
            <p className="text-slate-500 text-sm mt-0.5">{plan.price}</p>
          </div>
          {statusInfo && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          )}
        </div>

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
              You're near your limit. Upgrade to avoid interruptions.
            </p>
          )}
        </div>

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
      </div>

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
