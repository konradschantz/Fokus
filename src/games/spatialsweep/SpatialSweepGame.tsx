import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { shuffle } from '../../utils/shuffle'
import './SpatialSweepGame.css'

type GameStatus = 'idle' | 'showing' | 'guessing' | 'feedback' | 'gameover'

const GRID_SIZE = 4
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE
const MAX_ATTEMPTS = 3

function createPattern(level: number): number[] {
  const patternLength = Math.min(3 + level, 9)
  const indices = shuffle(Array.from({ length: TOTAL_CELLS }, (_, index) => index))
  return indices.slice(0, patternLength)
}

type SpatialSweepProps = {
  startSignal?: number
  onFinished?: (summary: { level: number; bestLevel: number; attemptsLeft: number; averageTime: number }) => void
}

export default function SpatialSweepGame({ startSignal, onFinished }: SpatialSweepProps) {
  const [pattern, setPattern] = useState<number[]>([])
  const [activeCells, setActiveCells] = useState<number[]>([])
  const [selectedCells, setSelectedCells] = useState<number[]>([])
  const [status, setStatus] = useState<GameStatus>('idle')
  const [level, setLevel] = useState(1)
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)
  const [message, setMessage] = useState('Start spillet for at se mønsteret, du skal huske.')
  const [bestLevel, setBestLevel] = useState(0)
  const [roundStart, setRoundStart] = useState<number | null>(null)
  const [times, setTimes] = useState<number[]>([])
  const [isFinished, setIsFinished] = useState(false)

  const timeoutsRef = useRef<number[]>([])

  const highlightDelay = useMemo(() => Math.max(520, 1000 - level * 60), [level])

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id))
    timeoutsRef.current = []
  }, [])

  useEffect(() => () => clearTimeouts(), [clearTimeouts])

  useEffect(() => {
    if (typeof startSignal === 'number') {
      beginRound(1, false)
    }
  }, [startSignal])

  const beginRound = useCallback(
    (nextLevel: number, isRetry: boolean) => {
      clearTimeouts()
      const nextPattern = createPattern(nextLevel)
      setPattern(nextPattern)
      setActiveCells([])
      setSelectedCells([])
      setStatus('showing')
      setMessage('Se mønsteret – det forsvinder om lidt.')
      setRoundStart(performance.now())
      setIsFinished(false)

      nextPattern.forEach((cellIndex, index) => {
        const highlightTimeout = window.setTimeout(() => {
          setActiveCells([cellIndex])
        }, index * highlightDelay)

        const clearTimeoutId = window.setTimeout(() => {
          setActiveCells([])
        }, index * highlightDelay + highlightDelay * 0.6)

        timeoutsRef.current.push(highlightTimeout, clearTimeoutId)
      })

      const finishTimeout = window.setTimeout(() => {
        setActiveCells([])
        setStatus('guessing')
        setMessage(isRetry ? 'Prøv igen og genskab mønsteret.' : 'Genskab mønsteret.')
      }, nextPattern.length * highlightDelay + 320)

      timeoutsRef.current.push(finishTimeout)

      if (!isRetry) {
        setLevel(nextLevel)
      }
    },
    [clearTimeouts, highlightDelay],
  )

  const handleCellClick = useCallback(
    (index: number) => {
      if (status !== 'guessing') {
        return
      }

      if (selectedCells.includes(index)) {
        return
      }

      const nextSelection = [...selectedCells, index]
      setSelectedCells(nextSelection)
      const elapsed = roundStart ? performance.now() - roundStart : 0

      if (elapsed > 0) {
        setTimes((prev) => [...prev, elapsed])
      }

      const isPatternComplete = nextSelection.length === pattern.length
      const isCorrect = isPatternComplete && pattern.every((value) => nextSelection.includes(value))

      if (!isPatternComplete) {
        return
      }

      if (isCorrect) {
        setStatus('feedback')
        setMessage('Korrekt! Nyt mønster på vej.')
        setBestLevel((prev) => Math.max(prev, level))

        const feedbackTimeout = window.setTimeout(() => {
          beginRound(level + 1, false)
        }, 900)
        timeoutsRef.current.push(feedbackTimeout)
      } else {
        const nextAttempts = attemptsLeft - 1
        setAttemptsLeft(nextAttempts)
        setStatus(nextAttempts <= 0 ? 'gameover' : 'feedback')
        setMessage(nextAttempts <= 0 ? 'Tiden er gået – prøv igen.' : 'Forkert. Prøv igen.')

        if (nextAttempts <= 0) {
          setIsFinished(true)
          onFinished?.({
            level,
            bestLevel: Math.max(bestLevel, level),
            attemptsLeft: nextAttempts,
            averageTime:
              times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 0,
          })
        } else {
          const retryTimeout = window.setTimeout(() => {
            beginRound(level, true)
          }, 1000)
          timeoutsRef.current.push(retryTimeout)
        }
      }
    },
    [attemptsLeft, beginRound, bestLevel, level, onFinished, pattern, roundStart, selectedCells, status, times],
  )

  const averageTimeMs = useMemo(() => {
    if (times.length === 0) return 0
    return times.reduce((sum, t) => sum + t, 0) / times.length
  }, [times])

  return (
    <div className="spatial-sweep-game spatial-sweep-game--immersive">
      <header className="spatial-sweep-game__header">
        <div>
          <p className="spatial-sweep-game__eyebrow">Spatial Sweep</p>
          <h2>Genskab mønsteret</h2>
          <p className="spatial-sweep-game__message">{message}</p>
        </div>
        <div className="spatial-sweep-game__metrics">
          <div>
            <span>Niveau</span>
            <strong>{level}</strong>
          </div>
          <div>
            <span>Bedste</span>
            <strong>{bestLevel}</strong>
          </div>
          <div>
            <span>Forsøg</span>
            <strong>{attemptsLeft}</strong>
          </div>
          <div>
            <span>Gns. reaktion</span>
            <strong>{averageTimeMs > 0 ? `${Math.round(averageTimeMs)} ms` : '-'}</strong>
          </div>
        </div>
      </header>

      <div className="spatial-sweep-game__board" role="grid" aria-label="Genskab mønsteret">
        {Array.from({ length: TOTAL_CELLS }, (_, index) => {
          const isActive = activeCells.includes(index)
          const isSelected = selectedCells.includes(index)
          const isPatternCell = pattern.includes(index)
          return (
            <button
              key={index}
              type="button"
              role="gridcell"
              className={`spatial-sweep-game__cell ${
                isActive ? 'is-active' : ''
              } ${isSelected ? 'is-selected' : ''}`}
              aria-pressed={isSelected}
              aria-label={`Felt ${index + 1}`}
              onClick={() => handleCellClick(index)}
              disabled={status !== 'guessing'}
            >
              <span className="spatial-sweep-game__cell-dot" data-target={isPatternCell} />
            </button>
          )
        })}
      </div>

      <div className="spatial-sweep-game__actions">
        {status === 'idle' && (
          <p className="spatial-sweep-game__hint">
            Start spillet for at se mønsteret, du skal huske.
          </p>
        )}
        <div className="spatial-sweep-game__action-row">
          <button
            type="button"
            className="menu__primary-button"
            onClick={() => beginRound(level, false)}
            disabled={status === 'showing'}
          >
            {status === 'idle' ? 'Start' : 'Næste'}
          </button>
          <button
            type="button"
            className="menu__secondary-button"
            onClick={() => beginRound(level, true)}
            disabled={status === 'idle' || status === 'showing'}
          >
            Se mønsteret igen
          </button>
        </div>
      </div>
    </div>
  )
}
