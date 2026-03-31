import { createClient } from '@/lib/supabase/server'
import { TranscriptsClient } from './transcripts-client'
import type { Transcript } from '@/types'

export default async function TranscriptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('id, external_call_id, platform, status, duration_seconds, gap_count, created_at, error_message')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return <TranscriptsClient transcripts={(transcripts as Transcript[]) ?? []} />
}
