import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import './SortingGame.css'

type ShapeType = 'square' | 'triangle' | 'circle'
type Direction = 'left' | 'right'

type Phase = 'countdown' | 'running' | 'paused' | 'finished'

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

function createShape(id: number): Shape {
  const type = randomItem(SHAPE_TYPES)

  return {
    id,
    type,
    color: SHAPE_COLORS[type],
  }
}

export default function SortingGame() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [queue, setQueue] = useState<Shape[]>([])
  const [rules, setRules] = useState<SortingRules>(() => generateRules())
  const [, setScore] = useState(0)
  const [, setSortedCount] = useState(0)
  const [, setTimeRemaining] = useState(GAME_DURATION_SECONDS)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(3)

  const shapeIdRef = useRef(queue.length)
  const phaseRef = useRef<Phase>(phase)
  const forcedPauseRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const hintTimeoutRef = useRef<number | null>(null)
  const swipeStateRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
  })
  const [activeDragOffset, setActiveDragOffset] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const clearHintTimeout = useCallback(() => {
    if (hintTimeoutRef.current !== null) {
      window.clearTimeout(hintTimeoutRef.current)
      hintTimeoutRef.current = null
    }
  }, [])

  const scheduleHintShuffle = useCallback(() => {
    if (phaseRef.current !== 'running') {
      return
    }

    clearHintTimeout()

    const delay = (10 + Math.random() * 30) * 1000

    hintTimeoutRef.current = window.setTimeout(() => {
      setRules((currentRules) => {
        const shapeToFlip = randomItem(SHAPE_TYPES)
        const toggledDirection =
          currentRules[shapeToFlip] === 'left' ? 'right' : 'left'

        let nextRules: SortingRules = {
          ...currentRules,
          [shapeToFlip]: toggledDirection,
        }

        const directions = new Set<Direction>(Object.values(nextRules))

        if (directions.size === 1) {
          const alternativeShapes = SHAPE_TYPES.filter((shape) => shape !== shapeToFlip)
          const backupShape = randomItem(alternativeShapes)

          nextRules = {
            ...nextRules,
            [backupShape]: nextRules[backupShape] === 'left' ? 'right' : 'left',
          }
        }

        return nextRules
      })

      scheduleHintShuffle()
    }, delay)
  }, [clearHintTimeout])

  useEffect(() => {
    if (phase === 'running') {
      scheduleHintShuffle()
    } else {
      clearHintTimeout()
    }

    return () => {
      clearHintTimeout()
    }
  }, [phase, scheduleHintShuffle, clearHintTimeout])

  const resetQueue = useCallback(() => {
    shapeIdRef.current = 0
    setQueue(Array.from({ length: INITIAL_QUEUE_LENGTH }, () => createShape(shapeIdRef.current++)))
  }, [])

  const finishGame = useCallback(() => {
    if (phaseRef.current === 'finished') {
      return
    }

    phaseRef.current = 'finished'
    setPhase('finished')
  }, [])

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

  const resetSwipeState = useCallback(() => {
    swipeStateRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
    }
    setActiveDragOffset(null)
  }, [])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (phaseRef.current !== 'running') {
        return
      }

      swipeStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      }

      setActiveDragOffset({ x: 0, y: 0 })

      if (event.currentTarget.setPointerCapture) {
        event.currentTarget.setPointerCapture(event.pointerId)
      }
    },
    [],
  )

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const state = swipeStateRef.current

      if (
        phaseRef.current !== 'running' ||
        state.pointerId !== event.pointerId
      ) {
        return
      }

      const deltaX = event.clientX - state.startX
      const deltaY = event.clientY - state.startY

      setActiveDragOffset({ x: deltaX, y: deltaY })
    },
    [],
  )

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const state = swipeStateRef.current

      if (state.pointerId !== event.pointerId) {
        return
      }

      if (event.currentTarget.releasePointerCapture) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      const deltaX = event.clientX - state.startX
      const deltaY = event.clientY - state.startY
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      if (phaseRef.current === 'running' && absDeltaX >= 30 && absDeltaX > absDeltaY) {
        const swipeDirection: Direction = deltaX > 0 ? 'right' : 'left'
        handleChoice(swipeDirection)
      }

      resetSwipeState()
    },
    [handleChoice, resetSwipeState],
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

  useEffect(() => {
    if (phase !== 'running') {
      resetSwipeState()
    }
  }, [phase, resetSwipeState])

  const startGame = useCallback(() => {
    setScore(0)
    setTimeRemaining(GAME_DURATION_SECONDS)
    setRules(generateRules())
    resetQueue()
    setFeedback(null)
    setSortedCount(0)
    forcedPauseRef.current = false
    setPhase('running')
  }, [resetQueue])

  useEffect(() => {
    if (phase === 'idle') {
      startGame()
    }
  }, [phase, startGame])

  useEffect(() => {
    if (phase !== 'finished') {
      return
    }

    const restartTimeout = window.setTimeout(() => {
      startGame()
    }, 900)

    return () => {
      window.clearTimeout(restartTimeout)
    }
  }, [phase, startGame])

  const leftShapes = useMemo(() => SHAPE_TYPES.filter((shape) => rules[shape] === 'left'), [rules])
  const rightShapes = useMemo(
    () => SHAPE_TYPES.filter((shape) => rules[shape] === 'right'),
    [rules],
  )

  return (
    <section className="sorting-game sorting-game--immersive">
      <div className="sorting-game__content">
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
            <div
              className="sorting-game__queue-track"
              aria-label="Figurkø"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              onPointerLeave={handlePointerEnd}
            >
              {phase === 'running' || phase === 'paused' ? (
                queue.map((shape, index) => {
                  const isActive = index === 0
                  const offset = Math.min(index, 4)
                  const translateY = offset * -0.65
                  const scale = isActive ? 1 : Math.max(0.7, 1 - offset * 0.08)
                  const opacity = isActive ? 1 : Math.max(0.35, 0.85 - offset * 0.1)
                  const feedbackClass = isActive && feedback ? ` sorting-game__shape--${feedback}` : ''
                  const dragClass =
                    isActive && activeDragOffset ? ' sorting-game__shape--dragging' : ''
                  const baseClass = `sorting-game__shape sorting-game__shape--${shape.type}`
                  const stateClass = isActive
                    ? ' sorting-game__shape--active'
                    : ' sorting-game__shape--queued'
                  const shapeClassName = `${baseClass}${stateClass}${dragClass}${feedbackClass}`

                  const transformParts = [`translate(-50%, ${translateY}rem)`]

                  if (isActive && activeDragOffset) {
                    transformParts.push(`translate(${activeDragOffset.x}px, ${activeDragOffset.y}px)`)
                  }

                  transformParts.push(`scale(${scale})`)

                  return (
                    <div
                      key={shape.id}
                      className={shapeClassName}
                      style={
                        {
                          '--shape-color': shape.color,
                          transform: transformParts.join(' '),
                          opacity,
                          zIndex: queue.length - index,
                        } as CSSProperties
                      }
                      aria-label={isActive ? `Aktiv figur: ${SHAPE_LABELS[shape.type]}` : undefined}
                      aria-hidden={!isActive}
                      aria-live={isActive ? 'polite' : undefined}
                    />
                  )
                })
              ) : (
                <div className="sorting-game__queue-placeholder" aria-live="polite">
                  Gør dig klar... spillet starter automatisk.
                </div>
              )}
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

        {phase === 'paused' && (
          <div className="sorting-game__overlay" role="status" aria-live="assertive">
            <div className="sorting-game__overlay-content">
              <h2>Pause</h2>
              <p>Fokusér vinduet igen for at fortsætte spillet.</p>
            </div>
          </div>
        )}

        {phase === 'finished' && (
          <div className="sorting-game__overlay" role="status" aria-live="assertive">
            <div className="sorting-game__overlay-content sorting-game__overlay-content--finished">
              <h2>Ny runde på vej</h2>
              <p className="sorting-game__overlay-description">Hold øje med næste figur.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

