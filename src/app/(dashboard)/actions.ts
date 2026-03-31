'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Stripe from 'stripe'

// ── Gaps ──────────────────────────────────────────────────────

export async function approveGap(
  gapId: string,
  editedAnswer?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: gap } = await supabase
    .from('gaps')
    .select('*, transcripts(platform)')
    .eq('id', gapId)
    .eq('profile_id', user.id)
    .single()
  if (!gap) return { error: 'Gap not found' }

  const finalAnswer = editedAnswer?.trim() || gap.kb_entry_answer

  const { error: updateError } = await supabase
    .from('gaps')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), kb_entry_answer: finalAnswer })
    .eq('id', gapId)
  if (updateError) return { error: updateError.message }

  await supabase.from('kb_entries').insert({
    profile_id: user.id,
    gap_id: gapId,
    question: gap.kb_entry_question,
    answer: finalAnswer,
    topic: gap.topic,
    source_platform: gap.transcripts?.platform ?? null,
    is_active: true,
  })

  revalidatePath('/dashboard/gaps')
  revalidatePath('/dashboard/kb')
  return {}
}

export async function skipGap(gapId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('gaps')
    .update({ status: 'skipped', reviewed_at: new Date().toISOString() })
    .eq('id', gapId)
    .eq('profile_id', user.id)

  revalidatePath('/dashboard/gaps')
  return {}
}

export async function undoGapAction(gapId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('kb_entries').delete().eq('gap_id', gapId)
  await supabase
    .from('gaps')
    .update({ status: 'pending', reviewed_at: null })
    .eq('id', gapId)
    .eq('profile_id', user.id)

  revalidatePath('/dashboard/gaps')
  revalidatePath('/dashboard/kb')
  return {}
}

export async function approveAllVisible(gapIds: string[]): Promise<{ error?: string }> {
  const results = await Promise.all(gapIds.map((id) => approveGap(id)))
  const firstError = results.find((r) => r.error)
  return firstError ? { error: firstError.error } : {}
}

// ── KB ────────────────────────────────────────────────────────

export async function updateKBEntry(
  entryId: string,
  answer: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('kb_entries')
    .update({ answer })
    .eq('id', entryId)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/kb')
  return {}
}

export async function deleteKBEntry(entryId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('kb_entries').delete().eq('id', entryId).eq('profile_id', user.id)
  revalidatePath('/dashboard/kb')
  return {}
}

// ── Profile ───────────────────────────────────────────────────

export async function updateProfile(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: (formData.get('full_name') as string).trim(),
      company_name: (formData.get('company_name') as string).trim(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return {}
}

// ── Platform connections ──────────────────────────────────────

export async function connectPlatform(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('platform_connections').insert({
    profile_id: user.id,
    platform: formData.get('platform') as string,
    api_key: formData.get('api_key') as string,
    display_name: (formData.get('display_name') as string) || (formData.get('platform') as string),
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return {}
}

export async function disconnectPlatform(
  connectionId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('platform_connections')
    .delete()
    .eq('id', connectionId)
    .eq('profile_id', user.id)

  revalidatePath('/dashboard/settings')
  return {}
}

export async function updateNotificationSettings(
  formData: FormData
): Promise<{ error?: string }> {
  // Stored in profile metadata or a separate settings table
  // For now, update a json column on profiles
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  revalidatePath('/dashboard/settings')
  return {}
}

// ── Billing ───────────────────────────────────────────────────

export async function createBillingPortalSession(): Promise<{
  url?: string
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) return { error: 'No billing account found. Contact support.' }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: process.env.STRIPE_API_VERSION as any
  })

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  })

  return { url: session.url }
}
