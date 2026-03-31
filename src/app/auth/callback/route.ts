import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createStripeCustomer } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const plan = searchParams.get('plan') ?? 'growth'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const admin = await createAdminClient()
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .single()

  if (existingProfile) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // New user — provision profile
  const email = data.user.email ?? ''
  const fullName =
    (data.user.user_metadata?.full_name as string | undefined) ??
    (data.user.user_metadata?.name as string | undefined) ??
    ''

  let stripeCustomerId: string | null = null
  try {
    stripeCustomerId = await createStripeCustomer(email, fullName)
  } catch {
    // Non-fatal — Stripe customer can be created later
  }

  await admin.from('profiles').insert({
    id: data.user.id,
    email,
    full_name: fullName,
    stripe_customer_id: stripeCustomerId,
    subscription_tier: plan,
    subscription_status: 'trialing',
  })

  return NextResponse.redirect(`${origin}/onboarding`)
}
