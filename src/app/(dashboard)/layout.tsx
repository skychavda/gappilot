import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import type { Profile } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  const { count: transcriptCount } = await supabase
    .from('transcripts')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar profile={profile} />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="flex flex-col flex-1 md:ml-[220px] overflow-hidden">
        <Header profile={profile} transcriptCount={transcriptCount ?? 0} />

        {/* Scrollable content, padded for mobile bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
