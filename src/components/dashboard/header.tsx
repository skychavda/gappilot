'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, User, CreditCard, LogOut } from 'lucide-react'
import type { Profile } from '@/types'
import { signOut } from '@/app/(auth)/actions'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/transcripts': 'Transcripts',
  '/dashboard/gaps': 'Gaps',
  '/dashboard/kb': 'Knowledge Base',
  '/dashboard/settings': 'Settings',
  '/dashboard/billing': 'Billing',
  '/dashboard/onboarding': 'Get started',
}

const planLimits: Record<string, number | null> = {
  solo: 500,
  growth: 2000,
  agency: null,
}

interface HeaderProps {
  profile: Profile | null
  transcriptCount: number
}

export function Header({ profile, transcriptCount }: HeaderProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const title = Object.entries(routeTitles).reduce((found, [route, label]) => {
    if (pathname.startsWith(route) && route.length > found.length) return route
    return found
  }, '/dashboard')

  const pageTitle = routeTitles[title] ?? 'Dashboard'

  const tier = profile?.subscription_tier ?? 'solo'
  const limit = planLimits[tier]
  const usagePct = limit ? Math.min((transcriptCount / limit) * 100, 100) : 0
  const usageColor = usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-400' : 'bg-teal-500'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Page title */}
      <h1 className="font-semibold text-slate-900 text-base flex-1">{pageTitle}</h1>

      {/* Usage bar — desktop only */}
      {limit !== null && (
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-slate-700 leading-none mb-1">
              {transcriptCount.toLocaleString()}
              <span className="text-slate-400 font-normal"> / {limit.toLocaleString()} calls</span>
            </p>
            <div className="w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usageColor}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
          {usagePct >= 90 && (
            <Link
              href="/dashboard/billing"
              className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-lg font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
            >
              Upgrade
            </Link>
          )}
        </div>
      )}

      {/* Notification bell */}
      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
      </button>

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {profile?.full_name?.[0]?.toUpperCase() ??
              profile?.email?.[0]?.toUpperCase() ??
              '?'}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
            {profile?.full_name ?? profile?.email ?? 'Account'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-900/10 py-1.5 z-50">
            {/* Account info */}
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {profile?.full_name ?? 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
            </div>

            <Link
              href="/dashboard/settings"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <User className="w-4 h-4 text-slate-400" />
              Profile
            </Link>
            <Link
              href="/dashboard/billing"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-slate-400" />
              Billing
            </Link>

            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
