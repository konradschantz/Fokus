import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ReactionTest.css'

type Phase = 'countdown' | 'ready' | 'now' | 'result'

const ROUND_DURATION_MS = 30000

const textByPhase = (phase: Phase, reactionTime: number | null, countdownValue: number) => {
  switch (phase) {
    case 'countdown':
      return `Spillet starter om ${countdownValue} sekunder. Hold fokus.`
    case 'ready':
      return 'Vent... feltet skifter farve snart. Klik først når det bliver grønt.'
    case 'now':
      return 'Klik nu!'
    case 'result':
      return reactionTime !== null
        ? `Din reaktionstid var ${Math.round(reactionTime)} ms. Klik for at prøve igen.`
        : 'Noget gik galt. Klik for at prøve igen.'
    default:
      return ''
  }
}

export default function ReactionTest() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('countdown')
  const [countdownValue, setCountdownValue] = useState(3)
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [roundOver, setRoundOver] = useState(false)
  const [sessionRemainingMs, setSessionRemainingMs] = useState(ROUND_DURATION_MS)
  const readyTimeoutRef = useRef<number | null>(null)
  const countdownIntervalRef = useRef<number | null>(null)
  const roundTimeoutRef = useRef<number | null>(null)
  const sessionIntervalRef = useRef<number | null>(null)
  const sessionStartRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const hasShownCountdownRef = useRef(false)
  const sessionTimerStartedRef = useRef(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playCountdownBeep = useCallback(() => {
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtor) return
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtor()
    }
    const ctx = audioCtxRef.current
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.value = 0.15
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    const now = ctx.currentTime
    oscillator.start(now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    oscillator.stop(now + 0.18)
  }, [])

  const clearTrialTimers = useCallback(() => {
    if (readyTimeoutRef.current !== null) {
      clearTimeout(readyTimeoutRef.current)
      readyTimeoutRef.current = null
    }
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  const clearAllTimers = useCallback(() => {
    clearTrialTimers()
    if (roundTimeoutRef.current !== null) {
      clearTimeout(roundTimeoutRef.current)
      roundTimeoutRef.current = null
    }
    if (sessionIntervalRef.current !== null) {
      clearInterval(sessionIntervalRef.current)
      sessionIntervalRef.current = null
    }
    sessionStartRef.current = null
    sessionTimerStartedRef.current = false

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
  }, [clearTrialTimers])

  const ensureSessionTimerStarted = useCallback(() => {
    if (sessionTimerStartedRef.current) {
      return
    }
    sessionTimerStartedRef.current = true
    sessionStartRef.current = performance.now()

    sessionIntervalRef.current = window.setInterval(() => {
      if (sessionStartRef.current === null) return
      const elapsed = performance.now() - sessionStartRef.current
      const remaining = Math.max(0, ROUND_DURATION_MS - elapsed)
      setSessionRemainingMs(remaining)
      if (remaining <= 0) {
        clearInterval(sessionIntervalRef.current as number)
        sessionIntervalRef.current = null
        setRoundOver(true)
        clearTrialTimers()
        setPhase('result')
      }
    }, 200)

    roundTimeoutRef.current = window.setTimeout(() => {
      setRoundOver(true)
      clearTrialTimers()
      setPhase('result')
    }, ROUND_DURATION_MS)
  }, [clearTrialTimers])

  const beginReadyPhase = useCallback(() => {
    setPhase('ready')
    const delay = Math.floor(Math.random() * 3000) + 2000
    readyTimeoutRef.current = window.setTimeout(() => {
      startTimeRef.current = performance.now()
      setPhase('now')
      readyTimeoutRef.current = null
    }, delay)
  }, [])

  const startTrial = useCallback(
    (withCountdown: boolean) => {
      clearTrialTimers()
      setReactionTime(null)
      startTimeRef.current = null

      if (withCountdown && !hasShownCountdownRef.current) {
        hasShownCountdownRef.current = true
        setCountdownValue(3)
        setPhase('countdown')

        let nextValue = 3
        const intervalId = window.setInterval(() => {
          nextValue -= 1
          if (nextValue <= 0) {
            clearInterval(intervalId)
            countdownIntervalRef.current = null
            ensureSessionTimerStarted()
            beginReadyPhase()
            return
          }
          setCountdownValue(nextValue)
        }, 1000)
        countdownIntervalRef.current = intervalId
      } else {
        ensureSessionTimerStarted()
        beginReadyPhase()
      }
    },
    [beginReadyPhase, clearTrialTimers, ensureSessionTimerStarted],
  )

  const startSession = useCallback(() => {
    clearAllTimers()
    setRoundOver(false)
    setReactionTimes([])
    hasShownCountdownRef.current = false
    setSessionRemainingMs(ROUND_DURATION_MS)
    sessionStartRef.current = null
    sessionTimerStartedRef.current = false

    startTrial(true)
  }, [clearAllTimers, clearTrialTimers, startTrial])

  useEffect(() => {
    startSession()
    return () => {
      clearAllTimers()
    }
  }, [clearAllTimers, startSession])

  useEffect(() => {
    if (phase === 'countdown' && countdownValue > 0) {
      playCountdownBeep()
    }
  }, [countdownValue, phase, playCountdownBeep])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const averageReactionTime = useMemo(() => {
    if (reactionTimes.length === 0) return null
    const total = reactionTimes.reduce((sum, t) => sum + t, 0)
    return Math.round(total / reactionTimes.length)
  }, [reactionTimes])

  const sessionSecondsLeft = useMemo(
    () => Math.max(0, Math.ceil(sessionRemainingMs / 1000)),
    [sessionRemainingMs],
  )

  const handleClick = () => {
    if (roundOver) {
      return
    }

    if (phase === 'countdown') {
      return
    }

    if (phase === 'ready') {
      ensureSessionTimerStarted()
      startTrial(false)
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
          setReactionTimes((times) => [...times, safeElapsed])
        }
      } else {
        setReactionTime(null)
      }
      startTimeRef.current = null
      setPhase('result')
      return
    }

    if (phase === 'result') {
      startTrial(false)
    }
  }

  const handleRetry = () => {
    startSession()
  }

  const handleBackToOverview = () => {
    navigate('/overview/games')
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
        {phase === 'countdown' ? (
          <div className="reaction-test__countdown">
            <span className="reaction-test__countdown-number">{countdownValue}</span>
            <p className="reaction-test__countdown-hint">
              Bliv klar. Du har 30 sekunder til at måle din reaktionstid.
            </p>
          </div>
        ) : (
          <span className="reaction-test__message">
            {textByPhase(phase, reactionTime, countdownValue)}
          </span>
        )}
        {phase === 'result' && !roundOver && (
          <div className="reaction-test__next-hint">Klik for næste forsøg</div>
        )}
        <div className="reaction-test__timer-chip"> {sessionSecondsLeft} sek</div>
      </div>

      {roundOver && (
        <div className="reaction-test__overlay" role="dialog" aria-modal="true">
          <div className="reaction-test__overlay-card">
            <p className="reaction-test__eyebrow">Runden er slut</p>
            <h2 className="reaction-test__overlay-average">
              {averageReactionTime !== null
                ? `${averageReactionTime} ms i gennemsnit`
                : 'Ingen gyldige målinger'}
            </h2>
            <p className="reaction-test__overlay-text">
              30 sekunder gennemført
            </p>
            <div className="reaction-test__overlay-actions">
              <button type="button" className="reaction-test__start-button" onClick={handleRetry}>
                Prøv igen
              </button>
              <button
                type="button"
                className="reaction-test__ghost-button"
                onClick={handleBackToOverview}
              >
                Spiloversigt
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
