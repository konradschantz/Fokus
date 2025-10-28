import {
  type GeneratedLevel,
  type Grid,
  type LevelBlueprint,
  type LevelGenerationResult,
  generateLevels,
} from './logic'

export interface PuzzleBloxLevel extends GeneratedLevel {}

export const PUZZLE_BLOX_DEFAULT_SEED = 'puzzle-blox-default'

export const PUZZLE_BLOX_BLUEPRINTS: readonly LevelBlueprint[] = [
  { rows: 3, cols: 3, removals: 3 },
  { rows: 4, cols: 4, removals: 6 },
  { rows: 5, cols: 5, removals: 9 },
  { rows: 4, cols: 4, removals: 7 },
  { rows: 5, cols: 5, removals: 11 },
]

export interface PuzzleBloxLevelSet extends LevelGenerationResult {
  levels: PuzzleBloxLevel[]
}

export function generatePuzzleBloxLevels(
  seed: string = PUZZLE_BLOX_DEFAULT_SEED,
  blueprints: readonly LevelBlueprint[] = PUZZLE_BLOX_BLUEPRINTS,
): PuzzleBloxLevelSet {
  const result = generateLevels(seed, blueprints)
  return {
    ...result,
    levels: result.levels as PuzzleBloxLevel[],
  }
}

export const puzzleBloxLevelSet = generatePuzzleBloxLevels()
export const puzzleBloxLevels: PuzzleBloxLevel[] = puzzleBloxLevelSet.levels
export const puzzleBloxInvalidLevels: number[] = puzzleBloxLevelSet.invalidLevels
export const puzzleBloxLevelSeed: string = puzzleBloxLevelSet.seed

export type { Grid }
