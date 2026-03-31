import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'
import type { Profile, PlatformConnection } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: connections }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase
      .from('platform_connections')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  return (
    <SettingsClient
      profile={profile}
      connections={(connections as PlatformConnection[]) ?? []}
    />
  )
}
