import { useEffect, useRef, useState } from 'react'
import BrandLogo from './components/BrandLogo'
import './ReactionTest.css'

type Phase = 'waiting' | 'ready' | 'now' | 'result'

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
    <section className="menu game-page reaction-test">
      <div className="menu__top-bar">
        <BrandLogo size={64} wordmarkSize="1.75rem" />
        {onExit && (
          <button type="button" className="menu__back-button" onClick={onExit}>
            Tilbage til menu
          </button>
        )}
      </div>

      <header className="menu__header">
        <h1>Reaktionstest</h1>
        <p>Hold fokus og klik så hurtigt som muligt, når feltet skifter farve.</p>
      </header>

      <div className="game-page__grid reaction-test__layout">
        <div className="reaction-test__content">
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
          <p className="reaction-test__hint">Tip: Brug mellemrumstasten for at starte og reagere hurtigt.</p>
        </div>

        <aside className="game-scoreboard">
          <h2 className="game-scoreboard__title">Scoreboard</h2>
          {highScores.length === 0 ? (
            <p className="game-scoreboard__empty">Ingen tider registreret endnu.</p>
          ) : (
            <ol className="reaction-test__scores">
              {highScores.map((score, index) => (
                <li key={`${score}-${index}`}>
                  <span className="reaction-test__score-rank">#{index + 1}</span>
                  <span className="reaction-test__score-value">{Math.round(score)} ms</span>
                </li>
              ))}
            </ol>
          )}
          <p className="game-scoreboard__footnote">
            De fem hurtigste reaktionstider gemmes lokalt i denne browser.
          </p>
        </aside>
      </div>
    </section>
  )
}
