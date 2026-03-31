import type { NormalisedTurn } from '@/types'

interface VapiMessage {
  role: string
  content: string
  time?: number
}

interface VapiPayload {
  messages?: VapiMessage[]
  transcript?: string
}

function parseFlatString(transcript: string): NormalisedTurn[] {
  const lines = transcript.split('\n').filter((l) => l.trim())
  const turns: NormalisedTurn[] = []

  for (const line of lines) {
    const agentMatch = line.match(/^(?:Agent|Assistant):\s*(.+)/i)
    const customerMatch = line.match(/^(?:User|Customer):\s*(.+)/i)

    if (agentMatch) {
      turns.push({ speaker: 'agent', text: agentMatch[1].trim(), timestamp_ms: 0 })
    } else if (customerMatch) {
      turns.push({ speaker: 'customer', text: customerMatch[1].trim(), timestamp_ms: 0 })
    }
  }

  return turns
}

export function normaliseVapi(raw: VapiPayload): NormalisedTurn[] {
  if (raw.messages && raw.messages.length > 0) {
    return raw.messages.map((msg, i) => ({
      speaker: msg.role === 'assistant' ? 'agent' : 'customer',
      text: msg.content,
      timestamp_ms: msg.time != null ? Math.round(msg.time * 1000) : i * 1000,
    }))
  }

  if (typeof raw.transcript === 'string') {
    return parseFlatString(raw.transcript)
  }

  return []
}
