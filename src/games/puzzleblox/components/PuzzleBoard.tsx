import { AnimatePresence } from 'framer-motion'
import type { BlockMatrix } from '../types'
import { BlockButton } from './Block'

interface PuzzleBoardProps {
  board: BlockMatrix
  onRemove: (row: number, col: number) => void
  disabled?: boolean
}

export function PuzzleBoard({ board, onRemove, disabled }: PuzzleBoardProps) {
  const rows = board.length
  const columns = rows > 0 ? board[0]!.length : 0

  return (
    <section className="puzzle-blox__panel">
      <header className="puzzle-blox__panel-header">
        <h2>Puzzle Blox</h2>
        <p>Fjern blokke herunder for at matche figuren.</p>
      </header>

      <div
        className="puzzle-blox__grid"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div key={`cell-${rowIndex}-${colIndex}`} className="puzzle-blox__cell">
              <AnimatePresence>
                {cell ? (
                  <BlockButton
                    key={cell.id}
                    layoutId={cell.id}
                    variant="active"
                    interactive={!disabled}
                    disabled={disabled}
                    isFloating={cell.wasFloating}
                    onClick={() => {
                      if (!disabled) {
                        onRemove(rowIndex, colIndex)
                      }
                    }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    whileHover={{ scale: disabled ? 1 : 1.02 }}
                  />
                ) : null}
              </AnimatePresence>
            </div>
          )),
        )}
      </div>
    </section>
  )
}
