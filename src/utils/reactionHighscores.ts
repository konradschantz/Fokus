import { getApiUrl } from './apiBase'

const MAX_SCORES = 5

function sanitizeHighscores(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  const parsed = value
    .map((entry) => {
      if (typeof entry === 'number') {
        return entry
      }

      if (typeof entry === 'string') {
        const numeric = Number.parseFloat(entry)
        return Number.isFinite(numeric) ? numeric : Number.NaN
      }

      return Number.NaN
    })
    .filter((entry): entry is number => Number.isFinite(entry) && entry >= 0)

  parsed.sort((a, b) => a - b)

  return parsed.slice(0, MAX_SCORES)
}

export async function loadReactionHighscores(): Promise<number[]> {
  try {
    const response = await fetch(getApiUrl('/api/reaction-highscores'))

    if (!response.ok) {
      throw new Error(`Serveren svarede med status ${response.status}`)
    }

    const payload = (await response.json()) as { highscores?: unknown } | undefined
    const data = payload?.highscores ?? payload

    return sanitizeHighscores(data)
  } catch (error) {
    console.error('Kunne ikke indlæse reaktionstest-highscores fra serveren.', error)
    return []
  }
}

export async function saveReactionHighscores(highscores: number[]): Promise<void> {
  const sanitized = sanitizeHighscores(highscores)

  try {
    const response = await fetch(getApiUrl('/api/reaction-highscores'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ highscores: sanitized }),
    })

    if (!response.ok) {
      throw new Error(`Serveren svarede med status ${response.status}`)
    }
  } catch (error) {
    console.error('Kunne ikke gemme reaktionstest-highscores på serveren.', error)
  }
}

export function mergeReactionHighscores(
  existing: number[],
  attempt: number,
): number[] {
  const next = [...existing, attempt]
  next.sort((a, b) => a - b)
  return next.slice(0, MAX_SCORES)
}
