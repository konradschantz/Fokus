export type Grid = number[][]

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row])
}

export function createFilledGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 1))
}

export function applyGravity(grid: Grid): void {
  const rows = grid.length
  if (rows === 0) {
    return
  }

  const cols = grid[0]!.length

  for (let col = 0; col < cols; col += 1) {
    let ones = 0
    for (let row = 0; row < rows; row += 1) {
      if (grid[row]?.[col] === 1) {
        ones += 1
      }
    }

    for (let row = rows - 1; row >= 0; row -= 1) {
      if (ones > 0) {
        grid[row]![col] = 1
        ones -= 1
      } else {
        grid[row]![col] = 0
      }
    }
  }
}

export function isGravityStable(grid: Grid): boolean {
  const rows = grid.length
  if (rows === 0) {
    return true
  }

  const cols = grid[0]!.length

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (grid[row]?.[col] !== 1) {
        continue
      }

      if (row === rows - 1) {
        continue
      }

      if (grid[row + 1]?.[col] !== 1) {
        return false
      }
    }
  }

  return true
}

export function findGravityViolations(grid: Grid): boolean[][] {
  const rows = grid.length
  if (rows === 0) {
    return []
  }

  const cols = grid[0]!.length

  return grid.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (cell !== 1) {
        return false
      }

      if (rowIndex === rows - 1) {
        return false
      }

      return grid[rowIndex + 1]?.[colIndex] !== 1
    }),
  )
}

export function isReachable(start: Grid, target: Grid): boolean {
  if (start.length !== target.length) {
    return false
  }

  const rows = start.length
  if (rows === 0) {
    return target.length === 0
  }

  const cols = start[0]!.length
  for (let row = 0; row < rows; row += 1) {
    if (start[row]?.length !== cols || target[row]?.length !== cols) {
      return false
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (target[row]![col] === 1 && start[row]![col] !== 1) {
        return false
      }
    }
  }

  const state = cloneGrid(start)

  let removedAny = true
  const removalPositions: Array<{ row: number; col: number }> = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (target[row]![col] === 0) {
        removalPositions.push({ row, col })
      }
    }
  }

  while (removedAny) {
    removedAny = false

    for (const { row, col } of removalPositions) {
      if (state[row]![col] === 1 && target[row]![col] === 0) {
        state[row]![col] = 0
        applyGravity(state)
        removedAny = true
      }
    }
  }

  applyGravity(state)

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (state[row]![col] !== target[row]![col]) {
        return false
      }
    }
  }

  return true
}

function hashSeed(seed: string): number {
  let h = 2166136261

  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }

  h += h << 13
  h ^= h >>> 7
  h += h << 3
  h ^= h >>> 17
  h += h << 5

  return h >>> 0
}

class SeededRng {
  private state: number

  constructor(seed: string) {
    this.state = hashSeed(seed) || 1
  }

  next(): number {
    this.state = Math.imul(this.state, 1664525) + 1013904223
    return (this.state >>> 0) / 4294967296
  }

  nextInt(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive)
  }
}

export interface LevelBlueprint {
  rows: number
  cols: number
  removals: number
}

export interface GeneratedLevel {
  start: Grid
  target: Grid
  difficulty: {
    removals: number
  }
}

export interface LevelGenerationResult {
  levels: GeneratedLevel[]
  invalidLevels: number[]
  seed: string
}

export function generateLevels(
  seed: string,
  blueprints: readonly LevelBlueprint[],
): LevelGenerationResult {
  const rng = new SeededRng(seed)
  const levels: GeneratedLevel[] = []
  const invalidLevels: number[] = []

  blueprints.forEach((blueprint, index) => {
    const rows = blueprint.rows
    const cols = blueprint.cols
    const maxRemovals = Math.max(1, Math.min(rows * cols - 1, blueprint.removals))

    const start = createFilledGrid(rows, cols)
    const working = cloneGrid(start)

    let performedRemovals = 0
    for (let step = 0; step < maxRemovals; step += 1) {
      const filledCells: Array<{ row: number; col: number }> = []
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (working[row]![col] === 1) {
            filledCells.push({ row, col })
          }
        }
      }

      if (filledCells.length <= 1) {
        break
      }

      const selected = filledCells[rng.nextInt(filledCells.length)]!
      working[selected.row]![selected.col] = 0
      applyGravity(working)
      performedRemovals += 1
    }

    const target = cloneGrid(working)
    const level: GeneratedLevel = {
      start,
      target,
      difficulty: {
        removals: performedRemovals,
      },
    }

    levels.push(level)

    if (!isGravityStable(target) || !isReachable(start, target)) {
      invalidLevels.push(index)
    }
  })

  return { levels, invalidLevels, seed }
}
