import { useEffect, useRef, useState } from 'react'

type Phase = 'waiting' | 'ready' | 'now' | 'result'

const backgroundByPhase: Record<Phase, string> = {
  waiting: '#222',
  ready: '#d33',
  now: '#3d3',
  result: '#222',
}

const textByPhase = (phase: Phase, reactionTime: number | null) => {
  switch (phase) {
    case 'waiting':
      return 'Klik for at starte testen.'
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

  const scheduleReadyTimeout = () => {
    const delay = Math.floor(Math.random() * 3000) + 2000
    timeoutRef.current = window.setTimeout(() => {
      startTimeRef.current = performance.now()
      setPhase('now')
      timeoutRef.current = null
    }, delay)
  }

  const handleClick = () => {
    if (phase === 'waiting') {
      setReactionTime(null)
      setPhase('ready')
      startTimeRef.current = null
      scheduleReadyTimeout()
      return
    }

    if (phase === 'ready') {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setReactionTime(null)
      setPhase('waiting')
      startTimeRef.current = null
      return
    }

    if (phase === 'now') {
      const endTime = performance.now()
      if (startTimeRef.current !== null) {
        setReactionTime(endTime - startTimeRef.current)
      } else {
        setReactionTime(null)
      }
      startTimeRef.current = null
      setPhase('result')
      return
    }

    if (phase === 'result') {
      setReactionTime(null)
      setPhase('waiting')
      startTimeRef.current = null
    }
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleClick()
        }
      }}
      style={{
        alignItems: 'center',
        backgroundColor: backgroundByPhase[phase],
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '2rem',
        height: '100vh',
        justifyContent: 'center',
        lineHeight: 1.4,
        padding: '0 1rem',
        textAlign: 'center',
        width: '100%',
      }}
    >
      {textByPhase(phase, reactionTime)}
    </div>
  )
}
