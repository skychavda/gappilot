import Link from 'next/link'
import {
  ArrowRight,
  AlertTriangle,
  PhoneMissed,
  Eye,
  Search,
  Cpu,
  CheckSquare,
  BookOpen,
  BarChart2,
  Link2,
  Download,
} from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Pricing } from '@/components/marketing/pricing'
import { Footer } from '@/components/marketing/footer'

export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .hero-gradient {
          background: linear-gradient(-45deg, #f0fdfa, #ffffff, #f8fafc, #e0f2fe);
          background-size: 400% 400%;
          animation: gradient-shift 10s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .float-anim { animation: float 6s ease-in-out infinite; }
      `}</style>

      <Navbar />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="hero-gradient pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left column */}
              <div>
                <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Works with ElevenLabs · Vapi · Retell · Bland
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-slate-900 leading-[1.12] tracking-tight mb-6">
                  Your voice agent is failing calls.{' '}
                  <span className="text-teal-600">You just don&apos;t know which ones.</span>
                </h1>

                <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                  GapPilot reads your call transcripts, finds every question your agent failed to
                  answer, and drafts the fix — ready to approve in one click. On any platform.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-3.5 rounded-xl text-base transition-all shadow-sm hover:shadow-md"
                  >
                    Start free — 14 days
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="inline-flex items-center justify-center gap-2 text-slate-700 hover:text-slate-900 font-medium px-6 py-3.5 rounded-xl text-base border border-slate-200 hover:border-slate-300 bg-white transition-all"
                  >
                    See how it works
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </Link>
                </div>
              </div>

              {/* Right column — Dashboard Mockup */}
              <div className="float-anim">
                <DashboardMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ── Platform Bar ─────────────────────────────────────── */}
        <section className="py-10 bg-white border-y border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-slate-400 mb-7 uppercase tracking-widest font-medium">
              Works with your platform
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {['ElevenLabs', 'Vapi', 'Retell AI', 'Bland AI'].map((platform) => (
                <div key={platform} className="flex items-center gap-2 group">
                  <span className="w-2 h-2 rounded-full bg-teal-400/70" />
                  <span className="text-slate-600 font-medium text-sm group-hover:text-slate-900 transition-colors">
                    {platform}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span className="text-slate-400 text-sm">+ plain text / CSV upload</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Problem Section ───────────────────────────────────── */}
        <section id="features" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">
                The gap no one is talking about
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Every unanswered question costs you a customer
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Your voice agent isn&apos;t perfect. And without transcript analysis, you have no idea
                where it&apos;s falling short.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
                  bg: 'bg-red-50',
                  title: 'Unknown questions',
                  description:
                    "Agent says it doesn't know. Customer hangs up frustrated. You never find out it happened.",
                },
                {
                  icon: <PhoneMissed className="w-5 h-5 text-amber-500" />,
                  bg: 'bg-amber-50',
                  title: 'Partial answers',
                  description:
                    'Agent gives half the story, then deflects. Customer calls back — or worse, goes to a competitor.',
                },
                {
                  icon: <Eye className="w-5 h-5 text-slate-400" />,
                  bg: 'bg-slate-100',
                  title: 'Nobody notices',
                  description:
                    "No one reviews 500 calls manually. Gaps compound silently. Your KB stays broken.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
                    {card.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 text-lg">{card.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">
                Simple by design
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                4 steps to a smarter agent
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                From connection to knowledge base improvement in minutes, not months.
              </p>
            </div>

            <div className="space-y-16">
              {[
                {
                  step: '01',
                  icon: <Link2 className="w-6 h-6 text-teal-600" />,
                  title: 'Connect',
                  description:
                    'Paste your platform API key or drop in a transcript file. GapPilot connects directly to ElevenLabs, Vapi, Retell, and Bland — or accepts plain text uploads.',
                  illustration: <ConnectIllustration />,
                  reverse: false,
                },
                {
                  step: '02',
                  icon: <Cpu className="w-6 h-6 text-teal-600" />,
                  title: 'Detect',
                  description:
                    'GapPilot analyses every call with Claude AI. It finds every failure: unknown topics, deflections, wrong answers, partial answers, and repeated questions.',
                  illustration: <DetectIllustration />,
                  reverse: true,
                },
                {
                  step: '03',
                  icon: <Search className="w-6 h-6 text-teal-600" />,
                  title: 'Review',
                  description:
                    "See each gap in detail: what was asked, what the agent said, why it failed, and the severity score. AI drafts a complete suggested answer for each one.",
                  illustration: <ReviewIllustration />,
                  reverse: false,
                },
                {
                  step: '04',
                  icon: <CheckSquare className="w-6 h-6 text-teal-600" />,
                  title: 'Approve',
                  description:
                    'One click adds the fix to your knowledge base. Your agent gets smarter with every batch. Export to JSON or CSV and import back to your platform instantly.',
                  illustration: <ApproveIllustration />,
                  reverse: true,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${
                    item.reverse ? 'lg:[&>*:first-child]:order-2' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl font-bold text-slate-100 select-none leading-none">
                        {item.step}
                      </span>
                      <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                        {item.icon}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-500 text-base leading-relaxed max-w-md">
                      {item.description}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    {item.illustration}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Grid ────────────────────────────────────── */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">
                Everything you need
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Built for voice agent teams
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Every tool you need to find, fix, and track gaps in your agent&apos;s knowledge.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: '🔍',
                  title: 'AI Gap Detection',
                  description:
                    '5 failure types, severity scoring, and zero manual review. Claude finds every moment the agent fell short.',
                },
                {
                  icon: '✍️',
                  title: 'Answer Drafting',
                  description:
                    'Claude writes a complete, ready-to-use FAQ entry for every gap it finds. Edit or approve as-is.',
                },
                {
                  icon: '⚡',
                  title: 'One-Click Approve',
                  description:
                    'Review gaps in a focused queue. Approve in seconds, skip what doesn&apos;t apply. Built for speed.',
                },
                {
                  icon: '📊',
                  title: 'KB Health Score',
                  description:
                    'Track your knowledge base coverage over time. See which topics still have gaps at a glance.',
                },
                {
                  icon: '🔗',
                  title: 'Any Platform',
                  description:
                    'Native connectors for ElevenLabs, Vapi, Retell, and Bland. Or upload any transcript as plain text, JSON, or CSV.',
                },
                {
                  icon: '📤',
                  title: 'Export Ready',
                  description:
                    'Download approved gaps as JSON or CSV — formatted and ready to import back into your agent platform.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="text-2xl mb-4">{feature.icon}</div>
                  <h3 className="font-semibold text-slate-900 mb-2 text-base">{feature.title}</h3>
                  <p
                    className="text-slate-500 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: feature.description }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────── */}
        <Pricing />

        {/* ── Testimonials ─────────────────────────────────────── */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">
                From the teams using it
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                They found gaps they never knew existed
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    "I had no idea my agent was deflecting 20% of calls. GapPilot found 47 gaps in the first batch. Fixed them in an afternoon — call quality improved overnight.",
                  name: 'Priya S.',
                  role: 'Operations Lead',
                  company: 'Real Estate Agency',
                },
                {
                  quote:
                    "We were manually reviewing maybe 5% of calls. GapPilot handles 100% and flags the ones that matter. It's like having a QA team that never sleeps.",
                  name: 'Marcus T.',
                  role: 'Head of AI',
                  company: 'Home Services Platform',
                },
                {
                  quote:
                    "The suggested answers are scarily good. We approve maybe 80% as-is. Our KB went from 60 entries to 200+ in the first month.",
                  name: 'Daniela R.',
                  role: 'Founder',
                  company: 'Healthcare Scheduling Startup',
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col"
                >
                  <blockquote className="text-slate-600 text-sm leading-relaxed flex-1 mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-slate-900 text-sm font-semibold">{t.name}</p>
                      <p className="text-slate-400 text-xs">
                        {t.role} · {t.company}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ──────────────────────────────────────── */}
        <section className="py-24 bg-teal-600">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Stop guessing. Start fixing.
            </h2>
            <p className="text-teal-100 text-lg mb-10 max-w-xl mx-auto">
              Your agent has gaps right now. GapPilot finds them.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white hover:bg-teal-50 text-teal-700 font-semibold px-8 py-4 rounded-xl text-base transition-all shadow-lg hover:shadow-xl"
            >
              Upload your first transcript — free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-teal-200 text-sm mt-4">No credit card. No setup fee. 14-day trial.</p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

/* ── Inline illustration components ─────────────────────────── */

function DashboardMockup() {
  return (
    <div className="rounded-2xl shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden bg-white">
      {/* Browser chrome */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-slate-400 border border-slate-200">
          app.gappilot.com/dashboard/gaps
        </div>
      </div>

      {/* App UI */}
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Call #4821 · 11 min ago · Vapi</p>
            <p className="font-semibold text-slate-900 text-sm">Gap Review — 3 gaps found</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs text-slate-500">1 high</span>
            <span className="mx-1 text-slate-200">|</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs text-slate-500">2 medium</span>
          </div>
        </div>

        {/* Gap card 1 — HIGH */}
        <div className="border border-red-100 bg-red-50/50 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
              High
            </span>
            <span className="text-xs text-slate-500 font-medium">unknown_topic</span>
          </div>
          <p className="text-sm font-medium text-slate-800 mb-1">
            &ldquo;What&apos;s your cancellation policy?&rdquo;
          </p>
          <p className="text-xs text-slate-500 mb-3">
            Agent: &ldquo;I&apos;m not sure about that — I&apos;d recommend contacting support.&rdquo;
          </p>
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-2.5 mb-3">
            <p className="text-[11px] text-teal-700 font-medium mb-0.5">✦ Suggested answer</p>
            <p className="text-xs text-teal-800">
              You can cancel anytime from your account settings. No fees, no questions asked.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-teal-600 text-white text-xs font-semibold py-1.5 rounded-lg">
              Approve & add to KB
            </button>
            <button className="px-3 text-slate-400 text-xs border border-slate-200 rounded-lg">
              Skip
            </button>
          </div>
        </div>

        {/* Gap card 2 — MEDIUM */}
        <div className="border border-slate-200 bg-white rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
              Med
            </span>
            <span className="text-xs text-slate-500 font-medium">incomplete_answer</span>
          </div>
          <p className="text-sm font-medium text-slate-800 mb-1">
            &ldquo;Do you offer bulk pricing?&rdquo;
          </p>
          <p className="text-xs text-slate-400 italic">+ 1 more gap below</p>
        </div>
      </div>
    </div>
  )
}

function ConnectIllustration() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">
        Connect a platform
      </p>
      {['ElevenLabs', 'Vapi', 'Retell AI'].map((p, i) => (
        <div
          key={p}
          className={`flex items-center gap-3 p-3 rounded-xl border ${
            i === 0
              ? 'border-teal-300 bg-teal-50'
              : 'border-slate-200 bg-white opacity-60'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-teal-500' : 'bg-slate-300'}`} />
          <span className="text-sm font-medium text-slate-700">{p}</span>
          {i === 0 && (
            <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              Connected
            </span>
          )}
        </div>
      ))}
      <div className="mt-4 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
        <p className="text-xs text-slate-400">Or drop a transcript file here</p>
        <p className="text-[11px] text-slate-300 mt-1">.txt · .json · .csv</p>
      </div>
    </div>
  )
}

