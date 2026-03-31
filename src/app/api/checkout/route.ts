import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCheckoutSession } from '@/lib/stripe'
import { PLANS, type PlanKey } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  // Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let plan: PlanKey
  try {
    const body = await request.json() as { plan?: string }
    if (!body.plan || !(body.plan in PLANS)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    plan = body.plan as PlanKey
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Fetch profile to get stripe_customer_id
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

  // Prevent downgrade to the same plan
  if (profile.subscription_tier === plan) {
    return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
  }

  const priceId = PLANS[plan].stripePriceId
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
