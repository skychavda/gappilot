'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-900/80 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/10'
          : 'bg-slate-900'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_3px_rgba(45,212,191,0.4)] group-hover:shadow-[0_0_12px_4px_rgba(45,212,191,0.6)] transition-all" />
          <span className="text-white font-semibold text-lg tracking-tight">GapPilot</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How it works', 'Pricing'].map((label) => (
            <Link
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            Start free trial
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-slate-900 border-t border-white/10 px-4 py-5 flex flex-col gap-4">
          {['Features', 'How it works', 'Pricing'].map((label) => (
            <Link
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-slate-300 hover:text-white text-sm transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <hr className="border-white/10" />
          <Link href="/login" className="text-slate-300 hover:text-white text-sm transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-teal-600 hover:bg-teal-500 text-white text-sm px-4 py-2.5 rounded-lg font-medium text-center transition-colors"
          >
            Start free trial
          </Link>
        </div>
      )}
    </header>
  )
}
