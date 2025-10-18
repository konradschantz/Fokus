import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type BreathingStatus = 'idle' | 'running' | 'paused'

type PhaseConfig = {
  label: string
  prompt: string
  startScale: number
  endScale: number
}

type PresetOption = {
  id: string
  label: string
  seconds: number
}

const presets: PresetOption[] = [
  { id: '3', label: '3-3-3-3', seconds: 3 },
  { id: '4', label: '4-4-4-4', seconds: 4 },
  { id: '5', label: '5-5-5-5', seconds: 5 },
]

const audioSource = '/audio/breath_ambience.mp3'

const easeInOutCubic = (t: number) => {
  if (t <= 0) {
    return 0
  }
  if (t >= 1) {
    return 1
  }
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const clamp01 = (value: number) => {
  if (value <= 0) {
    return 0
  }
  if (value >= 1) {
    return 1
  }
  return value
}

export default function BoxBreathing() {
  const phases: PhaseConfig[] = useMemo(
    () => [
      {
        label: 'Indånd',
        prompt: 'Indånd roligt gennem næsen.',
        startScale: 0.82,
        endScale: 1.18,
      },
      {
        label: 'Hold',
        prompt: 'Hold vejret blidt og mærk roen.',
        startScale: 1.18,
        endScale: 1.18,
      },
      {
        label: 'Udånd',
        prompt: 'Udånd langsomt gennem munden.',
        startScale: 1.18,
        endScale: 0.82,
      },
      {
        label: 'Hold',
        prompt: 'Hold pausen og vær til stede.',
        startScale: 0.82,
        endScale: 0.82,
      },
    ],
    [],
  )

  const [presetSeconds, setPresetSeconds] = useState<number>(4)
  const [status, setStatus] = useState<BreathingStatus>('idle')
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0)
  const [phaseProgress, setPhaseProgress] = useState<number>(0)
  const [phaseElapsedMs, setPhaseElapsedMs] = useState<number>(0)
  const [announcement, setAnnouncement] = useState<string>(phases[0]?.prompt ?? '')
  const [audioAvailable, setAudioAvailable] = useState<boolean | null>(null)

  const animationFrameRef = useRef<number | null>(null)
  const anchorTimestampRef = useRef<number | null>(null)
  const elapsedWithinCycleRef = useRef<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const durations = useMemo(() => phases.map(() => presetSeconds * 1000), [phases, presetSeconds])
  const totalCycleDuration = useMemo(
    () => durations.reduce((total, duration) => total + duration, 0),
    [durations],
  )

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
      audio.loop = true
      audio.volume = 0.45
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

  const playAudio = useCallback(async () => {
    const element = ensureAudio()
    if (!element) {
      return
    }
    try {
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

  const updateAnimation = useCallback(
    (timestamp: number) => {
      if (totalCycleDuration === 0) {
        return
      }

      if (anchorTimestampRef.current === null) {
        anchorTimestampRef.current = timestamp - elapsedWithinCycleRef.current
      }

      const elapsedWithinCycle = (timestamp - anchorTimestampRef.current) % totalCycleDuration
      elapsedWithinCycleRef.current = elapsedWithinCycle

      let accumulated = 0
      for (let index = 0; index < durations.length; index += 1) {
        const duration = durations[index]
        const nextBoundary = accumulated + duration
        if (elapsedWithinCycle < nextBoundary) {
          const phaseElapsed = elapsedWithinCycle - accumulated
          const phaseRatio = duration > 0 ? phaseElapsed / duration : 0

          setPhaseElapsedMs(phaseElapsed)
          setPhaseProgress(phaseRatio)
          setCurrentPhaseIndex((previous) => (previous === index ? previous : index))
          setAnnouncement((previous) => (previous === phases[index].prompt ? previous : phases[index].prompt))
          break
        }
        accumulated = nextBoundary
      }

      animationFrameRef.current = requestAnimationFrame(updateAnimation)
    },
    [durations, phases, totalCycleDuration],
  )

  const beginAnimation = useCallback(() => {
    stopAnimation()
    anchorTimestampRef.current = null
    animationFrameRef.current = requestAnimationFrame(updateAnimation)
  }, [stopAnimation, updateAnimation])

  const handleStart = useCallback(() => {
    if (status === 'running') {
      return
    }
    setCurrentPhaseIndex(0)
    setPhaseProgress(0)
    setPhaseElapsedMs(0)
    setAnnouncement(phases[0]?.prompt ?? '')
    elapsedWithinCycleRef.current = 0
    setStatus('running')
    beginAnimation()
    void playAudio()
  }, [beginAnimation, phases, playAudio, status])

  const handlePauseResume = useCallback(() => {
    if (status === 'idle') {
      return
    }
    if (status === 'running') {
      setStatus('paused')
      stopAnimation()
      anchorTimestampRef.current = null
      pauseAudio()
      return
    }
    setStatus('running')
    beginAnimation()
    void playAudio()
  }, [beginAnimation, pauseAudio, playAudio, status, stopAnimation])

  const handleReset = useCallback(() => {
    stopAnimation()
    anchorTimestampRef.current = null
    elapsedWithinCycleRef.current = 0
    setStatus('idle')
    setCurrentPhaseIndex(0)
    setPhaseProgress(0)
    setPhaseElapsedMs(0)
    setAnnouncement(phases[0]?.prompt ?? '')
    resetAudio()
  }, [phases, resetAudio, stopAnimation])

  useEffect(() => {
    return () => {
      stopAnimation()
      resetAudio()
    }
  }, [resetAudio, stopAnimation])

  const currentPhase = phases[currentPhaseIndex] ?? phases[0]
  const phaseDurationMs = durations[currentPhaseIndex] ?? durations[0] ?? 0
  const easedProgress = easeInOutCubic(clamp01(phaseProgress))
  const circleScale =
    currentPhase.startScale + (currentPhase.endScale - currentPhase.startScale) * easedProgress
  const secondsRemaining = phaseDurationMs
    ? Math.max(0, Math.ceil((phaseDurationMs - phaseElapsedMs) / 1000))
    : 0

  const controlLabel = status === 'running' ? 'Pause' : 'Genoptag'
  const phaseStatusText = `${currentPhase.label} – ${secondsRemaining} sek.`

  return (
    <article className="breathing-card breathing-card--box" aria-labelledby="box-breathing-heading">
      <header className="breathing-card__header">
        <div className="breathing-card__eyebrow">Box Breathing</div>
        <h2 id="box-breathing-heading" className="breathing-card__title">
          Stabiliser rytmen med 4-4-4-4
        </h2>
        <p className="breathing-card__description">
          Indånd i fire sekunder, hold fire, udånd fire og hvil fire. Brug cirklen, teksten og lyden til at holde
          tempoet.
        </p>
      </header>

      <div className="box-breathing__visual" role="img" aria-label={phaseStatusText}>
        <div
          className="box-breathing__circle"
          style={{ transform: `scale(${circleScale.toFixed(3)})` }}
          aria-hidden="true"
        />
        <div className="box-breathing__phase">{currentPhase.label}</div>
        <div className="box-breathing__countdown">{secondsRemaining} s</div>
      </div>

      <p className="box-breathing__prompt" role="status" aria-live="assertive">
        {announcement}
      </p>

      <div className="breathing-card__controls">
        <button
          type="button"
          className="breathing-button breathing-button--primary"
          onClick={handleStart}
          disabled={status === 'running'}
        >
          Start
        </button>
        <button
          type="button"
          className="breathing-button"
          onClick={handlePauseResume}
          disabled={status === 'idle'}
        >
          {controlLabel}
        </button>
        <button type="button" className="breathing-button" onClick={handleReset}>
          Nulstil
        </button>
      </div>

      <label className="breathing-card__select">
        Tempo
        <select
          value={presetSeconds}
          onChange={(event) => {
            const nextValue = Number(event.currentTarget.value)
            setPresetSeconds(nextValue)
            if (status !== 'idle') {
              handleReset()
            }
          }}
          disabled={status === 'running'}
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.seconds}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      {audioAvailable === false && (
        <p className="breathing-card__notice">Baggrundslyden kunne ikke indlæses. Øvelsen kan bruges uden lyd.</p>
      )}

      <div className="sr-only" aria-live="polite">
        {phaseStatusText}
      </div>
    </article>
  )
}
