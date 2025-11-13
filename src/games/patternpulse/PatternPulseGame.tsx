import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import './PatternPulseGame.css'

type GameStatus = 'idle' | 'showing' | 'awaiting' | 'failed'

type PatternPad = {
  id: string
  label: string
  base: string
  glow: string
}

const pads: PatternPad[] = [
  { id: 'azure', label: 'Blå puls', base: '#3b82f6', glow: '#60a5fa' },
  { id: 'amber', label: 'Gylden puls', base: '#f59e0b', glow: '#fbbf24' },
  { id: 'rose', label: 'Rosa puls', base: '#ec4899', glow: '#f472b6' },
  { id: 'emerald', label: 'Grøn puls', base: '#10b981', glow: '#34d399' },
]

type PadCSSProperties = CSSProperties & {
  '--pad-color': string
  '--pad-active-color': string
}

function createRandomPadIndex(): number {
  return Math.floor(Math.random() * pads.length)
}

export default function PatternPulseGame() {
  const [sequence, setSequence] = useState<number[]>([])
  const [status, setStatus] = useState<GameStatus>('idle')
  const [activePad, setActivePad] = useState<number | null>(null)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [level, setLevel] = useState(0)
  const [bestLevel, setBestLevel] = useState(0)
  const [message, setMessage] = useState('Tryk på start for at se den første pulssekvens.')

  const timeoutsRef = useRef<number[]>([])

  const highlightDelay = useMemo(() => Math.max(450, 900 - level * 45), [level])

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id))
    timeoutsRef.current = []
  }

  useEffect(() => {
    return () => {
      clearTimeouts()
    }
  }, [])

  useEffect(() => {
    if (status !== 'showing' || sequence.length === 0) {
      return
    }

    clearTimeouts()

    sequence.forEach((padIndex, index) => {
      const highlightTimeout = window.setTimeout(() => {
        setActivePad(padIndex)
      }, index * highlightDelay)

      const clearTimeoutId = window.setTimeout(() => {
        setActivePad(null)
      }, index * highlightDelay + highlightDelay * 0.65)

      timeoutsRef.current.push(highlightTimeout, clearTimeoutId)
    })

    const finishTimeout = window.setTimeout(() => {
      setActivePad(null)
      setStatus('awaiting')
      setMessage('Gentag mønsteret ved at trykke på farverne i den rigtige rækkefølge.')
    }, sequence.length * highlightDelay + 220)

    timeoutsRef.current.push(finishTimeout)
  }, [highlightDelay, sequence, status])

  const beginGame = () => {
    clearTimeouts()
    const firstSequence = [createRandomPadIndex()]
    setSequence(firstSequence)
    setLevel(1)
    setPlayerIndex(0)
    setStatus('showing')
    setMessage('Følg lyset og memorer sekvensen.')
  }

  const handlePadClick = (padIndex: number) => {
    if (status !== 'awaiting') {
      return
    }

    const expectedIndex = sequence[playerIndex]

    if (padIndex === expectedIndex) {
      setPlayerIndex((current) => current + 1)

      if (playerIndex + 1 === sequence.length) {
        const nextSequence = [...sequence, createRandomPadIndex()]
        const nextLevel = level + 1

        setSequence(nextSequence)
        setPlayerIndex(0)
        setLevel(nextLevel)
        setStatus('showing')
        setMessage('Stærkt! Sekvensen bliver længere – hold fokus.')
        setBestLevel((previous) => Math.max(previous, nextLevel))
      }
    } else {
      setStatus('failed')
      setMessage('Sekvensen blev brudt. Prøv igen for at slå din rekord.')
      setBestLevel((previous) => Math.max(previous, level))
      setActivePad(padIndex)
      const resetTimeout = window.setTimeout(() => {
        setActivePad(null)
      }, 400)
      timeoutsRef.current.push(resetTimeout)
    }
  }

  const handleReset = () => {
    clearTimeouts()
    setSequence([])
    setStatus('idle')
    setActivePad(null)
    setPlayerIndex(0)
    setLevel(0)
    setMessage('Tryk på start for at se den første pulssekvens.')
  }

  return (
    <div className="pattern-pulse-game">
      <div className="pattern-pulse-game__stage">
        <p className="pattern-pulse-game__status" role="status">
          {message}
        </p>

        <div className="pattern-pulse-game__pads" aria-live="polite">
          {pads.map((pad, index) => {
            const padStyle: PadCSSProperties = {
              '--pad-color': pad.base,
              '--pad-active-color': pad.glow,
            }

            return (
              <button
                key={pad.id}
                type="button"
                className={`pattern-pulse-game__pad ${
                  activePad === index ? 'is-active' : ''
                } ${status === 'awaiting' ? 'is-clickable' : ''}`}
                style={padStyle}
                onClick={() => handlePadClick(index)}
                disabled={status !== 'awaiting'}
                aria-label={pad.label}
              />
            )
          })}
        </div>

        <div className="pattern-pulse-game__actions">
          <button
            type="button"
            className="menu__primary-button"
            onClick={beginGame}
            disabled={status === 'showing'}
          >
            Start sekvensen
          </button>
          <button
            type="button"
            className="menu__secondary-button"
            onClick={handleReset}
          >
            Nulstil
          </button>
        </div>
      </div>

      <aside className="game-scoreboard pattern-pulse-game__scoreboard">
        <h2 className="game-scoreboard__title">Sekvensdata</h2>
        <dl className="game-scoreboard__rows">
          <div className="game-scoreboard__row">
            <dt>Nuværende niveau</dt>
            <dd>{level}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Bedste niveau</dt>
            <dd>{bestLevel}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Trin i sekvens</dt>
            <dd>{sequence.length}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Status</dt>
            <dd>
              {status === 'idle'
                ? 'Klar til start'
                : status === 'showing'
                  ? 'Viser mønster'
                  : status === 'awaiting'
                    ? 'Din tur'
                    : 'Sekvens misset'}
            </dd>
          </div>
        </dl>
        <p className="pattern-pulse-game__hint">
          Træn din arbejdshukommelse ved at holde styr på længere og længere sekvenser. Målet er at
          reagere uden tøven, selv når tempoet stiger.
        </p>
      </aside>
    </div>
  )
}
