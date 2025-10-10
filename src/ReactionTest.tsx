import { useEffect, useRef, useState } from 'react'
import BrandLogo from './components/BrandLogo'

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

interface ReactionTestProps {
  onExit?: () => void
}

export default function ReactionTest({ onExit }: ReactionTestProps) {
  const [phase, setPhase] = useState<Phase>('waiting')
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [highScores, setHighScores] = useState<number[]>([])
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
        const elapsed = endTime - startTimeRef.current
        setReactionTime(elapsed)
        setHighScores((previousScores) => {
          const updatedScores = [...previousScores, elapsed]
          updatedScores.sort((a, b) => a - b)
          return updatedScores.slice(0, 5)
        })
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
        position: 'relative',
        padding: '0 1rem',
        textAlign: 'center',
        width: '100%',
      }}
    >
      {textByPhase(phase, reactionTime)}
      <div
        style={{
          position: 'absolute',
          left: '1rem',
          top: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          alignItems: 'flex-start',
          maxWidth: 'min(280px, calc(100% - 2rem))',
          pointerEvents: 'none',
        }}
      >
        <BrandLogo size={56} wordmarkSize="1.6rem" />
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            lineHeight: 1.6,
            padding: '1rem 1.25rem',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>
            Top 5 hurtigste tider
          </h2>
          {highScores.length === 0 ? (
            <p style={{ fontSize: '0.95rem', margin: 0 }}>Ingen tider registreret endnu.</p>
          ) : (
            <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {highScores.map((score, index) => (
                <li key={`${score}-${index}`} style={{ marginBottom: '0.25rem' }}>
                  {Math.round(score)} ms
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
      {onExit && (
        <button
          onClick={(event) => {
            event.stopPropagation()
            onExit()
          }}
          className="menu__back-button reaction-test__back-button"
          style={{ right: '1rem', top: '1rem', position: 'absolute' }}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            event.stopPropagation()
          }}
        >
          Tilbage til menu
        </button>
      )}
    </div>
  )
}
