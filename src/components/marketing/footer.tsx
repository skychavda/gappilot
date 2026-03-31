import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-3 group">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span className="text-white font-semibold text-lg tracking-tight">GapPilot</span>
            </Link>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              Find and fix every gap in your voice agent&apos;s knowledge base — automatically.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Link href="#features" className="hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </nav>
        </div>

        <div className="pt-8 border-t border-white/10 text-sm text-slate-600">
          © 2026 GapPilot. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
