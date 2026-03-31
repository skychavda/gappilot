import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCheckoutSession, createCreditCheckoutSession } from '@/lib/stripe'
import { PLANS, CREDIT_PACKAGES, type PlanKey, type CreditPackageKey } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { type?: string; plan?: string; package?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('stripe_customer_id, subscription_tier')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (!profile.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer on file' }, { status: 400 })
  }

  // ── Credit top-up (one-time payment) ─────────────────────────
  if (body.type === 'credits') {
    const packageKey = body.package
    if (!packageKey || !(packageKey in CREDIT_PACKAGES)) {
      return NextResponse.json({ error: 'Invalid credit package' }, { status: 400 })
    }

    const pkg = CREDIT_PACKAGES[packageKey as CreditPackageKey]
    if (!pkg.stripePriceId) {
      return NextResponse.json({ error: 'Credit package price not configured' }, { status: 500 })
    }

    try {
      const url = await createCreditCheckoutSession(
        user.id,
        pkg.stripePriceId,
        pkg.credits,
        packageKey,
        profile.stripe_customer_id,
      )
      return NextResponse.json({ url })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout session'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // ── Subscription checkout ─────────────────────────────────────
  const plan = body.plan
  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  if (profile.subscription_tier === plan) {
    return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
  }

  const priceId = PLANS[plan as PlanKey].stripePriceId
  if (!priceId) {
    return NextResponse.json({ error: 'Price ID not configured for this plan' }, { status: 500 })
  }

  try {
    const url = await createCheckoutSession(user.id, priceId, profile.stripe_customer_id)
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
