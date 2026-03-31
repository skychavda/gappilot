'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Zap } from 'lucide-react'

const plans = [
  {
    id: 'starter',
    name: 'Free Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    description: '15 free credits on signup. Buy more as you need.',
    badge: '15 credits free',
    features: [
      '15 free credits included',
      '1 credit = 1 call analysed',
      'AI gap detection',
      '5 failure type classification',
      'One-click KB approve',
      'JSON & CSV export',
      'Top up from $0.24/credit',
    ],
    cta: 'Get started free',
    ctaHref: '/signup',
    popular: false,
    payPerUse: true,
  },
  {
    id: 'solo',
    name: 'Solo',
    monthlyPrice: 49,
    annualPrice: 41,
    description: 'For solo operators managing a single agent.',
    badge: null,
    features: [
      '500 transcripts / month',
      '1 agent connection',
      'AI gap detection',
      '5 failure type classification',
      'One-click KB approve',
      'JSON & CSV export',
      'Email support',
    ],
    cta: 'Start free trial',
    ctaHref: '/signup',
    popular: false,
    payPerUse: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 149,
    annualPrice: 124,
    description: 'For growing teams running multiple agents.',
    badge: 'Most Popular',
    features: [
      '2,000 transcripts / month',
      '5 agent connections',
      'AI gap detection',
      '5 failure type classification',
      'One-click KB approve',
      'KB health score',
      'JSON & CSV export',
      'Priority support',
      '3 team seats',
    ],
    cta: 'Start free trial',
    ctaHref: '/signup',
    popular: true,
    payPerUse: false,
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 399,
    annualPrice: 332,
    description: 'For agencies managing clients at scale.',
    badge: null,
    features: [
      'Unlimited transcripts',
      'Unlimited agent connections',
      'AI gap detection',
      '5 failure type classification',
      'One-click KB approve',
      'KB health score',
      'JSON & CSV export',
      'Dedicated support',
      'Unlimited team seats',
      'White-label reports',
      'API access',
    ],
    cta: 'Start free trial',
    ctaHref: '/signup',
    popular: false,
    payPerUse: false,
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8">
            Start free with 15 credits. Upgrade when you need more.
          </p>

          <div className="inline-flex items-center gap-1 bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                !annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Annual
              <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-semibold">
                2 months free
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col transition-all ${
                plan.popular
                  ? 'bg-slate-900 text-white ring-2 ring-teal-500 shadow-2xl shadow-slate-900/30'
                  : plan.payPerUse
                  ? 'bg-teal-50 border-2 border-teal-200'
                  : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap inline-flex items-center gap-1 ${
                      plan.popular
                        ? 'bg-teal-500 text-white'
                        : 'bg-teal-100 text-teal-700 border border-teal-200'
                    }`}
                  >
                    {plan.payPerUse && <Zap className="w-3 h-3" />}
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5 mt-2">
                <h3
                  className={`text-lg font-bold mb-1 ${
                    plan.popular
                      ? 'text-white'
                      : plan.payPerUse
                      ? 'text-teal-900'
                      : 'text-slate-900'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mb-4 ${
                    plan.popular
                      ? 'text-slate-400'
                      : plan.payPerUse
                      ? 'text-teal-700'
                      : 'text-slate-500'
                  }`}
                >
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  {plan.payPerUse ? (
                    <span className="text-3xl font-bold text-teal-800">Free</span>
                  ) : (
                    <>
                      <span
                        className={`text-3xl font-bold ${
                          plan.popular ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        ${annual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span
                        className={`text-sm ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}
                      >
                        /mo
                      </span>
                    </>
                  )}
                </div>
                {!plan.payPerUse && annual && (
                  <p
                    className={`text-xs mt-1 ${plan.popular ? 'text-teal-400' : 'text-teal-600'}`}
                  >
                    Billed annually — ${plan.annualPrice * 12}/yr
                  </p>
                )}
                {plan.payPerUse && (
                  <p className="text-xs mt-1 text-teal-600 font-medium">then from $0.24/credit</p>
                )}
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.popular ? 'text-teal-400' : 'text-teal-600'
                      }`}
                    />
                    <span
                      className={
                        plan.popular
                          ? 'text-slate-300'
                          : plan.payPerUse
                          ? 'text-teal-800'
                          : 'text-slate-600'
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-2.5 px-5 rounded-xl font-semibold text-sm transition-all ${
                  plan.popular
                    ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-sm'
                    : plan.payPerUse
                    ? 'bg-teal-600 hover:bg-teal-500 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-10">
          Free starter — no credit card required. Subscription plans include a 14-day free trial.
        </p>
      </div>
    </section>
  )
}
