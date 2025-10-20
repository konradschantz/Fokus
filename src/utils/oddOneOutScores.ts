import { getApiUrl } from './apiBase'

export interface OddOneOutScoreEntry {
  name: string
  score: number
  ts: number
}

const SCORES_ENDPOINT = '/api/odd-one-out-scores'

function sanitizeEntry(value: unknown): OddOneOutScoreEntry | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const rawName = typeof record.name === 'string' ? record.name.trim() : ''
  const rawScore = record.score
  const rawTimestamp = record.ts

  if (!rawName) {
    return null
  }

  const score =
    typeof rawScore === 'number' && Number.isFinite(rawScore) && rawScore >= 0
      ? Math.floor(rawScore)
      : null
  const ts =
    typeof rawTimestamp === 'number' && Number.isFinite(rawTimestamp)
      ? Math.floor(rawTimestamp)
      : Date.now()

  if (score === null) {
    return null
  }

  return {
    name: rawName.slice(0, 64),
    score,
    ts,
  }
}

function sanitizeScores(value: unknown): OddOneOutScoreEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  const parsed = value
    .map((item) => sanitizeEntry(item))
    .filter((entry): entry is OddOneOutScoreEntry => entry !== null)

  parsed.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return a.ts - b.ts
  })

  return parsed
}

export async function postOddOneOutScore(name: string, score: number): Promise<void> {
  try {
    const response = await fetch(getApiUrl(SCORES_ENDPOINT), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        score,
      }),
    })

    if (!response.ok) {
      throw new Error(`Serveren svarede med status ${response.status}`)
    }
  } catch (error) {
    console.error('Kunne ikke gemme Odd One Out-highscore på serveren.', error)
    throw error instanceof Error
      ? error
      : new Error('Kunne ikke gemme Odd One Out-highscore på serveren.')
  }
}

export async function getOddOneOutScores(
  limit = 5,
): Promise<OddOneOutScoreEntry[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 5
  const endpointPath = `${SCORES_ENDPOINT}?limit=${safeLimit}`

  try {
    const response = await fetch(getApiUrl(endpointPath))

    if (!response.ok) {
      throw new Error(`Serveren svarede med status ${response.status}`)
    }

    const payload = (await response.json()) as { scores?: unknown } | undefined
    const data = payload?.scores ?? payload

    return sanitizeScores(data)
  } catch (error) {
    console.error('Kunne ikke hente Odd One Out-highscores fra serveren.', error)
    return []
  }
}
