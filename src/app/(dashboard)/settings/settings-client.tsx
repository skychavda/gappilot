'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Loader2, X, Plus, Unplug, TestTube2, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile, connectPlatform, disconnectPlatform } from '../actions'
import type { Profile, PlatformConnection, Platform } from '@/types'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  company_name: z.string(),
})

type ProfileForm = z.infer<typeof profileSchema>

const platforms: { id: Platform; name: string; icon: string; hint: string }[] = [
  { id: 'elevenlabs', name: 'ElevenLabs', icon: '🎙', hint: 'API key from ElevenLabs dashboard → API Keys' },
  { id: 'vapi', name: 'Vapi', icon: '📞', hint: 'API key from Vapi dashboard → Account' },
  { id: 'retell', name: 'Retell AI', icon: '🔄', hint: 'API key from Retell dashboard → API Keys' },
  { id: 'bland', name: 'Bland AI', icon: '🤖', hint: 'API key from Bland dashboard → Developer' },
]

const tabs = ['Profile', 'Platforms', 'Notifications'] as const
type Tab = (typeof tabs)[number]

interface SettingsClientProps {
  profile: Profile | null
  connections: PlatformConnection[]
}

export function SettingsClient({ profile, connections: initialConnections }: SettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('Profile')
  const [connections, setConnections] = useState<PlatformConnection[]>(initialConnections)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Connect modal state
  const [connectModal, setConnectModal] = useState<Platform | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  // Notification toggles
  const [notifDigest, setNotifDigest] = useState(true)
  const [notifTranscript, setNotifTranscript] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      company_name: profile?.company_name ?? '',
    },
  })

  const onProfileSubmit = async (values: ProfileForm) => {
    setSavingProfile(true)
    setProfileError(null)
    const formData = new FormData()
    formData.append('full_name', values.full_name)
    formData.append('company_name', values.company_name)
    const result = await updateProfile(formData)
    if (result?.error) {
      setProfileError(result.error)
    } else {
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
      router.refresh()
    }
    setSavingProfile(false)
  }

  const handleConnect = async () => {
    if (!connectModal || !apiKey.trim()) return
    setConnecting(true)
    setConnectError(null)
    const formData = new FormData()
    formData.append('platform', connectModal)
    formData.append('api_key', apiKey)
    formData.append('display_name', displayName || connectModal)
    const result = await connectPlatform(formData)
    if (result?.error) {
      setConnectError(result.error)
      setConnecting(false)
    } else {
      setConnectModal(null)
      setApiKey('')
      setDisplayName('')
      router.refresh()
      setConnecting(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this platform?')) return
    await disconnectPlatform(id)
    setConnections((prev) => prev.filter((c) => c.id !== id))
  }

  const getConnection = (platform: Platform) =>
    connections.find((c) => c.platform === platform)

  return (
    <>
      <div className="max-w-2xl space-y-5">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-teal-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── Profile tab ─────────────────────────────── */}
        {activeTab === 'Profile' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-5">Profile information</h2>
            {profileError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                {profileError}
              </div>
            )}
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" {...register('full_name')} />
                {errors.full_name && (
                  <p className="text-xs text-red-500">{errors.full_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company_name">Company name</Label>
                <Input id="company_name" placeholder="Optional" {...register('company_name')} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={profile?.email ?? ''} disabled className="bg-slate-50 text-slate-400" />
                <p className="text-xs text-slate-400">Email cannot be changed here.</p>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : profileSaved ? (
                  <Check className="w-4 h-4" />
                ) : null}
                {profileSaved ? 'Saved!' : 'Save changes'}
              </button>
            </form>
          </div>
        )}

        {/* ── Platforms tab ────────────────────────────── */}
        {activeTab === 'Platforms' && (
          <div className="space-y-3">
            {platforms.map((p) => {
              const conn = getConnection(p.id)
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                    {conn ? (
                      <p className="text-xs text-teal-600 mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        Connected — {conn.display_name}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5">Not connected</p>
                    )}
                  </div>
                  {conn ? (
                    <button
                      onClick={() => handleDisconnect(conn.id)}
                      className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium border border-red-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Unplug className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => { setConnectModal(p.id); setConnectError(null) }}
                      className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-200 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Connect
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Notifications tab ────────────────────────── */}
        {activeTab === 'Notifications' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-900 mb-5">Notification preferences</h2>
            {[
              {
                id: 'digest',
                label: 'Weekly gap digest',
                desc: 'Get a weekly email summary of new gaps detected across all your agents.',
                value: notifDigest,
                onChange: setNotifDigest,
              },
              {
                id: 'transcript',
                label: 'Transcript ready',
                desc: 'Notify me when a transcript finishes processing and gaps are ready to review.',
                value: notifTranscript,
                onChange: setNotifTranscript,
              },
            ].map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{n.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-sm">{n.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => n.onChange(!n.value)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                    n.value ? 'bg-teal-600' : 'bg-slate-200'
                  }`}
                  style={{ height: '22px', minWidth: '40px' }}
                  role="switch"
                  aria-checked={n.value}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                      n.value ? 'translate-x-[18px]' : 'translate-x-0'
                    }`}
                    style={{ width: '18px', height: '18px' }}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Connect modal ─────────────────────────────── */}
      {connectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                Connect {platforms.find((p) => p.id === connectModal)?.name}
              </h3>
              <button
                onClick={() => { setConnectModal(null); setApiKey(''); setConnectError(null) }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="display_name">Display name (optional)</Label>
                <Input
                  id="display_name"
                  placeholder={platforms.find((p) => p.id === connectModal)?.name}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="api_key">API key</Label>
                <div className="relative">
                  <Input
                    id="api_key"
                    type={showKey ? 'text' : 'password'}
                    placeholder="Paste your API key…"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  {platforms.find((p) => p.id === connectModal)?.hint}
                </p>
              </div>
              {connectError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {connectError}
                </p>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setConnectModal(null); setApiKey(''); setConnectError(null) }}
                className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={!apiKey.trim() || connecting}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {connecting && <Loader2 className="w-4 h-4 animate-spin" />}
                {connecting ? 'Connecting…' : 'Save & connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