function DetectIllustration() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">
        Analysing 24 calls…
      </p>
      {[
        { label: 'Call #4821 — 3 gaps found', pct: 100, color: 'bg-red-400' },
        { label: 'Call #4820 — 1 gap found', pct: 100, color: 'bg-amber-400' },
        { label: 'Call #4819 — no gaps', pct: 100, color: 'bg-teal-400' },
        { label: 'Call #4818 — processing…', pct: 60, color: 'bg-teal-400' },
      ].map((row) => (
        <div key={row.label}>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{row.label}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${row.color} rounded-full transition-all`}
              style={{ width: `${row.pct}%` }}
            />
          </div>
        </div>
      ))}
      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4 text-xs text-slate-500">
        <span>
          <span className="font-semibold text-slate-900">47</span> gaps found
        </span>
        <span>
          <span className="font-semibold text-slate-900">24</span> calls analysed
        </span>
      </div>
    </div>
  )
}

function ReviewIllustration() {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">
        Gap detail
      </p>
      <div className="space-y-2.5 text-xs">
        <div className="flex gap-2">
          <span className="text-slate-400 w-28 flex-shrink-0">Failure type</span>
          <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
            unknown_topic
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-slate-400 w-28 flex-shrink-0">Severity</span>
          <span className="font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">high</span>
        </div>
        <div className="flex gap-2 items-start">
          <span className="text-slate-400 w-28 flex-shrink-0">Customer asked</span>
          <span className="text-slate-700 italic">&ldquo;What&apos;s your returns window?&rdquo;</span>
        </div>
        <div className="flex gap-2 items-start">
          <span className="text-slate-400 w-28 flex-shrink-0">Agent said</span>
          <span className="text-slate-500">&ldquo;I don&apos;t have that info…&rdquo;</span>
        </div>
        <div className="border-t border-slate-100 pt-2.5 mt-1">
          <p className="text-teal-700 font-medium mb-1">✦ Suggested answer</p>
          <p className="text-slate-600 leading-relaxed">
            We offer a 30-day return window on all orders. Items must be unopened and in original
            packaging.
          </p>
        </div>
      </div>
    </div>
  )
}

function ApproveIllustration() {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">
        Knowledge base
      </p>
      <div className="space-y-2.5">
        {[
          { q: 'What is your cancellation policy?', status: 'approved' },
          { q: 'Do you offer bulk pricing?', status: 'approved' },
          { q: 'What are your support hours?', status: 'approved' },
          { q: 'Can I change my order after placing it?', status: 'pending' },
        ].map((entry) => (
          <div
            key={entry.q}
            className="flex items-center gap-3 text-xs bg-white rounded-lg border border-slate-100 p-2.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            <span className="text-slate-600 flex-1 truncate">{entry.q}</span>
            {entry.status === 'approved' ? (
              <span className="text-teal-600 text-[10px] font-medium bg-teal-50 px-1.5 py-0.5 rounded">
                ✓ Added
              </span>
            ) : (
              <span className="text-amber-600 text-[10px] font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                Pending
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <div className="flex-1 bg-teal-50 rounded-lg p-2.5 text-center">
          <p className="text-xl font-bold text-teal-700">127</p>
          <p className="text-[11px] text-teal-500">KB entries</p>
        </div>
        <div className="flex-1 bg-slate-50 rounded-lg p-2.5 text-center">
          <p className="text-xl font-bold text-slate-700">94%</p>
          <p className="text-[11px] text-slate-400">Coverage</p>
        </div>
      </div>
    </div>
  )
}
