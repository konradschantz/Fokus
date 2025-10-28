import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { PuzzleBloxLevel } from '../levels'
import { TargetBoard } from './TargetBoard'
import { PuzzleBoard } from './PuzzleBoard'
import type { BlockMatrix } from '../types'

interface LevelManagerProps {
  levels: PuzzleBloxLevel[]
  onClickSound?: () => void
  onWinSound?: () => void
}

interface GravityResult {
  board: BlockMatrix
  moved: boolean
}

function createBoardFromStart(
  start: number[][],
  levelIndex: number,
  idCounter: MutableRefObject<number>,
): BlockMatrix {
  return start.map((row, rowIndex) =>
    row.map((value, colIndex) => {
      if (value === 1) {
        idCounter.current += 1
        return {
          id: `lvl-${levelIndex}-${rowIndex}-${colIndex}-${idCounter.current}`,
          wasFloating: false,
        }
      }

      return null
    }),
  )
}

function cloneBoard(board: BlockMatrix): BlockMatrix {
  return board.map((row) => row.map((cell) => (cell ? { ...cell, wasFloating: false } : null)))
}

function applyGravity(board: BlockMatrix): GravityResult {
  const rows = board.length
  const columns = rows > 0 ? board[0]!.length : 0
  const nextBoard: BlockMatrix = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => null),
  )

  let moved = false

  for (let col = 0; col < columns; col += 1) {
    let targetRow = rows - 1

    for (let row = rows - 1; row >= 0; row -= 1) {
      const cell = board[row]![col]

      if (!cell) {
        continue
      }

      const didMove = targetRow !== row
      moved = moved || didMove
      nextBoard[targetRow]![col] = didMove ? { ...cell, wasFloating: true } : { ...cell }
      targetRow -= 1
    }
  }

  return { board: nextBoard, moved }
}

function clearFloating(board: BlockMatrix): BlockMatrix {
  return board.map((row) => row.map((cell) => (cell ? { ...cell, wasFloating: false } : null)))
}

function boardMatchesTarget(board: BlockMatrix, target: number[][]): boolean {
  if (board.length !== target.length) {
    return false
  }

  for (let row = 0; row < target.length; row += 1) {
    if (board[row]!.length !== target[row]!.length) {
      return false
    }

    for (let col = 0; col < target[row]!.length; col += 1) {
      const hasBlock = board[row]![col] !== null
      if ((target[row]![col] === 1) !== hasBlock) {
        return false
      }
    }
  }

  return true
}

export function LevelManager({ levels, onClickSound, onWinSound }: LevelManagerProps) {
  const idCounter = useRef(0)
  const [levelIndex, setLevelIndex] = useState(0)
  const [board, setBoard] = useState<BlockMatrix>(() =>
    createBoardFromStart(levels[0]!.start, 0, idCounter),
  )
  const boardRef = useRef(board)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const floatingTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    boardRef.current = board
  }, [board])

  const currentLevel = useMemo(() => levels[levelIndex]!, [levels, levelIndex])

  const scheduleFloatingReset = useCallback((nextBoard: BlockMatrix) => {
    const hasFloating = nextBoard.some((row) => row.some((cell) => cell?.wasFloating))
    if (!hasFloating) {
      return
    }

    if (floatingTimeoutRef.current) {
      window.clearTimeout(floatingTimeoutRef.current)
    }

    floatingTimeoutRef.current = window.setTimeout(() => {
      setBoard((current) => clearFloating(current))
      floatingTimeoutRef.current = null
    }, 220)
  }, [])

  useEffect(() => {
    return () => {
      if (floatingTimeoutRef.current) {
        window.clearTimeout(floatingTimeoutRef.current)
      }
    }
  }, [])

  const advanceLevel = useCallback(() => {
    setLevelIndex((previous) => {
      const nextIndex = (previous + 1) % levels.length
      const nextBoard = createBoardFromStart(levels[nextIndex]!.start, nextIndex, idCounter)
      setBoard(nextBoard)
      boardRef.current = nextBoard
      return nextIndex
    })
  }, [levels])

  const handleVictory = useCallback(() => {
    setIsTransitioning(true)
    setShowCelebration(true)
    onWinSound?.()

    window.setTimeout(() => {
      setShowCelebration(false)
      advanceLevel()
      setIsTransitioning(false)
    }, 1200)
  }, [advanceLevel, onWinSound])

  const handleRemove = useCallback(
    (row: number, col: number) => {
      if (isTransitioning) {
        return
      }

      const currentBoard = boardRef.current
      const targetCell = currentBoard[row]?.[col]

      if (!targetCell) {
        return
      }

      onClickSound?.()

      const working = cloneBoard(currentBoard)
      working[row]![col] = null

      const { board: withGravity, moved } = applyGravity(working)

      setBoard(withGravity)
      boardRef.current = withGravity

      if (boardMatchesTarget(withGravity, currentLevel.target)) {
        handleVictory()
        return
      }

      if (moved) {
        scheduleFloatingReset(withGravity)
      }
    },
    [boardRef, currentLevel.target, handleVictory, isTransitioning, onClickSound, scheduleFloatingReset],
  )

  useEffect(() => {
    const matches = boardMatchesTarget(board, currentLevel.target)
    if (matches && !isTransitioning) {
      handleVictory()
    }
  }, [board, currentLevel.target, handleVictory, isTransitioning])

  return (
    <div className="puzzle-blox__layout">
      <div className="puzzle-blox__boards">
        <TargetBoard pattern={currentLevel.target} />
        <PuzzleBoard board={board} onRemove={handleRemove} disabled={isTransitioning} />
      </div>

      <div className="puzzle-blox__level-indicator" role="status" aria-live="polite">
        Niveau {levelIndex + 1} af {levels.length}
      </div>

      <AnimatePresence>
        {showCelebration ? (
          <motion.div
            className="puzzle-blox__celebration"
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <p>Korrekt! Godt klaret!</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
