import { getApiUrl } from './apiBase'

export type MemoryDifficulty = 'easy' | 'medium' | 'hard'

export interface MemoryHighscoreEntry {
  bestMoves: number | null
  bestTimeMs: number | null
}

export type MemoryHighscores = Record<MemoryDifficulty, MemoryHighscoreEntry>

const defaultEntry: MemoryHighscoreEntry = { bestMoves: null, bestTimeMs: null }

export const defaultHighscores: MemoryHighscores = {
  easy: { ...defaultEntry },
  medium: { ...defaultEntry },
  hard: { ...defaultEntry },
}

function cloneDefaultHighscores(): MemoryHighscores {
  return {
    easy: { ...defaultEntry },
    medium: { ...defaultEntry },
    hard: { ...defaultEntry },
  }
}

function sanitizeEntry(value: unknown): MemoryHighscoreEntry {
  if (!value || typeof value !== 'object') {
    return { ...defaultEntry }
  }

  const record = value as Record<string, unknown>
  const bestMoves = record.bestMoves
  const bestTimeMs = record.bestTimeMs

  return {
    bestMoves:
      typeof bestMoves === 'number' && Number.isFinite(bestMoves)
        ? bestMoves
        : null,
    bestTimeMs:
      typeof bestTimeMs === 'number' && Number.isFinite(bestTimeMs)
        ? bestTimeMs
        : null,
  }
}

function sanitizeHighscores(value: unknown): MemoryHighscores {
  if (!value || typeof value !== 'object') {
    return cloneDefaultHighscores()
  }

  const source = value as Record<string, unknown>

  return {
    easy: sanitizeEntry(source.easy),
    medium: sanitizeEntry(source.medium),
    hard: sanitizeEntry(source.hard),
  }
}

export async function loadHighscores(): Promise<MemoryHighscores> {
  try {
    const response = await fetch(getApiUrl('/api/memory-highscores'))

    if (!response.ok) {
      throw new Error(`Serveren svarede med status ${response.status}`)
    }

    const payload = (await response.json()) as { highscores?: unknown } | undefined
    const data = payload?.highscores ?? payload

    return sanitizeHighscores(data)
  } catch (error) {
    console.error('Kunne ikke indlæse memory-highscores fra serveren.', error)
    return cloneDefaultHighscores()
  }
}

export async function saveHighscores(highscores: MemoryHighscores): Promise<void> {
  try {
    const response = await fetch(getApiUrl('/api/memory-highscores'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ highscores }),
    })

    if (!response.ok) {
      throw new Error(`Serveren svarede med status ${response.status}`)
    }
  } catch (error) {
    console.error('Kunne ikke gemme memory-highscores på serveren.', error)
  }
}

export function createDefaultHighscores(): MemoryHighscores {
  return cloneDefaultHighscores()
}
