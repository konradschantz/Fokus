import { useCallback, useEffect, useRef, useState } from 'react'
import './ReactionTest.css'

type Phase = 'waiting' | 'countdown' | 'ready' | 'now' | 'result'

const textByPhase = (phase: Phase, reactionTime: number | null) => {
  switch (phase) {
    case 'waiting':
      return 'Hold øje – testen starter automatisk.'
    case 'ready':
      return 'Vent... skærmen skifter farve snart.'
    case 'now':
      return 'Klik nu!'
    case 'result':
      return reactionTime !== null
        ? `Din reaktionstid var ${Math.round(reactionTime)} ms. Klik for at prøve igen.`
        : 'Noget gik galt. Klik for at prøve igen.'
  }
}

export default function ReactionTest() {
  const [phase, setPhase] = useState<Phase>('waiting')
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  const scheduleReadyTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const delay = Math.floor(Math.random() * 3000) + 2000
    timeoutRef.current = window.setTimeout(() => {
      startTimeRef.current = performance.now()
      setPhase('now')
      timeoutRef.current = null
    }, delay)
  }, [])

  useEffect(() => {
    if (phase !== 'waiting') {
      return
    }

    setReactionTime(null)
    setPhase('ready')
    startTimeRef.current = null
    scheduleReadyTimeout()
  }, [phase, scheduleReadyTimeout])

  const handleClick = () => {
    if (phase === 'countdown') {
      return
    }

    if (phase === 'ready') {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setReactionTime(null)
      setPhase('countdown')
      startTimeRef.current = null
      return
    }

    if (phase === 'now') {
      const endTime = performance.now()
      if (startTimeRef.current !== null) {
        const elapsed = endTime - startTimeRef.current
        if (!Number.isFinite(elapsed) || elapsed < 0) {
          setReactionTime(null)
        } else {
          const safeElapsed = Math.max(0, elapsed)
          setReactionTime(safeElapsed)
        }
      } else {
        setReactionTime(null)
      }
      startTimeRef.current = null
      setPhase('result')
      return
    }

    if (phase === 'result') {
      setReactionTime(null)
      setPhase('countdown')
      startTimeRef.current = null
    }
  }

  return (
    <section className="reaction-test reaction-test--immersive">
      <div
        className={`reaction-test__play-area reaction-test__play-area--${phase}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleClick()
          }
        }}
      >
        <span className="reaction-test__message">{textByPhase(phase, reactionTime)}</span>
      </div>
    </section>
  )
}
