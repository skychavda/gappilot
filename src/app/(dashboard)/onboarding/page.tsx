'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bot,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  ArrowRight,
  Loader2,
  Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Platform } from '@/types'

// ── Constants ───────────────────────────────────────────────────

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'retell', label: 'Retell AI' },
  { value: 'vapi', label: 'Vapi' },
  { value: 'bland', label: 'Bland AI' },
  { value: 'manual', label: 'Manual / Plain text' },
]

const PROCESSING_MESSAGES = [
  'Uploading transcript…',
  'Normalising conversation turns…',
  'Sending to Claude for analysis…',
  'Detecting failure patterns…',
  'Building gap suggestions…',
]

// ── Platform auto-detection ─────────────────────────────────────

function detectPlatformFromJson(obj: unknown): Platform | null {
  if (typeof obj !== 'object' || obj === null) return null
  const o = obj as Record<string, unknown>
  if ('transcript_object' in o && Array.isArray(o.transcript_object)) return 'retell'
  if ('transcript' in o && Array.isArray(o.transcript)) {
    const first = (o.transcript as Record<string, unknown>[])[0]
    if (first?.time_in_call_secs !== undefined) return 'elevenlabs'
  }
  if ('messages' in o && Array.isArray(o.messages)) {
    const first = (o.messages as Record<string, unknown>[])[0]
    if (first?.role === 'assistant' || first?.role === 'user') return 'vapi'
  }
  if ('calls' in o || 'call_id' in o) return 'bland'
  return null
}

async function detectPlatformFromFile(file: File): Promise<Platform | null> {
  if (!file.name.endsWith('.json')) return null
  try {
    const text = await file.slice(0, 8192).text()
    return detectPlatformFromJson(JSON.parse(text) as unknown)
  } catch {
    return null
  }
}

