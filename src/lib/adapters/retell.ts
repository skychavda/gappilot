import type { NormalisedTurn } from '@/types'

interface RetellWord {
  word: string
  start: number
  end: number
}

interface RetellTurn {
  role: string
  content: string
  words: RetellWord[]
}

interface RetellPayload {
  transcript_object: RetellTurn[]
}

export function normaliseRetell(raw: RetellPayload): NormalisedTurn[] {
  return raw.transcript_object.map((turn) => ({
    speaker: turn.role === 'agent' ? 'agent' : 'customer',
    text: turn.content,
    timestamp_ms: turn.words.length > 0 ? Math.round(turn.words[0].start * 1000) : 0,
  }))
}
