import { BlockStatic } from './Block'

interface TargetBoardProps {
  pattern: number[][]
  showDebug?: boolean
  debugMask?: boolean[][]
}

export function TargetBoard({ pattern, showDebug, debugMask }: TargetBoardProps) {
  const rows = pattern.length
  const columns = rows > 0 ? pattern[0]!.length : 0

  return (
    <section className="puzzle-blox__panel puzzle-blox__panel--compact">
      <header className="puzzle-blox__panel-header">
        <h2>Målfigur</h2>
        <p>Genskab figuren for at vinde.</p>
      </header>

      <div
        className="puzzle-blox__grid"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {pattern.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isViolation = showDebug && debugMask?.[rowIndex]?.[colIndex]
            const cellClass = isViolation
              ? 'puzzle-blox__cell puzzle-blox__cell--violation'
              : 'puzzle-blox__cell'

            return (
              <div key={`target-${rowIndex}-${colIndex}`} className={cellClass}>
                {cell ? (
                  <BlockStatic
                    layoutId={`target-${rowIndex}-${colIndex}`}
                    variant="target"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                  />
                ) : (
                  <div className="puzzle-blox__placeholder" aria-hidden="true" />
                )}
              </div>
            )
          }),
        )}
      </div>
    </section>
  )
}
