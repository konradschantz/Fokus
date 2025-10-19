import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type MeditationStatus = 'idle' | 'running' | 'paused' | 'completed'

const TOTAL_DURATION_MS = 5 * 60 * 1000
const audioSource = '/audio/bell-meditation.mp3'

const formatClock = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function YogaCandleMeditation() {
  const [status, setStatus] = useState<MeditationStatus>('idle')
  const [remainingMs, setRemainingMs] = useState<number>(TOTAL_DURATION_MS)
  const [audioAvailable, setAudioAvailable] = useState<boolean | null>(null)

  const animationFrameRef = useRef<number | null>(null)
  const startTimestampRef = useRef<number | null>(null)
  const remainingAtStartRef = useRef<number>(TOTAL_DURATION_MS)
  const remainingRef = useRef<number>(TOTAL_DURATION_MS)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const ensureAudio = useCallback(() => {
    if (typeof window === 'undefined') {
      return null
    }
    if (audioRef.current) {
      return audioRef.current
    }

    try {
      const audio = new Audio(audioSource)
      audio.volume = 0.4
      audio.addEventListener(
        'canplaythrough',
        () => {
          setAudioAvailable(true)
        },
        { once: true },
      )
      audio.addEventListener(
        'error',
        () => {
          setAudioAvailable(false)
        },
        { once: true },
      )
      audioRef.current = audio
      return audio
    } catch (error) {
      setAudioAvailable(false)
      return null
    }
  }, [])

  const playBell = useCallback(async () => {
    const element = ensureAudio()
    if (!element) {
      return
    }
    try {
      element.currentTime = 0
      await element.play()
      setAudioAvailable((previous) => (previous ?? true))
    } catch (error) {
      setAudioAvailable(false)
    }
  }, [ensureAudio])

  const pauseAudio = useCallback(() => {
    const element = audioRef.current
    if (!element) {
      return
    }
    element.pause()
  }, [])

  const resetAudio = useCallback(() => {
    const element = audioRef.current
    if (!element) {
      return
    }
    element.pause()
    element.currentTime = 0
  }, [])

  const step = useCallback(
    (timestamp: number) => {
      if (startTimestampRef.current === null) {
        startTimestampRef.current = timestamp
      }

      const elapsed = timestamp - startTimestampRef.current
      const nextRemaining = Math.max(0, remainingAtStartRef.current - elapsed)
      setRemainingMs(nextRemaining)

      if (nextRemaining <= 0) {
        setStatus((previous) => (previous === 'completed' ? previous : 'completed'))
        stopAnimation()
        pauseAudio()
        setRemainingMs(0)
        void playBell()
        return
      }

      animationFrameRef.current = requestAnimationFrame(step)
    },
    [pauseAudio, playBell, stopAnimation],
  )

  const handleStart = useCallback(() => {
    if (status === 'running' || status === 'paused') {
      return
    }
    stopAnimation()
    remainingAtStartRef.current = TOTAL_DURATION_MS
    remainingRef.current = TOTAL_DURATION_MS
    setRemainingMs(TOTAL_DURATION_MS)
    startTimestampRef.current = null
    setStatus('running')
    resetAudio()
    animationFrameRef.current = requestAnimationFrame(step)
    void playBell()
  }, [playBell, resetAudio, status, step, stopAnimation])

  const handlePauseResume = useCallback(() => {
    if (status === 'idle' || status === 'completed') {
      return
    }
    if (status === 'running') {
      remainingAtStartRef.current = remainingRef.current
      startTimestampRef.current = null
      stopAnimation()
      pauseAudio()
      setStatus('paused')
      return
    }

    setStatus('running')
    remainingAtStartRef.current = remainingRef.current
    startTimestampRef.current = null
    animationFrameRef.current = requestAnimationFrame(step)
  }, [pauseAudio, status, step, stopAnimation])

  const handleReset = useCallback(() => {
    stopAnimation()
    startTimestampRef.current = null
    remainingAtStartRef.current = TOTAL_DURATION_MS
    remainingRef.current = TOTAL_DURATION_MS
    setRemainingMs(TOTAL_DURATION_MS)
    setStatus('idle')
    resetAudio()
  }, [resetAudio, stopAnimation])

  useEffect(() => {
    remainingRef.current = remainingMs
  }, [remainingMs])

  useEffect(() => {
    return () => {
      stopAnimation()
      resetAudio()
    }
  }, [resetAudio, stopAnimation])

  const progress = useMemo(() => {
    if (TOTAL_DURATION_MS === 0) {
      return 0
    }
    const ratio = 1 - remainingMs / TOTAL_DURATION_MS
    if (ratio < 0) {
      return 0
    }
    if (ratio > 1) {
      return 1
    }
    return ratio
  }, [remainingMs])

  const formattedTime = formatClock(remainingMs)
  const pauseResumeLabel = status === 'running' ? 'Pause' : 'Genoptag'
  const completionMessage =
    'Meditationen er afsluttet. Tag et dybt åndedrag og vend stille tilbage.'

  return (
    <article className="breathing-card breathing-card--yoga" aria-labelledby="yoga-meditation-heading">
      <header className="breathing-card__header">
        <div className="breathing-card__eyebrow">Yoga Meditation</div>
        <h2 id="yoga-meditation-heading" className="breathing-card__title">
          Lysmeditation – 5 minutter
        </h2>
        <p className="breathing-card__description">
          Fokuser blikket på det rolige lys og følg timeren. Når tiden er gået, guider beskeden dig blidt tilbage.
        </p>
      </header>

      <div className="yoga-card__visual" aria-hidden="true">
        <div className="yoga-flame">
          <div className="yoga-flame__inner" />
          <div className="yoga-flame__core" />
        </div>
        <div className="yoga-flame__glow" />
      </div>

      <div className="yoga-card__timer" role="timer" aria-live="polite">
        {formattedTime}
      </div>
      <div className="yoga-card__progress" aria-hidden="true">
        <div className="yoga-card__progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      {status === 'completed' && <p className="yoga-card__message">{completionMessage}</p>}

      <div className="breathing-card__controls">
        <button
          type="button"
          className="breathing-button breathing-button--primary"
          onClick={handleStart}
          disabled={status === 'running' || status === 'paused'}
        >
          Start
        </button>
        <button
          type="button"
          className="breathing-button"
          onClick={handlePauseResume}
          disabled={status === 'idle' || status === 'completed'}
        >
          {pauseResumeLabel}
        </button>
        <button type="button" className="breathing-button" onClick={handleReset}>
          Nulstil
        </button>
      </div>

      {audioAvailable === false && (
        <p className="breathing-card__notice">Klokkelyden kunne ikke indlæses. Meditationen virker uden lyd.</p>
      )}

      <div className="sr-only" aria-live="polite">
        {status === 'completed' ? completionMessage : `Tid tilbage: ${formattedTime}`}
      </div>
    </article>
  )
}
