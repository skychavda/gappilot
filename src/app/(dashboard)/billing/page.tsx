import { createClient } from '@/lib/supabase/server'
import { BillingClient } from './billing-client'
import type { Profile } from '@/types'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { count: transcriptCount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase
      .from('transcripts')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id),
  ])

  return <BillingClient profile={profile} transcriptCount={transcriptCount ?? 0} />
}
