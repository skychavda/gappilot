import type { NormalisedTurn } from '@/types'

interface ElevenLabsTurn {
  role: string
  message: string
  time_in_call_secs: number
}

interface ElevenLabsPayload {
  transcript: ElevenLabsTurn[]
}

export function normaliseElevenLabs(raw: ElevenLabsPayload): NormalisedTurn[] {
  return raw.transcript.map((turn) => ({
    speaker: turn.role === 'agent' ? 'agent' : 'customer',
    text: turn.message,
    timestamp_ms: Math.round(turn.time_in_call_secs * 1000),
  }))
}