// ── Progress bar ────────────────────────────────────────────────

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Name your agent' },
    { n: 2, label: 'Upload transcript' },
    { n: 3, label: 'Review gaps' },
  ]
  return (
    <div className="w-full mb-10">
      <div className="flex items-center">
        {steps.map(({ n, label }, i) => (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > n
                    ? 'bg-teal-600 text-white'
                    : step === n
                    ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > n ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <span
                className={`text-[11px] font-semibold whitespace-nowrap ${
                  step >= n ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
            {/* Connector */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all"
                style={{ background: step > n ? '#0D9488' : '#E2E8F0' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1
  const [agentName, setAgentName] = useState('')
  const [agentPlatform, setAgentPlatform] = useState<Platform>('elevenlabs')
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [savingAgent, setSavingAgent] = useState(false)

  // Step 2
  const [file, setFile] = useState<File | null>(null)
  const [platform, setPlatform] = useState<Platform>('manual')
  const [detectedPlatform, setDetectedPlatform] = useState<Platform | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingMsg, setProcessingMsg] = useState(PROCESSING_MESSAGES[0])
  const [transcriptId, setTranscriptId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 3
  const [gapCount, setGapCount] = useState(0)

  // ── Polling ───────────────────────────────────────────────────
  useEffect(() => {
    if (!processing || !transcriptId) return

    let msgIdx = 0
    const msgTimer = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, PROCESSING_MESSAGES.length - 1)
      setProcessingMsg(PROCESSING_MESSAGES[msgIdx])
    }, 3000)

    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/transcripts/${transcriptId}`)
        if (!res.ok) return
        const data = (await res.json()) as { status: string; gap_count: number; error_message?: string }

        if (data.status === 'completed') {
          clearInterval(pollTimer)
          clearInterval(msgTimer)
          setGapCount(data.gap_count ?? 0)
          setProcessing(false)
          setStep(3)
        } else if (data.status === 'failed') {
          clearInterval(pollTimer)
          clearInterval(msgTimer)
          setProcessing(false)
          setUploadError(data.error_message ?? 'Processing failed — please try again.')
        }
      } catch {
        // keep polling
      }
    }, 2500)

    return () => {
      clearInterval(pollTimer)
      clearInterval(msgTimer)
    }
  }, [processing, transcriptId])

  // ── Step 1: Save agent ────────────────────────────────────────
  async function handleSaveAgent() {
    if (!agentName.trim()) return
    setSavingAgent(true)
    setAgentError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAgentError('Not authenticated'); setSavingAgent(false); return }

    const { data, error } = await supabase
      .from('agents')
      .insert({
        profile_id: user.id,
        name: agentName.trim(),
        platform: agentPlatform,
        external_agent_id: crypto.randomUUID(),
        is_active: true,
        platform_connection_id: null,
      })
      .select('id')
      .single()

    setSavingAgent(false)
    if (error || !data) {
      setAgentError(error?.message ?? 'Failed to create agent')
      return
    }
    setAgentId((data as { id: string }).id)
    setStep(2)
  }

  // ── Step 2: File handling ─────────────────────────────────────
  const handleFileSelect = useCallback(async (selected: File) => {
    setFile(selected)
    setUploadError(null)
    const detected = await detectPlatformFromFile(selected)
    setDetectedPlatform(detected)
    if (detected) setPlatform(detected)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const dropped = e.dataTransfer.files[0]
      if (dropped) handleFileSelect(dropped)
    },
    [handleFileSelect],
  )

  async function handleUpload() {
    if (!file) return
    setUploadError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('platform', platform)
    if (agentId) formData.append('agent_id', agentId)

    try {
      const res = await fetch('/api/transcripts/upload', { method: 'POST', body: formData })
      const json = (await res.json()) as { transcriptId?: string; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      setTranscriptId(json.transcriptId ?? null)
      setUploading(false)
      setProcessing(true)
      setProcessingMsg(PROCESSING_MESSAGES[0])
    } catch (err) {
      setUploading(false)
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  // ── Finish onboarding ─────────────────────────────────────────
  async function finishOnboarding() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true } as Record<string, unknown>)
        .eq('id', user.id)
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">GapPilot</span>
        </div>

        {/* Progress bar */}
        <ProgressBar step={step} />

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* ── Step 1: Name your agent ──────────────────────────── */}
          {step === 1 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-teal-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">Name your first agent</h1>
              </div>
              <p className="text-sm text-slate-400 mb-8 ml-[52px]">
                Give the AI agent a name so you can track its gaps over time.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Agent name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Support Bot, Sales Agent…"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveAgent()}
                    autoFocus
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Platform
                  </label>
                  <div className="relative">
                    <select
                      value={agentPlatform}
                      onChange={(e) => setAgentPlatform(e.target.value as Platform)}
                      className="w-full h-10 rounded-xl border border-slate-200 pl-3 pr-8 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      {PLATFORMS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {agentError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {agentError}
                  </div>
                )}

                <button
                  onClick={handleSaveAgent}
                  disabled={!agentName.trim() || savingAgent}
                  className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {savingAgent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Upload transcript ────────────────────────── */}
          {step === 2 && (
            <div className="p-8">
              {processing ? (
                /* Processing state */
                <div className="py-8 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
                    <div className="absolute inset-2 rounded-full bg-teal-50 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-teal-500" />
                    </div>
                  </div>
                  <p className="font-semibold text-slate-900 mb-2">Analysing with Claude AI…</p>
                  <p className="text-sm text-slate-400">{processingMsg}</p>
                  <div className="flex items-center justify-center gap-1 mt-5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-teal-400"
                        style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </div>
                  <style>{`
                    @keyframes bounce {
                      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                      40% { transform: translateY(-6px); opacity: 1; }
                    }
                  `}</style>
                </div>
              ) : (
                /* Upload form */
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                      <Upload className="w-5 h-5 text-teal-600" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Upload your first transcript</h1>
                  </div>
                  <p className="text-sm text-slate-400 mb-8 ml-[52px]">
                    Drop in a call from <strong className="text-slate-600">{agentName}</strong>. Supports .txt, .json, or .csv.
                  </p>

                  <div className="space-y-4">
                    {/* Platform */}
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">
                        Transcript format
                      </label>
                      <div className="relative">
                        <select
                          value={platform}
                          onChange={(e) => setPlatform(e.target.value as Platform)}
                          className="w-full h-10 rounded-xl border border-slate-200 pl-3 pr-8 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                        >
                          {PLATFORMS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      {detectedPlatform && detectedPlatform !== 'manual' && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-1.5">
                          <Sparkles className="w-3 h-3" />
                          Auto-detected as <strong>{PLATFORMS.find(p => p.value === detectedPlatform)?.label}</strong>
                        </div>
                      )}
                    </div>

                    {/* Drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        dragging
                          ? 'border-teal-400 bg-teal-50 scale-[1.01]'
                          : file
                          ? 'border-teal-300 bg-teal-50/40'
                          : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.json,.csv"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleFileSelect(f)
                        }}
                      />

                      {file ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto">
                            <FileText className="w-6 h-6 text-teal-600" />
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                          <p className="text-xs text-slate-400">
                            {(file.size / 1024).toFixed(1)} KB · {file.name.split('.').pop()?.toUpperCase()}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFile(null)
                              setDetectedPlatform(null)
                              if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                            className="text-xs text-red-400 hover:text-red-500 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">
                            <Upload className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">Drop your transcript here</p>
                          <p className="text-xs text-slate-400">or click to browse</p>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            {['.txt', '.json', '.csv'].map((ext) => (
                              <span key={ext} className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                {ext}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {uploadError && (
                      <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {uploadError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium py-3 rounded-xl transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload &amp; analyse
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 3: Gaps ready ───────────────────────────────── */}
          {step === 3 && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-teal-500" />
              </div>

              <h1 className="text-xl font-bold text-slate-900 mb-2">
                Your first gaps are ready
              </h1>

              {gapCount > 0 ? (
                <>
                  <p className="text-slate-500 text-sm mb-2">
                    Claude found{' '}
                    <span className="font-bold text-slate-900">{gapCount}</span>{' '}
                    gap{gapCount !== 1 ? 's' : ''} where{' '}
                    <strong className="text-slate-700">{agentName}</strong> couldn&apos;t answer correctly.
                  </p>
                  <p className="text-slate-400 text-xs mb-8">
                    Review each one and approve answers into your knowledge base with one click.
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-2xl font-bold text-slate-900">{gapCount}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Total gaps</p>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-3">
                      <p className="text-2xl font-bold text-teal-700">0</p>
                      <p className="text-xs text-teal-500 mt-0.5">Approved</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-2xl font-bold text-slate-900">0</p>
                      <p className="text-xs text-slate-400 mt-0.5">In KB</p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await finishOnboarding()
                      router.push('/dashboard/gaps')
                    }}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-3"
                  >
                    Start reviewing gaps
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      await finishOnboarding()
                      router.push('/dashboard')
                    }}
                    className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors py-1.5"
                  >
                    Go to dashboard
                  </button>
                </>
              ) : (
                <>
                  <p className="text-slate-500 text-sm mb-8">
                    No gaps detected — <strong className="text-slate-700">{agentName}</strong> handled everything correctly in this transcript.
                    Upload more to keep building your baseline.
                  </p>
                  <button
                    onClick={async () => {
                      await finishOnboarding()
                      router.push('/dashboard')
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
                  >
                    Go to dashboard
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Skip link — only on steps 1 and 2 */}
        {step < 3 && (
          <p className="text-center mt-5">
            <button
              onClick={async () => {
                await finishOnboarding()
                router.push('/dashboard')
              }}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip setup — take me to the dashboard
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
