import type { NormalisedTurn, Platform } from '@/types'
import { normaliseElevenLabs } from './elevenlabs'
import { normaliseRetell } from './retell'
import { normaliseVapi } from './vapi'
import { normaliseManual } from './manual'

export function normaliseTranscript(
  raw: string | object,
  platform: Platform | string
): NormalisedTurn[] {
  switch (platform) {
    case 'elevenlabs':
      return normaliseElevenLabs(raw as Parameters<typeof normaliseElevenLabs>[0])
    case 'retell':
      return normaliseRetell(raw as Parameters<typeof normaliseRetell>[0])
    case 'vapi':
      return normaliseVapi(raw as Parameters<typeof normaliseVapi>[0])
    case 'bland':
      // Bland AI uses a Vapi-compatible message structure
      return normaliseVapi(raw as Parameters<typeof normaliseVapi>[0])
    case 'manual':
    default:
      return normaliseManual(raw)
  }
}

export type { NormalisedTurn }
