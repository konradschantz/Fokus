import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import GameShell from '../../components/GameShell'
import { loadSortingBestScore, saveSortingBestScore } from '../../utils/sortingBestScore'
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

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * (items.length))]
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
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('idle')
  const [queue, setQueue] = useState<Shape[]>([])
  const [rules, setRules] = useState<SortingRules>(() => generateRules())
  const [score, setScore] = useState(0)
  const [sortedCount, setSortedCount] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION_SECONDS)
  const [bestScore, setBestScore] = useState(0)
  const [achievedNewBest, setAchievedNewBest] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [activeDragOffset, setActiveDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [shellReady, setShellReady] = useState(false)

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

  useEffect(() => {
    let isMounted = true

    void loadSortingBestScore().then((value) => {
      if (isMounted) {
        setBestScore(value)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

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

  const resetSwipeState = useCallback(() => {
    swipeStateRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
    }
    setActiveDragOffset(null)
  }, [])

  useEffect(() => {
    if (phase !== 'running') {
      resetSwipeState()
    }
  }, [phase, resetSwipeState])

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

    if (!audioContextRef.current) {
      audioContextRef.current = new audioContextCtor()
    }

    const context = audioContextRef.current

    if (context.state === 'suspended') {
      void context.resume().catch(() => {})
    }

    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.type = 'sine'

    if (type === 'correct') {
      oscillator.frequency.value = 720
    } else {
      oscillator.frequency.value = 180
    }

    gainNode.gain.value = 0.15

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.start()
    oscillator.stop(context.currentTime + 0.15)
  }, [])

  const clearHintTimeout = useCallback(() => {
    if (hintTimeoutRef.current !== null) {
      window.clearTimeout(hintTimeoutRef.current)
      hintTimeoutRef.current = null
    }
  }, [])

  const handleChoice = useCallback(
    (direction: Direction) => {
      if (phaseRef.current !== 'running') {
        return
      }

      const [currentShape, ...restQueue] = queue

      if (!currentShape) {
        return
      }

      const correctDirection = rules[currentShape.type]
      const isCorrect = correctDirection === direction

      setQueue(restQueue)
      setSortedCount((previous) => previous + 1)

      if (isCorrect) {
        setScore((previous) => previous + 10)
        setFeedback('correct')
        playFeedbackSound('correct')
      } else {
        setScore((previous) => Math.max(0, previous - 5))
        setFeedback('incorrect')
        playFeedbackSound('incorrect')
      }
    },
    [playFeedbackSound, queue, rules],
  )

  const handlePointerStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'running') {
      return
    }

    swipeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }

    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }, [])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const state = swipeStateRef.current

    if (phaseRef.current !== 'running' || state.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - state.startX
    const deltaY = event.clientY - state.startY

    if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) {
      return
    }

    setActiveDragOffset({ x: deltaX, y: deltaY })
  }, [])

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

  const scheduleHintShuffle = useCallback(() => {
    clearHintTimeout()
    hintTimeoutRef.current = window.setTimeout(() => {
      setRules(generateRules())
    }, 8000)
  }, [clearHintTimeout])

  useEffect(() => {
    if (phase !== 'running') {
      clearHintTimeout()
      return
    }

    scheduleHintShuffle()

    return () => {
      clearHintTimeout()
    }
  }, [phase, scheduleHintShuffle, clearHintTimeout])

  useEffect(() => {
    if (phase !== 'running') {
      return
    }

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
    if (phase !== 'finished') {
      return
    }

    const isNewBest = score > bestScore

    setAchievedNewBest(isNewBest)

    if (isNewBest) {
      setBestScore(score)
      void saveSortingBestScore(score)
    }
  }, [bestScore, phase, score])

  useEffect(() => {
    if (phase !== 'running') {
      return
    }

    if (queue.length === 0) {
      setQueue([createShape(shapeIdRef.current++)])
      return
    }

    if (queue.length < INITIAL_QUEUE_LENGTH) {
      setQueue((currentQueue) => [...currentQueue, createShape(shapeIdRef.current++)])
    }
  }, [queue.length, phase])


  const leftShapes = useMemo(() => SHAPE_TYPES.filter((shape) => rules[shape] === 'left'), [rules])
  const rightShapes = useMemo(
    () => SHAPE_TYPES.filter((shape) => rules[shape] === 'right'),
    [rules],
  )

  const activeShape = queue[0]

  const summaryLines = [
    `Score: ${score}`,
    `Sorterede figurer: ${sortedCount}`,
    `Bedste score: ${Math.max(bestScore, score)}`,
    `Tid tilbage: ${timeRemaining}s`,
  ]

  return (
    <GameShell
      title="Sorting"
      subtitle="Skub figurer til venstre eller højre"
      isFinished={phase === 'finished'}
      summaryLines={summaryLines}
      onRestart={() => {
        setPhase('idle')
        setShellReady(false)
        setTimeRemaining(GAME_DURATION_SECONDS)
        setQueue([])
        setRules(generateRules())
        setScore(0)
        setSortedCount(0)
        setAchievedNewBest(false)
      }}
      onExit={() => navigate('/overview/games')}
      onReady={() => {
        setShellReady(true)
        setPhase('running')
        setScore(0)
        setSortedCount(0)
        setTimeRemaining(GAME_DURATION_SECONDS)
        setRules(generateRules())
        resetQueue()
      }}
    >
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

            <div
              className="sorting-game__queue"
              onPointerDown={handlePointerStart}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              aria-label="Træk figuren til venstre eller højre"
            >
              {queue.length > 0 ? (
                queue.map((shape, index) => {
                  const isActive = index === 0
                  const translateY = index * 1.2
                  const scale = isActive ? 1 : 0.92
                  const opacity = isActive ? 1 : 0.7
                  const baseClass = 'sorting-game__shape'
                  const dragClass = isActive && activeDragOffset ? ' sorting-game__shape--dragging' : ''
                  const feedbackClass =
                    feedback && isActive && activeShape?.id === shape.id
                      ? ` sorting-game__shape--${feedback}`
                      : ''
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
                  Klar... venter på næste figur.
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
      </section>
    </GameShell>
  )
}
