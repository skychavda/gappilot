import Anthropic from '@anthropic-ai/sdk'
import { GapDetectionResult, NormalisedTurn } from '../types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are a voice agent QA analyst. Analyze this call transcript and identify every moment the voice agent FAILED to answer the customer correctly.

Detect these 5 failure types:
1. unknown_topic — agent says it doesn't know or can't help
2. incomplete_answer — agent answers partially then stops or deflects
3. wrong_answer — agent gives factually incorrect information
4. deflection — agent changes subject or redirects inappropriately
5. repeated_question — customer asks same thing twice (first answer failed)

Return ONLY valid JSON array. No preamble. No markdown. Schema per item:
{
  "topic": "short category (3-5 words)",
  "customer_question": "exact or close paraphrase of what customer asked",
  "agent_response": "what the agent said (quote or paraphrase)",
  "failure_type": "unknown_topic|incomplete_answer|wrong_answer|deflection|repeated_question",
  "severity": "high|medium|low",
  "suggested_answer": "complete, helpful answer ready to add to KB",
  "kb_entry": {
    "question": "FAQ-phrased version of the question",
    "answer": "full KB answer ready to import"
  }
}

Severity guide:
- high: customer expressed frustration, repeated themselves, or call ended badly
- medium: agent deflected or gave partial answer
- low: minor gap, agent was mostly correct but incomplete

If no failures exist in this transcript segment, return [].`

const CHARS_PER_TOKEN = 4
const MAX_CHUNK_TOKENS = 4000
const CHUNK_SIZE_CHARS = MAX_CHUNK_TOKENS * CHARS_PER_TOKEN

function serialiseTurns(turns: NormalisedTurn[]): string {
  return turns
    .map((t) => `${t.speaker === 'agent' ? 'Agent' : 'Customer'}: ${t.text}`)
    .join('\n')
}

function chunkTurns(turns: NormalisedTurn[]): NormalisedTurn[][] {
  const chunks: NormalisedTurn[][] = []
  let current: NormalisedTurn[] = []
  let currentChars = 0

  for (const turn of turns) {
    const turnChars = turn.text.length + turn.speaker.length + 3
    if (currentChars + turnChars > CHUNK_SIZE_CHARS && current.length > 0) {
      chunks.push(current)
      current = []
      currentChars = 0
    }
    current.push(turn)
    currentChars += turnChars
  }

  if (current.length > 0) chunks.push(current)
  return chunks
}

export async function detectGaps(transcript: NormalisedTurn[]): Promise<GapDetectionResult[]> {
  const chunks = chunkTurns(transcript)
  const results: GapDetectionResult[] = []

  for (const chunk of chunks) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: serialiseTurns(chunk) }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    if (!text || text === '[]') continue

    const parsed = JSON.parse(text) as GapDetectionResult[]
    if (Array.isArray(parsed)) results.push(...parsed)
  }

  return results
}
