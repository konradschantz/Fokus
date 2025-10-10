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

export function loadHighscores(): MemoryHighscores {
  if (typeof window === 'undefined') {
    return cloneDefaultHighscores()
  }

  try {
    const stored = window.localStorage.getItem('memoryHighscores')
    if (!stored) {
      return cloneDefaultHighscores()
    }

    const parsed = JSON.parse(stored) as unknown
    const result = cloneDefaultHighscores()

    if (parsed && typeof parsed === 'object') {
      for (const difficulty of Object.keys(result) as MemoryDifficulty[]) {
        const entry = (parsed as Record<string, unknown>)[difficulty]
        if (entry && typeof entry === 'object') {
          const bestMoves = (entry as Record<string, unknown>).bestMoves
          const bestTimeMs = (entry as Record<string, unknown>).bestTimeMs
          result[difficulty] = {
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
      }
    }

    return result
  } catch (error) {
    console.warn('Kunne ikke indlæse memory-highscores, bruger defaults.', error)
    return cloneDefaultHighscores()
  }
}

export function saveHighscores(highscores: MemoryHighscores) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem('memoryHighscores', JSON.stringify(highscores))
  } catch (error) {
    console.warn('Kunne ikke gemme memory-highscores.', error)
  }
}
