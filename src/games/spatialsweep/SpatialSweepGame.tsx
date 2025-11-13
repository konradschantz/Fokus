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

export default function SpatialSweepGame() {
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

  const timeoutsRef = useRef<number[]>([])

  const highlightDelay = useMemo(() => Math.max(520, 1000 - level * 60), [level])

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id))
    timeoutsRef.current = []
  }

  useEffect(() => () => clearTimeouts(), [])

  const beginRound = useCallback(
    (nextLevel: number, reusePattern = false) => {
      clearTimeouts()
      setStatus('showing')
      setRoundStart(null)
      setSelectedCells([])
      setMessage('Memorér mønsteret – felterne lyser ét ad gangen.')
      setPattern((previous) => {
        if (reusePattern && previous.length > 0) {
          return [...previous]
        }
        return createPattern(nextLevel)
      })
    },
    [],
  )

  useEffect(() => {
    if (status !== 'showing' || pattern.length === 0) {
      return
    }

    clearTimeouts()

    pattern.forEach((cellIndex, index) => {
      const highlightTimeout = window.setTimeout(() => {
        setActiveCells([cellIndex])
      }, index * highlightDelay)

      const releaseTimeout = window.setTimeout(() => {
        setActiveCells([])
      }, index * highlightDelay + highlightDelay * 0.6)

      timeoutsRef.current.push(highlightTimeout, releaseTimeout)
    })

    const finishTimeout = window.setTimeout(() => {
      setActiveCells([])
      setStatus('guessing')
      setMessage('Vælg de felter, der var tændt. Du kan ombestemme dig, indtil du har markeret alle.')
      setRoundStart(performance.now())
    }, pattern.length * highlightDelay + 250)

    timeoutsRef.current.push(finishTimeout)
  }, [highlightDelay, pattern, status])

  const handleStart = () => {
    setAttemptsLeft(MAX_ATTEMPTS)
    setTimes([])
    setBestLevel((previous) => Math.max(previous, level - 1))
    setLevel(1)
    beginRound(1)
  }

  const handleCellToggle = (cellIndex: number) => {
    if (status !== 'guessing') {
      return
    }

    setSelectedCells((previous) => {
      if (previous.includes(cellIndex)) {
        return previous.filter((value) => value !== cellIndex)
      }
      const nextSelection = [...previous, cellIndex]
      if (nextSelection.length === pattern.length) {
        evaluateSelection(nextSelection)
      }
      return nextSelection
    })
  }

  const evaluateSelection = (selection: number[]) => {
    const isCorrect =
      selection.length === pattern.length &&
      pattern.every((cell) => selection.includes(cell))

    setStatus('feedback')
    setActiveCells([...pattern])

    if (roundStart !== null) {
      const elapsed = performance.now() - roundStart
      setTimes((previous) => [...previous, elapsed])
    }

    const feedbackTimeout = window.setTimeout(() => {
      setActiveCells([])
      if (isCorrect) {
        const nextLevel = level + 1
        setLevel(nextLevel)
        setBestLevel((previous) => Math.max(previous, nextLevel))
        setMessage('Flot! Sekvensen udvides – hold fokus på detaljerne.')
        beginRound(nextLevel)
      } else {
        const remainingAttempts = attemptsLeft - 1
        setAttemptsLeft(remainingAttempts)
        if (remainingAttempts <= 0) {
          setStatus('gameover')
          setMessage('Alle forsøg brugt. Start forfra for at opbygge en ny serie.')
        } else {
          setStatus('showing')
          setMessage('Ikke helt. Se mønsteret igen og prøv en gang til.')
          beginRound(level, true)
        }
      }
    }, 900)

    timeoutsRef.current.push(feedbackTimeout)
  }

  const averageTime = useMemo(() => {
    if (times.length === 0) {
      return 0
    }
    const total = times.reduce((sum, value) => sum + value, 0)
    return Math.round(total / times.length)
  }, [times])

  return (
    <div className="spatial-sweep-game">
      <div className="spatial-sweep-game__stage">
        <p className="spatial-sweep-game__status" role="status">
          {message}
        </p>

        <div
          className={`spatial-sweep-game__grid ${
            status === 'showing' ? 'is-locked' : ''
          }`}
          role="group"
          aria-label="Hukommelsesgitter"
        >
          {Array.from({ length: TOTAL_CELLS }, (_, index) => {
            const isActive = activeCells.includes(index)
            const isSelected = selectedCells.includes(index)
            const isCorrectCell = pattern.includes(index)
            const isIncorrectSelection = isSelected && !isCorrectCell && status === 'feedback'

            return (
              <button
                key={index}
                type="button"
                className={`spatial-sweep-game__cell ${
                  isActive ? 'is-active' : ''
                } ${isSelected ? 'is-selected' : ''} ${isIncorrectSelection ? 'is-wrong' : ''}`}
                onClick={() => handleCellToggle(index)}
                disabled={status === 'showing' || status === 'gameover'}
                aria-pressed={isSelected}
              />
            )
          })}
        </div>

        <div className="spatial-sweep-game__actions">
          <button
            type="button"
            className="menu__primary-button"
            onClick={handleStart}
          >
            {status === 'idle' || status === 'gameover' ? 'Start Spatial Sweep' : 'Genstart'}
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

      <aside className="game-scoreboard spatial-sweep-game__scoreboard">
        <h2 className="game-scoreboard__title">Fokusdata</h2>
        <dl className="game-scoreboard__rows">
          <div className="game-scoreboard__row">
            <dt>Niveau</dt>
            <dd>{status === 'idle' ? '-' : level}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Bedste niveau</dt>
            <dd>{bestLevel}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Felter i mønster</dt>
            <dd>{pattern.length}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Forsøg tilbage</dt>
            <dd>{attemptsLeft}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Gennemsnitlig reaktion</dt>
            <dd>{averageTime > 0 ? `${Math.round(averageTime / 10) / 100} sek` : '-'}</dd>
          </div>
        </dl>
        <p className="spatial-sweep-game__hint">
          Spatial Sweep udfordrer din rumlige arbejdshukommelse. Udvid gradvist din kapacitet ved at
          klare længere mønstre uden fejl.
        </p>
      </aside>
    </div>
  )
}
