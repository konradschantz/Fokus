import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import './PatternPulseGame.css'

type GameStatus = 'idle' | 'showing' | 'awaiting' | 'transition' | 'failed'

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

type PatternPulseGameProps = {
  startSignal?: number
  onFinished?: (summary: { level: number; bestLevel: number; timeLeft: number }) => void
}

export default function PatternPulseGame({ startSignal, onFinished }: PatternPulseGameProps) {
  const [sequence, setSequence] = useState<number[]>([])
  const [status, setStatus] = useState<GameStatus>('idle')
  const [activePad, setActivePad] = useState<number | null>(null)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [level, setLevel] = useState(0)
  const [bestLevel, setBestLevel] = useState(0)
  const [message, setMessage] = useState('Tryk på start for at se den første pulssekvens.')
  const [timerSeconds, setTimerSeconds] = useState(45)
  const [timerActive, setTimerActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const timeoutsRef = useRef<number[]>([])
  const timerIntervalRef = useRef<number | null>(null)

  const highlightDelay = useMemo(() => 520 - Math.min(level * 12, 180), [level])

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id))
    timeoutsRef.current = []
  }, [])

  const endGameDueToTimer = useCallback(() => {
    setTimerActive(false)
    setIsFinished(true)
    setStatus('failed')
    setMessage('Tiden er gået. Prøv igen og slå din rekord.')
    onFinished?.({ level, bestLevel: Math.max(bestLevel, level), timeLeft: 0 })
  }, [bestLevel, level, onFinished])

  useEffect(() => {
    if (!timerActive) {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      return
    }

    timerIntervalRef.current = window.setInterval(() => {
      setTimerSeconds((prev) => {
        const next = Math.max(0, prev - 1)
        if (next <= 0) {
          if (timerIntervalRef.current !== null) {
            window.clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
          }
          endGameDueToTimer()
        }
        return next
      })
    }, 1000)

    return () => {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [timerActive, endGameDueToTimer])

  useEffect(() => {
    return () => {
      clearTimeouts()
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [clearTimeouts])

  useEffect(() => {
    if (typeof startSignal === 'number') {
      beginGame()
    }
  }, [startSignal])

  useEffect(() => {
    if (status !== 'showing') {
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
  }, [highlightDelay, sequence, status, clearTimeouts])

  const beginGame = () => {
    clearTimeouts()
    setIsFinished(false)
    const firstSequence = [createRandomPadIndex()]
    setSequence(firstSequence)
    setLevel(1)
    setPlayerIndex(0)
    setStatus('showing')
    setMessage('Følg lyset og memorer sekvensen.')
    setTimerSeconds(45)
    setTimerActive(true)
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
        setStatus('transition')
        setBestLevel((previous) => Math.max(previous, nextLevel))

        const pauseTimeout = window.setTimeout(() => {
          setStatus('showing')
          setMessage('Ny sekvens – følg lyset.')
        }, 1000)
        timeoutsRef.current.push(pauseTimeout)
      }
    } else {
      setStatus('failed')
      setIsFinished(true)
      setMessage('Sekvensen blev brudt. Prøv igen for at slå din rekord.')
      setBestLevel((previous) => Math.max(previous, level))
      setActivePad(padIndex)
      setTimerActive(false)
      const resetTimeout = window.setTimeout(() => {
        setActivePad(null)
      }, 400)
      timeoutsRef.current.push(resetTimeout)
      onFinished?.({ level, bestLevel: Math.max(bestLevel, level), timeLeft: timerSeconds })
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
    setTimerSeconds(45)
    setTimerActive(false)
    setIsFinished(false)
  }

  const padStyle = (pad: PatternPad): PadCSSProperties => ({
    '--pad-color': pad.base,
    '--pad-active-color': pad.glow,
  })

  return (
    <div className="pattern-pulse-game pattern-pulse-game--immersive">
      <div className="pattern-pulse-game__header">
        <div>
          <span className="pattern-pulse-game__eyebrow">Pattern Pulse</span>
          <p className="pattern-pulse-game__title">Memorér sekvensen</p>
          <p className="pattern-pulse-game__subtitle">{message}</p>
        </div>
        <div className="pattern-pulse-game__meters">
          <div className="pattern-pulse-game__meter">
            <span>Tid</span>
            <strong>{timerSeconds}s</strong>
          </div>
          <div className="pattern-pulse-game__meter">
            <span>Niveau</span>
            <strong>{level}</strong>
          </div>
          <div className="pattern-pulse-game__meter">
            <span>Bedste</span>
            <strong>{bestLevel}</strong>
          </div>
        </div>
      </div>

      <div className="pattern-pulse-game__grid">
        <div className="pattern-pulse-game__pads">
          {pads.map((pad, index) => {
            return (
              <button
                key={pad.id}
                type="button"
                className={`pattern-pulse-game__pad ${
                  activePad === index ? 'is-active' : ''
                } ${status === 'awaiting' ? 'is-clickable' : ''}`}
                style={padStyle(pad)}
                onClick={() => handlePadClick(index)}
                disabled={status !== 'awaiting'}
                aria-label={pad.label}
              />
            )
          })}
        </div>

        <div className="pattern-pulse-game__actions">
          {!timerActive && !isFinished && (
            <button
              type="button"
              className="menu__primary-button"
              onClick={beginGame}
              disabled={status === 'showing' || status === 'transition'}
            >
              Start sekvensen
            </button>
          )}
          <button
            type="button"
            className="menu__secondary-button"
            onClick={handleReset}
            disabled={timerActive}
          >
            Nulstil
          </button>
        </div>
      </div>
    </div>
  )
}
