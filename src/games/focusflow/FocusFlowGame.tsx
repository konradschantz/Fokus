import { useCallback, useMemo, useState } from 'react'
import { shuffle } from '../../utils/shuffle'
import './FocusFlowGame.css'

type GameStatus = 'idle' | 'active' | 'failed'

function createNumbers(level: number): number[] {
  const count = Math.min(6 + level * 2, 28)
  const numbers = Array.from({ length: count }, (_, index) => index + 1)
  return shuffle(numbers)
}

export default function FocusFlowGame() {
  const [numbers, setNumbers] = useState<number[]>([])
  const [cleared, setCleared] = useState<Set<number>>(new Set())
  const [nextTarget, setNextTarget] = useState(1)
  const [level, setLevel] = useState(1)
  const [bestLevel, setBestLevel] = useState(0)
  const [lives, setLives] = useState(3)
  const [status, setStatus] = useState<GameStatus>('idle')
  const [message, setMessage] = useState('Start Focus Flow og klik på tallene i stigende rækkefølge.')

  const gridColumns = useMemo(() => {
    const length = numbers.length
    if (length <= 6) {
      return 3
    }
    if (length <= 12) {
      return 4
    }
    if (length <= 20) {
      return 5
    }
    return 6
  }, [numbers.length])

  const beginGame = useCallback(() => {
    setLevel(1)
    setLives(3)
    setStatus('active')
    setCleared(new Set())
    setNextTarget(1)
    setNumbers(createNumbers(1))
    setMessage('Klik på tallene 1, 2, 3 ... så hurtigt og præcist som muligt.')
  }, [])

  const resetGame = () => {
    setStatus('idle')
    setNumbers([])
    setCleared(new Set())
    setNextTarget(1)
    setLevel(1)
    setLives(3)
    setMessage('Start Focus Flow og klik på tallene i stigende rækkefølge.')
  }

  const advanceLevel = useCallback(
    (currentLevel: number) => {
      const nextLevel = currentLevel + 1
      setLevel(nextLevel)
      setBestLevel((previous) => Math.max(previous, nextLevel))
      setNumbers(createNumbers(nextLevel))
      setCleared(new Set())
      setNextTarget(1)
      setMessage('Tempoet stiger – hold roen og fortsæt sekvensen.')
    },
    [],
  )

  const handleNumberClick = (value: number) => {
    if (status !== 'active') {
      return
    }

    if (cleared.has(value)) {
      return
    }

    if (value === nextTarget) {
      const nextCleared = new Set(cleared)
      nextCleared.add(value)
      setCleared(nextCleared)

      if (nextCleared.size === numbers.length) {
        advanceLevel(level)
      } else {
        setNextTarget((previous) => previous + 1)
      }
    } else {
      const remainingLives = lives - 1
      setLives(remainingLives)
      setMessage(
        remainingLives > 0
          ? 'Forkert tal. Find roen og prøv igen.'
          : 'Ingen liv tilbage. Start forfra for at genopbygge flowet.',
      )
      if (remainingLives <= 0) {
        setStatus('failed')
      }
    }
  }

  return (
    <div className="focus-flow-game">
      <div className="focus-flow-game__stage">
        <p className="focus-flow-game__status" role="status">
          {message}
        </p>

        <div
          className={`focus-flow-game__grid focus-flow-game__grid--cols-${gridColumns}`}
          role="grid"
          aria-label="Taltræning"
        >
          {numbers.map((value) => {
            const isCleared = cleared.has(value)
            return (
              <button
                key={value}
                type="button"
                className={`focus-flow-game__cell ${isCleared ? 'is-cleared' : ''}`}
                onClick={() => handleNumberClick(value)}
                disabled={status !== 'active'}
              >
                {value}
              </button>
            )
          })}
        </div>

        <div className="focus-flow-game__actions">
          <button type="button" className="menu__primary-button" onClick={beginGame}>
            {status === 'idle' || status === 'failed' ? 'Start Focus Flow' : 'Genstart niveau'}
          </button>
          <button type="button" className="menu__secondary-button" onClick={resetGame}>
            Nulstil
          </button>
        </div>
      </div>

      <aside className="game-scoreboard focus-flow-game__scoreboard">
        <h2 className="game-scoreboard__title">Flowdata</h2>
        <dl className="game-scoreboard__rows">
          <div className="game-scoreboard__row">
            <dt>Nuværende niveau</dt>
            <dd>{status === 'idle' ? '-' : level}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Bedste niveau</dt>
            <dd>{bestLevel}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Næste tal</dt>
            <dd>{status === 'active' ? nextTarget : '-'}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Liv tilbage</dt>
            <dd>{lives}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Tal i spil</dt>
            <dd>{numbers.length}</dd>
          </div>
        </dl>
        <p className="focus-flow-game__hint">
          Focus Flow træner skift mellem scanning og præcision. Klik tallene i orden, selv når mængden
          vokser og layoutet ændres.
        </p>
      </aside>
    </div>
  )
}
