import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GameShell.css'

type GameShellProps = {
  title: string
  subtitle?: string
  isFinished: boolean
  summaryLines?: string[]
  onRestart: () => void
  onExit?: () => void
  onReady?: () => void
  children: ReactNode
}

const COUNTDOWN_START = 3

export default function GameShell({
  title,
  subtitle,
  isFinished,
  summaryLines,
  onRestart,
  onExit,
  onReady,
  children,
}: GameShellProps) {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    if (ready) return
    let next = COUNTDOWN_START
    const id = window.setInterval(() => {
      next -= 1
      if (next <= 0) {
        setReady(true)
        if (onReady) {
          onReady()
        }
        window.clearInterval(id)
      }
      setCountdown(next)
    }, 1000)
    return () => window.clearInterval(id)
  }, [ready])

  const overlaySummary = useMemo(() => {
    if (!summaryLines || summaryLines.length === 0) return null
    return summaryLines.map((line, index) => (
      <p key={line + index} className="game-shell__summary-line">
        {line}
      </p>
    ))
  }, [summaryLines])

  return (
    <div className="game-shell">
      {!ready && (
        <div className="game-shell__overlay" role="dialog" aria-modal="true">
          <div className="game-shell__overlay-card">
            <p className="game-shell__eyebrow">{title}</p>
            {subtitle ? <p className="game-shell__subtitle">{subtitle}</p> : null}
            <div className="game-shell__countdown-number">{countdown}</div>
            <p className="game-shell__hint">Hold fokus. Spillet starter nu.</p>
          </div>
        </div>
      )}

      {isFinished && (
        <div className="game-shell__overlay" role="dialog" aria-modal="true">
          <div className="game-shell__overlay-card">
            <p className="game-shell__eyebrow">{title}</p>
            <h2 className="game-shell__title">Runden er slut</h2>
            {overlaySummary}
            <div className="game-shell__actions">
              <button type="button" className="game-shell__primary" onClick={onRestart}>
                Prøv igen
              </button>
              <button
                type="button"
                className="game-shell__ghost"
                onClick={() => (onExit ? onExit() : navigate('/overview/games'))}
              >
                Til spiloversigt
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-shell__content" aria-live="polite" style={{ pointerEvents: ready ? 'auto' : 'none' }}>
        <header className="game-shell__header">
          <div>
            <p className="game-shell__eyebrow">{title}</p>
            {subtitle ? <p className="game-shell__subtitle">{subtitle}</p> : null}
          </div>
        </header>
        <div className="game-shell__body">{children}</div>
      </div>
    </div>
  )
}
