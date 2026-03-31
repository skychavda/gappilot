import { createClient } from '@/lib/supabase/server'
import { GapsClient } from './gaps-client'
import type { Gap } from '@/types'

export default async function GapsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: gaps } = await supabase
    .from('gaps')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  return <GapsClient gaps={(gaps as Gap[]) ?? []} />
}
