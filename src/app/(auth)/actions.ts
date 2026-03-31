'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createStripeCustomer } from '@/lib/stripe'

export async function signIn(
  formData: FormData
): Promise<{ error: string } | void> {
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function signUp(
  formData: FormData
): Promise<{ error: string } | void> {
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string).trim()
  const plan = (formData.get('plan') as string) || 'solo'

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  if (!data.user) return { error: 'Sign up failed. Please try again.' }

  let stripeCustomerId: string | null = null
  try {
    stripeCustomerId = await createStripeCustomer(email, fullName)
  } catch {
    // Non-fatal — Stripe customer can be created later
  }

  const admin = await createAdminClient()
  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    email,
    full_name: fullName,
    stripe_customer_id: stripeCustomerId,
    subscription_tier: plan,
    subscription_status: 'trialing',
  })
  if (profileError) return { error: 'Account created but profile setup failed. Contact support.' }

  redirect('/dashboard/onboarding')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function signInWithGoogle(plan?: string): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const callbackUrl = plan
    ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?plan=${plan}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl },
  })
  if (error) return { error: error.message }
  redirect(data.url)
}

export async function resetPassword(
  email: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updatePassword(
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  redirect('/dashboard')
}
