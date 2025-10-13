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
const SHAPE_COLORS = ['#f97316', '#22d3ee', '#a855f7', '#facc15', '#ef4444', '#10b981'] as const

const GAME_DURATION_SECONDS = 60
const SPEED_INCREASE_THRESHOLD = 30
const NORMAL_RESPONSE_WINDOW_MS = 1800
const FAST_RESPONSE_WINDOW_MS = 1150
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
  return {
    id,
    type: randomItem(SHAPE_TYPES),
    color: randomItem(SHAPE_COLORS),
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
  const [bestScore, setBestScore] = useState(() => {
    if (typeof window === 'undefined') {
      return 0
    }

    const storedValue = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY)
    return storedValue ? Number.parseInt(storedValue, 10) || 0 : 0
  })
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION_SECONDS)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [speedLevel, setSpeedLevel] = useState<'normal' | 'fast'>('normal')

  const shapeIdRef = useRef(queue.length)
  const scoreRef = useRef(score)
  const phaseRef = useRef<Phase>(phase)
  const forcedPauseRef = useRef(false)
  const responseTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const activeShape = queue[0]
  const upcomingShapes = useMemo(() => queue.slice(1, 5), [queue])

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

        const nextQueue = [...rest, createShape(shapeIdRef.current++)]
        return nextQueue
      })
    },
    [rules],
  )

  const handleChoice = useCallback(
    (direction: Direction) => {
      if (phaseRef.current !== 'running') {
        return
      }

      if (responseTimeoutRef.current !== null) {
        window.clearTimeout(responseTimeoutRef.current)
        responseTimeoutRef.current = null
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
    if (phase === 'running' && timeRemaining <= SPEED_INCREASE_THRESHOLD) {
      setSpeedLevel('fast')
    }

    if (phase === 'idle' || phase === 'finished') {
      setSpeedLevel('normal')
    }
  }, [phase, timeRemaining])

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
    if (phase !== 'running') {
      if (responseTimeoutRef.current !== null) {
        window.clearTimeout(responseTimeoutRef.current)
        responseTimeoutRef.current = null
      }
      return
    }

    if (!activeShape) {
      return
    }

    if (responseTimeoutRef.current !== null) {
      window.clearTimeout(responseTimeoutRef.current)
    }

    const delay = speedLevel === 'fast' ? FAST_RESPONSE_WINDOW_MS : NORMAL_RESPONSE_WINDOW_MS

    responseTimeoutRef.current = window.setTimeout(() => {
      responseTimeoutRef.current = null
      advanceCurrentShape(null)
    }, delay)

    return () => {
      if (responseTimeoutRef.current !== null) {
        window.clearTimeout(responseTimeoutRef.current)
        responseTimeoutRef.current = null
      }
    }
  }, [phase, activeShape, speedLevel, advanceCurrentShape])


  const startGame = useCallback(() => {
    setScore(0)
    scoreRef.current = 0
    setTimeRemaining(GAME_DURATION_SECONDS)
    setRules(generateRules())
    resetQueue()
    setFeedback(null)
    forcedPauseRef.current = false
    setSpeedLevel('normal')
    if (responseTimeoutRef.current !== null) {
      window.clearTimeout(responseTimeoutRef.current)
      responseTimeoutRef.current = null
    }
    setPhase('running')
  }, [resetQueue])

  const resumeGame = useCallback(() => {
    if (phaseRef.current === 'paused') {
      forcedPauseRef.current = false
      setPhase('running')
    }
  }, [])

  const speedClass = useMemo(() => {
    return speedLevel === 'fast' ? 'sorting-game__queue--fast' : 'sorting-game__queue--normal'
  }, [speedLevel])

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
          <span className="sorting-game__metric-label">Tid</span>
          <span className="sorting-game__metric-value">{formatTime(timeRemaining)}</span>
        </div>
      </div>

      <div className="sorting-game__rules">
        <div className="sorting-game__rule-column sorting-game__rule-column--left">
          <div className="sorting-game__rule-title">Venstre</div>
          <div className="sorting-game__rule-items">
            {leftShapes.map((shape) => (
              <div key={`left-${shape}`} className={`sorting-game__rule-item sorting-game__rule-item--${shape}`}>
                <span className="sorting-game__rule-icon" aria-hidden="true">
                  {shape === 'square' && '▢'}
                  {shape === 'triangle' && '△'}
                  {shape === 'circle' && '◯'}
                </span>
                <span className="sorting-game__rule-label">{shape === 'square' ? 'Firkant' : shape === 'triangle' ? 'Trekant' : 'Cirkel'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sorting-game__rule-column sorting-game__rule-column--right">
          <div className="sorting-game__rule-title">Højre</div>
          <div className="sorting-game__rule-items">
            {rightShapes.map((shape) => (
              <div key={`right-${shape}`} className={`sorting-game__rule-item sorting-game__rule-item--${shape}`}>
                <span className="sorting-game__rule-icon" aria-hidden="true">
                  {shape === 'square' && '▢'}
                  {shape === 'triangle' && '△'}
                  {shape === 'circle' && '◯'}
                </span>
                <span className="sorting-game__rule-label">{shape === 'square' ? 'Firkant' : shape === 'triangle' ? 'Trekant' : 'Cirkel'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`sorting-game__queue ${speedClass}`}>
        {activeShape ? (
          <div
            key={activeShape.id}
            className={`sorting-game__shape sorting-game__shape--active sorting-game__shape--${activeShape.type} ${feedback ? `sorting-game__shape--${feedback}` : ''}`}
            style={{ '--shape-color': activeShape.color } as CSSProperties}
            aria-live="polite"
          />
        ) : (
          <div className="sorting-game__shape sorting-game__shape--placeholder" />
        )}

        <div className="sorting-game__upcoming" aria-label="Kommende figurer">
          {upcomingShapes.map((shape) => (
            <div
              key={shape.id}
              className={`sorting-game__shape sorting-game__shape--${shape.type}`}
              style={{ '--shape-color': shape.color } as CSSProperties}
            />
          ))}
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
        {phase === 'finished' && (
          <>
            <div className="sorting-game__summary">Din slutscore: {scoreRef.current}</div>
            <button type="button" className="sorting-game__primary-button" onClick={startGame}>
              Spil igen
            </button>
          </>
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

      {phase === 'idle' && (
        <div className="sorting-game__overlay sorting-game__overlay--transparent" role="status" aria-live="polite">
          <div className="sorting-game__overlay-content">
            <h2>Klar?</h2>
            <p>Tryk på "Start spil" og brug derefter piletasterne for at sortere figurerne.</p>
          </div>
        </div>
      )}

      {phase === 'finished' && (
        <div className="sorting-game__overlay" role="status" aria-live="assertive">
          <div className="sorting-game__overlay-content">
            <h2>Tiden er gået!</h2>
            <p>Din score: {scoreRef.current}</p>
            <p>Bedste score: {bestScore}</p>
          </div>
        </div>
      )}
    </section>
  )
}
