import type { NormalisedTurn } from '@/types'

function parseJson(raw: object | unknown[]): NormalisedTurn[] {
  const arr = Array.isArray(raw) ? raw : [raw]

  return arr
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item, i) => {
      const rawSpeaker = String(item.role ?? item.speaker ?? '')
      const text = String(item.text ?? item.content ?? item.message ?? '')
      const timestamp_ms = typeof item.timestamp_ms === 'number' ? item.timestamp_ms : i * 1000

      const speakerLower = rawSpeaker.toLowerCase()
      const speaker: 'agent' | 'customer' =
        speakerLower === 'agent' || speakerLower === 'assistant' ? 'agent' : 'customer'

      return { speaker, text, timestamp_ms }
    })
}

function parseCsv(raw: string): NormalisedTurn[] {
  const lines = raw.trim().split('\n')
  if (lines.length < 2) return []

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const speakerIdx = header.indexOf('speaker')
  const textIdx = header.indexOf('text')
  const tsIdx = header.indexOf('timestamp_ms')

  if (speakerIdx === -1 || textIdx === -1) return []

  return lines.slice(1).map((line, i) => {
    const cols = line.split(',')
    const rawSpeaker = (cols[speakerIdx] ?? '').trim().toLowerCase()
    const speaker: 'agent' | 'customer' =
      rawSpeaker === 'agent' || rawSpeaker === 'assistant' ? 'agent' : 'customer'
    const text = (cols[textIdx] ?? '').trim()
    const timestamp_ms = tsIdx !== -1 ? Number(cols[tsIdx] ?? 0) : i * 1000

    return { speaker, text, timestamp_ms }
  })
}

function parsePlainText(raw: string): NormalisedTurn[] {
  const lines = raw.split('\n').filter((l) => l.trim())
  const turns: NormalisedTurn[] = []

  for (const line of lines) {
    const match = line.match(/^(Agent|Assistant|Customer|User):\s*(.+)/i)
    if (!match) continue

    const role = match[1].toLowerCase()
    const speaker: 'agent' | 'customer' =
      role === 'agent' || role === 'assistant' ? 'agent' : 'customer'

    turns.push({ speaker, text: match[2].trim(), timestamp_ms: 0 })
  }

  return turns
}

export function normaliseManual(raw: string | object): NormalisedTurn[] {
  if (typeof raw === 'object' && raw !== null) {
    return parseJson(raw)
  }

  const str = (raw as string).trim()

  if (str.startsWith('[') || str.startsWith('{')) {
    try {
      return parseJson(JSON.parse(str) as object)
    } catch {
      // fall through to other parsers
    }
  }

  if (
    str.includes(',') &&
    str.toLowerCase().includes('speaker') &&
    str.toLowerCase().includes('text')
  ) {
    const result = parseCsv(str)
    if (result.length > 0) return result
  }

  return parsePlainText(str)
}
