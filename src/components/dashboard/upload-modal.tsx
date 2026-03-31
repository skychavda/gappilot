'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  X,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Plus,
  Bot,
  ChevronDown,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Platform } from '@/types'

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
    const parsed = JSON.parse(text) as unknown
    return detectPlatformFromJson(parsed)
  } catch {
    return null
  }
}

const platformLabels: Record<Platform, string> = {
  elevenlabs: 'ElevenLabs',
  retell: 'Retell AI',
  vapi: 'Vapi',
  bland: 'Bland AI',
  manual: 'Manual / Plain text',
}

// ── Types ──────────────────────────────────────────────────────

interface Agent {
  id: string
  name: string
  platform: Platform
  external_agent_id: string
}

type Step = 'select-agent' | 'upload' | 'processing' | 'done'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

// ── Component ──────────────────────────────────────────────────

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const router = useRouter()
  const supabase = createClient()

  // Step state
  const [step, setStep] = useState<Step>('select-agent')

  // Step 1 — agent selection
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | 'none'>('none')
  const [creatingAgent, setCreatingAgent] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentPlatform, setNewAgentPlatform] = useState<Platform>('elevenlabs')
  const [agentError, setAgentError] = useState<string | null>(null)

  // Step 2 — file upload
  const [file, setFile] = useState<File | null>(null)
  const [platform, setPlatform] = useState<Platform>('manual')
  const [detectedPlatform, setDetectedPlatform] = useState<Platform | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 3 — processing
  const [transcriptId, setTranscriptId] = useState<string | null>(null)
  const [processingMessage, setProcessingMessage] = useState('Uploading transcript…')

  // Step 4 — done
  const [gapCount, setGapCount] = useState(0)

  // ── Reset on close ────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setStep('select-agent')
      setSelectedAgentId('none')
      setCreatingAgent(false)
      setNewAgentName('')
      setFile(null)
      setDetectedPlatform(null)
      setPlatform('manual')
      setUploadError(null)
      setTranscriptId(null)
      setGapCount(0)
      setAgentError(null)
    }
  }, [isOpen])

  // ── Fetch agents when opened ──────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    setAgentsLoading(true)
    supabase
      .from('agents')
      .select('id, name, platform, external_agent_id')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setAgents((data as Agent[]) ?? [])
        setAgentsLoading(false)
      })
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll transcript status during processing ──────────────────
  useEffect(() => {
    if (step !== 'processing' || !transcriptId) return

    const messages = [
      'Uploading transcript…',
      'Normalising conversation turns…',
      'Sending to Claude for analysis…',
      'Detecting failure patterns…',
      'Building gap suggestions…',
    ]
    let msgIdx = 0
    const msgTimer = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, messages.length - 1)
      setProcessingMessage(messages[msgIdx])
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
          setStep('done')
          router.refresh()
        } else if (data.status === 'failed') {
          clearInterval(pollTimer)
          clearInterval(msgTimer)
          setUploadError(data.error_message ?? 'Processing failed. Please try again.')
          setStep('upload')
        }
      } catch {
        // network error — keep polling
      }
    }, 2500)

    return () => {
      clearInterval(pollTimer)
      clearInterval(msgTimer)
    }
  }, [step, transcriptId, router])

  // ── Handlers ──────────────────────────────────────────────────

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
    [handleFileSelect]
  )

  const handleCreateAgent = async () => {
    if (!newAgentName.trim()) return
    setAgentError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('agents')
      .insert({
        profile_id: user.id,
        name: newAgentName.trim(),
        platform: newAgentPlatform,
        external_agent_id: crypto.randomUUID(),
        is_active: true,
        platform_connection_id: null,
      })
      .select('id, name, platform, external_agent_id')
      .single()

    if (error || !data) {
      setAgentError(error?.message ?? 'Failed to create agent')
      return
    }

    const newAgent = data as Agent
    setAgents((prev) => [...prev, newAgent])
    setSelectedAgentId(newAgent.id)
    setCreatingAgent(false)
    setNewAgentName('')
  }

  const handleUpload = async () => {
    if (!file) return
    setUploadError(null)
    setStep('processing')
    setProcessingMessage('Uploading transcript…')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('platform', platform)
    if (selectedAgentId !== 'none') formData.append('agent_id', selectedAgentId)

    try {
      const res = await fetch('/api/transcripts/upload', { method: 'POST', body: formData })
      const json = (await res.json()) as { transcriptId?: string; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      setTranscriptId(json.transcriptId ?? null)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
      setStep('upload')
    }
  }

  if (!isOpen) return null

  // ── Render ────────────────────────────────────────────────────

  const stepIndex = { 'select-agent': 1, upload: 2, processing: 3, done: 4 }[step]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-900">Upload transcript</h2>
            {step !== 'processing' && step !== 'done' && (
              <div className="flex items-center gap-1">
                {[1, 2].map((n) => (
                  <span
                    key={n}
                    className={`w-5 h-1 rounded-full transition-colors ${
                      stepIndex >= n ? 'bg-teal-500' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── Step 1: Select agent ──────────────────────────────── */}
        {step === 'select-agent' && (
          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Which agent is this from?</p>
              <p className="text-xs text-slate-400">Optional — helps organise gaps by agent.</p>
            </div>

            {agentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : creatingAgent ? (
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-800">New agent</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Agent name (e.g. Support Bot)"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateAgent()}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    autoFocus
                  />
                  <select
                    value={newAgentPlatform}
                    onChange={(e) => setNewAgentPlatform(e.target.value as Platform)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {(Object.entries(platformLabels) as [Platform, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                {agentError && (
                  <p className="text-xs text-red-500">{agentError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateAgent}
                    disabled={!newAgentName.trim()}
                    className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    Create agent
                  </button>
                  <button
                    onClick={() => { setCreatingAgent(false); setAgentError(null) }}
                    className="px-4 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* No agent option */}
                <button
                  onClick={() => setSelectedAgentId('none')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    selectedAgentId === 'none'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">No agent / one-off upload</p>
                    <p className="text-xs text-slate-400">Not linked to a specific agent</p>
                  </div>
                </button>

                {/* Agent list */}
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      selectedAgentId === agent.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{agent.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{agent.platform}</p>
                    </div>
                    {selectedAgentId === agent.id && (
                      <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                ))}

                {/* Create new agent */}
                <button
                  onClick={() => setCreatingAgent(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-left transition-all group"
                >
                  <div className="w-8 h-8 bg-slate-100 group-hover:bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 group-hover:text-teal-700">
                    Create new agent
                  </p>
                </button>
              </div>
            )}

            {!creatingAgent && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Upload file ───────────────────────────────── */}
        {step === 'upload' && (
          <div className="p-6 space-y-4">
            {/* Platform selector */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Platform
              </label>
              <div className="relative">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="w-full h-10 rounded-lg border border-slate-200 pl-3 pr-8 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                >
                  {(Object.entries(platformLabels) as [Platform, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {detectedPlatform && detectedPlatform !== 'manual' && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-1.5">
                  <Sparkles className="w-3 h-3" />
                  Looks like a <strong>{platformLabels[detectedPlatform]}</strong> transcript — auto-selected
                </div>
              )}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
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
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB · {file.name.split('.').pop()?.toUpperCase()}
                    </p>
                  </div>
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
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Drop your transcript here
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">or click to browse</p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {['.txt', '.json', '.csv'].map((ext) => (
                      <span
                        key={ext}
                        className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono"
                      >
                        {ext}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {uploadError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('select-agent')}
                className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                disabled={!file}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload & analyse
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Processing ────────────────────────────────── */}
        {step === 'processing' && (
          <div className="px-6 py-14 text-center">
            {/* Animated ring */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
              <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full bg-teal-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-teal-500" />
              </div>
            </div>

            <p className="font-semibold text-slate-900 mb-2">Analysing transcript with AI…</p>
            <p className="text-sm text-slate-400 transition-all">{processingMessage}</p>

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
        )}

        {/* ── Step 4: Done ──────────────────────────────────────── */}
        {step === 'done' && (
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-teal-500" />
            </div>

            <p className="font-bold text-slate-900 text-xl mb-1">Analysis complete</p>

            {gapCount > 0 ? (
              <>
                <p className="text-slate-500 text-sm mb-6">
                  Found{' '}
                  <span className="font-bold text-slate-900">{gapCount}</span>{' '}
                  gap{gapCount !== 1 ? 's' : ''} in this transcript.{' '}
                  {gapCount >= 5 ? 'Time to review.' : 'Nice work — not many gaps.'}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium py-2.5 rounded-xl transition-colors"
                  >
                    Done
                  </button>
                  <Link
                    href="/gaps"
                    onClick={onClose}
                    className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Review {gapCount} gap{gapCount !== 1 ? 's' : ''}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-500 text-sm mb-6">
                  No gaps detected in this transcript. Your agent handled everything correctly.
                </p>
                <button
                  onClick={onClose}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Done
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
