'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileAudio,
  AlertTriangle,
  BookOpen,
  Settings,
  CreditCard,
} from 'lucide-react'
import type { Profile } from '@/types'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Transcripts', href: '/transcripts', icon: FileAudio },
  { label: 'Gaps', href: '/gaps', icon: AlertTriangle },
  { label: 'Knowledge Base', href: '/kb', icon: BookOpen },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Billing', href: '/billing', icon: CreditCard },
]

const mobileItems = navItems.slice(0, 5)

const planLabel: Record<string, string> = {
  solo: 'Solo',
  growth: 'Growth',
  agency: 'Agency',
}

interface SidebarProps {
  profile: Profile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] bg-slate-900 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 h-16 px-5 border-b border-white/10 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_3px_rgba(45,212,191,0.4)]" />
          <span className="text-white font-semibold text-base tracking-tight">GapPilot</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                isActive(href)
                  ? 'bg-teal-600/20 text-teal-300'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive(href) ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              {label}
              {label === 'Gaps' && (
                <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
                  New
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {profile?.full_name?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {profile?.full_name ?? 'User'}
              </p>
              <p className="text-slate-500 text-[11px] truncate">{profile?.email}</p>
            </div>
            {profile?.subscription_tier && (
              <span className="text-[10px] bg-teal-600/20 text-teal-400 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                {planLabel[profile.subscription_tier]}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-white/10 flex">
        {mobileItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              isActive(href) ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon
              className={`w-5 h-5 ${isActive(href) ? 'text-teal-400' : 'text-slate-500'}`}
            />
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
