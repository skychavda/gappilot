export const PLANS = {
  solo: {
    name: 'Solo',
    price: 49,
    calls: 500,
    platforms: 1,
    stripePriceId: process.env.STRIPE_PRICE_SOLO_MONTHLY!,
  },
  growth: {
    name: 'Growth',
    price: 149,
    calls: 2000,
    platforms: 3,
    stripePriceId: process.env.STRIPE_PRICE_GROWTH_MONTHLY!,
  },
  agency: {
    name: 'Agency',
    price: 399,
    calls: 999999,
    platforms: 999,
    stripePriceId: process.env.STRIPE_PRICE_AGENCY_MONTHLY!,
  },
} as const

export type PlanKey = keyof typeof PLANS

export function getPlanByPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId === priceId) return key as PlanKey
  }
  return null
}

export function getPlanCallLimit(tier: PlanKey): number {
  return PLANS[tier].calls
}

export function isUnlimited(tier: PlanKey): boolean {
  return PLANS[tier].calls >= 999999
}
