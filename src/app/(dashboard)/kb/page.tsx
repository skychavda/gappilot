import { createClient } from '@/lib/supabase/server'
import { KBClient } from './kb-client'
import type { KBEntry } from '@/types'

export default async function KBPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: entries } = await supabase
    .from('kb_entries')
    .select('*')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return <KBClient entries={(entries as KBEntry[]) ?? []} />
}
