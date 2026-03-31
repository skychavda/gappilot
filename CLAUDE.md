@AGENTS.md
# GapPilot — Claude Code Project Context

## What This Project Is
GapPilot is a SaaS that connects to voice agent platforms (ElevenLabs, Vapi, Retell AI, Bland AI),
reads call transcripts, detects every moment the AI agent failed to answer correctly, suggests the
right answer, and lets the business approve new FAQ entries into their knowledge base in one click.

## Tech Stack
- Framework: Next.js 15 App Router + React 19 + TypeScript (strict mode)
- Styling: Tailwind CSS v4 + shadcn/ui components
- Database: Supabase (Postgres) via @supabase/ssr
- Auth: Supabase Auth (magic link + email/password)
- AI: Anthropic Claude API (claude-sonnet-4-6) for gap detection
- Jobs: Inngest for async transcript processing
- Billing: Stripe (subscriptions + 14-day trial)
- Email: Resend for transactional email
- Hosting: Vercel (deploy from GitHub)

## Project Structure
All source code lives under /src — never create files at the project root outside of /src.

/src/app                    → Next.js App Router pages
/src/app/(marketing)        → Public pages: landing, pricing, about
/src/app/(auth)             → Login, signup, reset password
/src/app/(dashboard)        → Protected app: dashboard, gaps, settings, billing
/src/app/api                → API routes: webhooks, transcript processing, AI
/src/components/ui          → shadcn/ui base components
/src/components/marketing   → Landing page sections
/src/components/dashboard   → App-specific components
/src/lib                    → Utilities, Supabase client, Anthropic client
/src/lib/adapters           → Platform transcript normalizers
/src/lib/prompts            → AI prompt templates
/src/middleware.ts          → Next.js middleware (auth session + route protection)
/src/types                  → TypeScript types and interfaces

## Commands
- npm run dev           → Start dev server (port 3000)
- npm run build         → Production build
- npm run lint          → ESLint check
- npx supabase db push  → Push schema to Supabase

## Code Rules
- TypeScript strict mode, no `any` types ever
- Named exports only (no default exports except pages)
- Use Server Components by default, Client Components only when needed
- All forms use react-hook-form + zod validation
- Database access only via Supabase client in /src/lib/supabase
- Never commit .env.local
- shadcn/ui components for all UI elements
- Tailwind utility classes only, no custom CSS files
- File names in kebab-case
- Error boundaries on all major sections

## Environment Variables Required
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_SOLO_MONTHLY
STRIPE_PRICE_GROWTH_MONTHLY
STRIPE_PRICE_AGENCY_MONTHLY
RESEND_API_KEY
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
NEXT_PUBLIC_APP_URL

## Key Business Logic
- Gap detection uses Claude API with structured JSON output
- Transcripts chunked at 4000 tokens before sending to Claude
- 5 failure types: unknown_topic, incomplete_answer, wrong_answer, deflection, repeated_question
- 3 severity levels: high, medium, low
- Approve/Skip workflow: each gap reviewed individually
- Export: JSON and CSV download of approved gaps
- Platform adapters normalize all transcripts to: {speaker, text, timestamp_ms}[]

## Design System
- Primary color: Teal (#0D9488)
- Background: Clean white with subtle slate grays
- Typography: Inter font
- Tone: Professional but approachable — not corporate, not startup-flashy
- Dashboard: Clean data-dense layout similar to Linear or Vercel
- Landing: Hero-forward with clear value prop above the fold
