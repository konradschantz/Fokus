import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import BrandLogo from '../../components/BrandLogo'
import './SortingGame.css'

type ShapeType = 'square' | 'triangle' | 'circle'
type Direction = 'left' | 'right'

type Phase = 'idle' | 'running' | 'paused' | 'finished'

interface Shape {
  id: number
  type: ShapeType
  color: string
}

interface SortingRules {
  square: Direction
  triangle: Direction
  circle: Direction
}

const SHAPE_TYPES: ShapeType[] = ['square', 'triangle', 'circle']
const SHAPE_COLORS: Record<ShapeType, string> = {
  square: '#f97316',
  triangle: '#22d3ee',
  circle: '#a855f7',
}
const SHAPE_LABELS: Record<ShapeType, string> = {
  square: 'Firkant',
  triangle: 'Trekant',
  circle: 'Cirkel',
}

const GAME_DURATION_SECONDS = 60
const INITIAL_QUEUE_LENGTH = 5
const BEST_SCORE_STORAGE_KEY = 'sorting-game-best-score'

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function generateRules(): SortingRules {
  const mapping: SortingRules = {
    square: Math.random() > 0.5 ? 'left' : 'right',
    triangle: Math.random() > 0.5 ? 'left' : 'right',
    circle: Math.random() > 0.5 ? 'left' : 'right',
  }

  const uniqueDirections = new Set<Direction>([
    mapping.square,
    mapping.triangle,
    mapping.circle,
  ])

  if (uniqueDirections.size === 1) {
    const remainingDirection = mapping.square === 'left' ? 'right' : 'left'
    const shapeToFlip = randomItem<ShapeType>(SHAPE_TYPES)
    mapping[shapeToFlip] = remainingDirection
  }

  return mapping
}

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function createShape(id: number): Shape {
  const type = randomItem(SHAPE_TYPES)

  return {
    id,
    type,
    color: SHAPE_COLORS[type],
  }
}

interface SortingGameProps {
  onExit?: () => void
}

