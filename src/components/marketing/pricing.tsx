'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    id: 'solo',
    name: 'Solo',
    monthlyPrice: 49,
    annualPrice: 41,
    description: 'For solo operators managing a single agent.',
    features: [
      '500 transcripts / month',
      '1 agent connection',
      'AI gap detection',
      '5 failure type classification',
      'One-click KB approve',
      'JSON & CSV export',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 149,
    annualPrice: 124,
    description: 'For growing teams running multiple agents.',
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
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 399,
    annualPrice: 332,
    description: 'For agencies managing clients at scale.',
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
    popular: false,
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
            Start with a 14-day free trial. No credit card required.
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 flex flex-col transition-transform ${
                plan.popular
                  ? 'bg-slate-900 text-white ring-2 ring-teal-500 md:scale-105 shadow-2xl shadow-slate-900/30'
                  : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-teal-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-xl font-bold mb-1 ${
                    plan.popular ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mb-5 ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-bold ${
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
                </div>
                {annual && (
                  <p
                    className={`text-xs mt-1 ${
                      plan.popular ? 'text-teal-400' : 'text-teal-600'
                    }`}
                  >
                    Billed annually — ${plan.annualPrice * 12}/yr
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.popular ? 'text-teal-400' : 'text-teal-600'
                      }`}
                    />
                    <span className={plan.popular ? 'text-slate-300' : 'text-slate-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/signup?plan=${plan.id}`}
                className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                  plan.popular
                    ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-10">
          14-day free trial on all plans. No credit card required. Cancel anytime.
        </p>
      </div>
    </section>
  )
}
