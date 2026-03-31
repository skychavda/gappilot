export interface NormalisedTurn {
  speaker: 'agent' | 'customer'
  text: string
  timestamp_ms: number
}

export type FailureType =
  | 'unknown_topic'
  | 'incomplete_answer'
  | 'wrong_answer'
  | 'deflection'
  | 'repeated_question'

export type Severity = 'high' | 'medium' | 'low'

export interface GapDetectionResult {
  topic: string
  customer_question: string
  agent_response: string
  failure_type: FailureType
  severity: Severity
  suggested_answer: string
  kb_entry: {
    question: string
    answer: string
  }
}

export interface Profile {
  id: string
  created_at: string
  email: string
  full_name: string | null
  company_name: string | null
  avatar_url: string | null
  stripe_customer_id: string | null
  subscription_status: 'trialing' | 'active' | 'canceled' | 'past_due' | null
  subscription_tier: 'solo' | 'growth' | 'agency' | null
  trial_ends_at: string | null
}

export type Platform = 'elevenlabs' | 'retell' | 'vapi' | 'bland' | 'manual'

export interface PlatformConnection {
  id: string
  created_at: string
  profile_id: string
  platform: Platform
  api_key: string
  webhook_secret: string | null
  display_name: string
  is_active: boolean
}

export interface Agent {
  id: string
  created_at: string
  profile_id: string
  platform_connection_id: string
  external_agent_id: string
  name: string
  platform: Platform
  is_active: boolean
}

export type TranscriptStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Transcript {
  id: string
  created_at: string
  profile_id: string
  agent_id: string | null
  platform: Platform
  external_call_id: string | null
  raw_payload: object
  normalised_turns: NormalisedTurn[]
  status: TranscriptStatus
  duration_seconds: number | null
  error_message: string | null
  gap_count: number
  processed_at: string | null
}

export type GapStatus = 'pending' | 'approved' | 'skipped'

export interface Gap {
  id: string
  created_at: string
  transcript_id: string
  profile_id: string
  topic: string
  customer_question: string
  agent_response: string
  failure_type: FailureType
  severity: Severity
  suggested_answer: string
  kb_entry_question: string
  kb_entry_answer: string
  status: GapStatus
  reviewed_at: string | null
}

export interface KBEntry {
  id: string
  created_at: string
  profile_id: string
  gap_id: string | null
  question: string
  answer: string
  topic: string | null
  source_platform: Platform | null
  is_active: boolean
}

export interface PricingPlan {
  id: 'solo' | 'growth' | 'agency'
  name: string
  price_monthly: number
  stripe_price_id_monthly: string
  features: string[]
  transcript_limit: number
  agent_limit: number
}