export default function SortingGame({ onExit }: SortingGameProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [queue, setQueue] = useState<Shape[]>(() =>
    Array.from({ length: INITIAL_QUEUE_LENGTH }, (_, index) => createShape(index)),
  )
  const [rules, setRules] = useState<SortingRules>(() => generateRules())
  const [score, setScore] = useState(0)
  const [sortedCount, setSortedCount] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    if (typeof window === 'undefined') {
      return 0
    }

    const storedValue = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY)
    return storedValue ? Number.parseInt(storedValue, 10) || 0 : 0
  })
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION_SECONDS)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)

  const shapeIdRef = useRef(queue.length)
  const scoreRef = useRef(score)
  const phaseRef = useRef<Phase>(phase)
  const forcedPauseRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const activeShape = queue[0]

  const updateBestScore = useCallback((finalScore: number) => {
    setBestScore((previous) => {
      if (finalScore <= previous) {
        return previous
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(finalScore))
      }

      return finalScore
    })
  }, [])

  const resetQueue = useCallback(() => {
    shapeIdRef.current = 0
    setQueue(Array.from({ length: INITIAL_QUEUE_LENGTH }, () => createShape(shapeIdRef.current++)))
  }, [])

  const finishGame = useCallback(() => {
    setPhase((currentPhase) => {
      if (currentPhase === 'finished') {
        return currentPhase
      }

      const finalScore = scoreRef.current
      updateBestScore(finalScore)
      phaseRef.current = 'finished'
      return 'finished'
    })
  }, [updateBestScore])

  const playFeedbackSound = useCallback((type: 'correct' | 'incorrect') => {
    if (typeof window === 'undefined') {
      return
    }

    const audioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!audioContextCtor) {
      return
    }

    let context = audioContextRef.current

    if (!context) {
      context = new audioContextCtor()
      audioContextRef.current = context
    }

    if (context.state === 'suspended') {
      void context.resume().catch(() => {})
    }

    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    const isCorrect = type === 'correct'
    const duration = isCorrect ? 0.35 : 0.45
    const startFrequency = isCorrect ? 880 : 240
    const endFrequency = isCorrect ? 1320 : 160
    const peakVolume = isCorrect ? 0.18 : 0.22

    oscillator.type = isCorrect ? 'triangle' : 'sawtooth'
    oscillator.frequency.setValueAtTime(startFrequency, now)
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration)

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(peakVolume, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start(now)
    oscillator.stop(now + duration + 0.05)
  }, [])

  const advanceCurrentShape = useCallback(
    (direction: Direction | null) => {
      setQueue((currentQueue) => {
        if (currentQueue.length === 0) {
          return currentQueue
        }

        const [currentShape, ...rest] = currentQueue
        const expectedDirection = rules[currentShape.type]
        const isCorrect = direction !== null && direction === expectedDirection

        setScore((previous) => {
          const nextScore = isCorrect ? previous + 1 : Math.max(0, previous - 1)
          scoreRef.current = nextScore
          return nextScore
        })

        setFeedback(isCorrect ? 'correct' : 'incorrect')
        playFeedbackSound(isCorrect ? 'correct' : 'incorrect')

        if (direction !== null) {
          setSortedCount((previous) => previous + 1)
        }

        const nextQueue = [...rest, createShape(shapeIdRef.current++)]
        return nextQueue
      })
    },
    [rules, playFeedbackSound],
  )

  const handleChoice = useCallback(
    (direction: Direction) => {
      if (phaseRef.current !== 'running') {
        return
      }

      advanceCurrentShape(direction)
    },
    [advanceCurrentShape],
  )

  useEffect(() => {
    if (phase !== 'running') {
      return
    }

    const interval = window.setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 1) {
          window.clearInterval(interval)
          finishGame()
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [phase, finishGame])

  useEffect(() => {
    if (phase !== 'running') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (phaseRef.current !== 'running') {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handleChoice('left')
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleChoice('right')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [phase, handleChoice])

  useEffect(() => {
    const handleBlur = () => {
      if (phaseRef.current === 'running') {
        forcedPauseRef.current = true
        setPhase('paused')
      }
    }

    const handleFocus = () => {
      if (forcedPauseRef.current && phaseRef.current === 'paused') {
        forcedPauseRef.current = false
        setPhase('running')
      }
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timeout = window.setTimeout(() => {
      setFeedback(null)
    }, 250)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [feedback])

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [])

  const startGame = useCallback(() => {
    setScore(0)
    scoreRef.current = 0
    setTimeRemaining(GAME_DURATION_SECONDS)
    setRules(generateRules())
    resetQueue()
    setFeedback(null)
    setSortedCount(0)
    forcedPauseRef.current = false
    setPhase('running')
  }, [resetQueue])

  const resumeGame = useCallback(() => {
    if (phaseRef.current === 'paused') {
      forcedPauseRef.current = false
      setPhase('running')
    }
  }, [])

  const leftShapes = useMemo(() => SHAPE_TYPES.filter((shape) => rules[shape] === 'left'), [rules])
  const rightShapes = useMemo(
    () => SHAPE_TYPES.filter((shape) => rules[shape] === 'right'),
    [rules],
  )

  return (
    <section className="menu sorting-game">
      <div className="menu__top-bar">
        <BrandLogo size={64} wordmarkSize="1.75rem" />
        <button type="button" className="menu__back-button" onClick={onExit}>
          Tilbage til menu
        </button>
      </div>

      <header className="menu__header sorting-game__header">
        <h1>Sorteringsspillet</h1>
        <p>
          Sortér figurerne efter reglerne ved at bruge piletasterne eller knapperne nedenfor.
        </p>
      </header>

      <div className="sorting-game__status">
        <div className="sorting-game__metric">
          <span className="sorting-game__metric-label">Score</span>
          <span className="sorting-game__metric-value">{score}</span>
        </div>
        <div className="sorting-game__metric">
          <span className="sorting-game__metric-label">Bedste</span>
          <span className="sorting-game__metric-value">{bestScore}</span>
        </div>
        <div className="sorting-game__metric">
          <span className="sorting-game__metric-label">Sorterede</span>
          <span className="sorting-game__metric-value">{sortedCount}</span>
        </div>
        <div className="sorting-game__metric">
          <span className="sorting-game__metric-label">Tid</span>
          <span className="sorting-game__metric-value">{formatTime(timeRemaining)}</span>
        </div>
      </div>

      <div className="sorting-game__play-area">
        <div className="sorting-game__rule-column sorting-game__rule-column--left">
          <div className="sorting-game__rule-title">Venstre</div>
          <div className="sorting-game__rule-items">
            {leftShapes.map((shape) => (
              <div key={`left-${shape}`} className={`sorting-game__rule-item sorting-game__rule-item--${shape}`}>
                <span
                  className={`sorting-game__rule-shape sorting-game__rule-shape--${shape}`}
                  style={{ '--shape-color': SHAPE_COLORS[shape] } as CSSProperties}
                  aria-hidden="true"
                />
                <span className="sorting-game__rule-label">{SHAPE_LABELS[shape]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sorting-game__queue">
          <div className="sorting-game__queue-track" aria-label="Figurkø">
            {queue.map((shape, index) => {
              const isActive = index === 0
              const offset = Math.min(index, 6)
              const translateX = offset * 2.6
              const translateY = offset * 0.35
              const scale = isActive ? 1 : Math.max(0.7, 1 - offset * 0.08)
              const opacity = isActive ? 1 : Math.max(0.35, 0.85 - offset * 0.1)
              const feedbackClass = isActive && feedback ? ` sorting-game__shape--${feedback}` : ''

              return (
                <div
                  key={shape.id}
                  className={`sorting-game__shape sorting-game__shape--${shape.type}${isActive ? ' sorting-game__shape--active' : ' sorting-game__shape--queued'}${feedbackClass}`}
                  style={
                    {
                      '--shape-color': shape.color,
                      transform: `translateX(calc(-50% + ${translateX}rem)) translateY(${translateY}rem) scale(${scale})`,
                      opacity,
                      zIndex: queue.length - index,
                    } as CSSProperties
                  }
                  aria-label={isActive ? `Aktiv figur: ${SHAPE_LABELS[shape.type]}` : undefined}
                  aria-hidden={!isActive}
                  aria-live={isActive ? 'polite' : undefined}
                />
              )
            })}
          </div>
        </div>

        <div className="sorting-game__rule-column sorting-game__rule-column--right">
          <div className="sorting-game__rule-title">Højre</div>
          <div className="sorting-game__rule-items">
            {rightShapes.map((shape) => (
              <div key={`right-${shape}`} className={`sorting-game__rule-item sorting-game__rule-item--${shape}`}>
                <span
                  className={`sorting-game__rule-shape sorting-game__rule-shape--${shape}`}
                  style={{ '--shape-color': SHAPE_COLORS[shape] } as CSSProperties}
                  aria-hidden="true"
                />
                <span className="sorting-game__rule-label">{SHAPE_LABELS[shape]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sorting-game__controls" aria-hidden={phase !== 'running'}>
        <button
          type="button"
          className="sorting-game__control-button sorting-game__control-button--left"
          onClick={() => handleChoice('left')}
          disabled={phase !== 'running'}
        >
          ← Venstre
        </button>
        <button
          type="button"
          className="sorting-game__control-button sorting-game__control-button--right"
          onClick={() => handleChoice('right')}
          disabled={phase !== 'running'}
        >
          Højre →
        </button>
      </div>

      <div className="sorting-game__actions">
        {phase === 'idle' && (
          <button type="button" className="sorting-game__primary-button" onClick={startGame}>
            Start spil
          </button>
        )}
        {phase === 'paused' && (
          <button type="button" className="sorting-game__primary-button" onClick={resumeGame}>
            Fortsæt
          </button>
        )}
      </div>

      {phase === 'paused' && (
        <div className="sorting-game__overlay" role="status" aria-live="assertive">
          <div className="sorting-game__overlay-content">
            <h2>Pause</h2>
            <p>Vinduet mistede fokus. Klik på "Fortsæt" eller fokusér vinduet for at fortsætte.</p>
          </div>
        </div>
      )}

      {phase === 'finished' && (
        <div className="sorting-game__overlay" role="status" aria-live="assertive">
          <div className="sorting-game__overlay-content sorting-game__overlay-content--finished">
            <h2>Spillet er slut!</h2>
            <p className="sorting-game__overlay-description">Se din score og vælg hvad du vil gøre nu.</p>
            <dl className="sorting-game__scoreboard">
              <div className="sorting-game__scoreboard-row">
                <dt>Din score</dt>
                <dd>{scoreRef.current}</dd>
              </div>
              <div className="sorting-game__scoreboard-row">
                <dt>Sorterede figurer</dt>
                <dd>{sortedCount}</dd>
              </div>
              <div className="sorting-game__scoreboard-row">
                <dt>Bedste score</dt>
                <dd>{bestScore}</dd>
              </div>
            </dl>
            <div className="sorting-game__overlay-actions">
              <button type="button" className="sorting-game__primary-button" onClick={startGame}>
                Prøv igen
              </button>
              {onExit && (
                <button type="button" className="sorting-game__secondary-button" onClick={onExit}>
                  Afslut spil
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
