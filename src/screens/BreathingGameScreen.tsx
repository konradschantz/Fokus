import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

const sessionOptions = [
  { minutes: 3, label: '3 minutter' },
  { minutes: 5, label: '5 minutter' },
  { minutes: 10, label: '10 minutter' },
]

type Phase = 'select' | 'session' | 'complete'

type BreathPhase = 'inhale' | 'exhale' | 'hold'

type BreathingMode = 'box' | '478'

type BreathingSegment = {
  phase: BreathPhase
  duration: number
  prompt: string
}

type AudioRefs = {
  context: AudioContext | null
  oscillator: OscillatorNode | null
  gain: GainNode | null
}

const initialAudioRefs: AudioRefs = {
  context: null,
  oscillator: null,
  gain: null,
}

const breathingModes: Record<BreathingMode, { label: string; description: string; segments: BreathingSegment[] }> = {
  box: {
    label: 'Box breathing 4-4-4-4',
    description: 'Fire sekunder ind, fire sekunder hold, fire sekunder ud og fire sekunder ro før næste indånding.',
    segments: [
      { phase: 'inhale', duration: 4, prompt: 'Indånd roligt gennem næsen' },
      { phase: 'hold', duration: 4, prompt: 'Hold vejret og mærk roen' },
      { phase: 'exhale', duration: 4, prompt: 'Udånd langsomt gennem munden' },
      { phase: 'hold', duration: 4, prompt: 'Hold en kort pause før næste cyklus' },
    ],
  },
  '478': {
    label: '4-7-8 vejrtrækning',
    description: 'Fire sekunder ind, hold i syv og udånd langsomt i otte sekunder.',
    segments: [
      { phase: 'inhale', duration: 4, prompt: 'Indånd roligt og fyld lungerne' },
      { phase: 'hold', duration: 7, prompt: 'Hold vejret i roligt fokus' },
      { phase: 'exhale', duration: 8, prompt: 'Udånd langsomt og slip spændingerne' },
    ],
  },
}

const audioStorageKey = 'breath-settings'

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function BreathingGameScreen() {
  const navigate = useNavigate()
  const initialSettings = useMemo(() => {
    if (typeof window === 'undefined') {
      return { mode: 'box' as BreathingMode, volume: 0.6 }
    }
    try {
      const stored = window.localStorage.getItem(audioStorageKey)
      if (!stored) {
        return { mode: 'box' as BreathingMode, volume: 0.6 }
      }
      const parsed = JSON.parse(stored) as Partial<{ mode: BreathingMode; volume: number }>
      const mode: BreathingMode = parsed?.mode === '478' || parsed?.mode === 'box' ? parsed.mode : 'box'
      const volume = typeof parsed?.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 1 ? parsed.volume : 0.6
      return { mode, volume }
    } catch (error) {
      console.warn('Kunne ikke læse gemte lydindstillinger', error)
      return { mode: 'box' as BreathingMode, volume: 0.6 }
    }
  }, [])

  const [phase, setPhase] = useState<Phase>('select')
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isInhaling, setIsInhaling] = useState(false)
  const [breathMode, setBreathMode] = useState<BreathingMode>(initialSettings.mode)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale')
  const [segmentRemaining, setSegmentRemaining] = useState(0)
  const [audioSupported, setAudioSupported] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(initialSettings.volume)

  const audioRefs = useRef<AudioRefs>({ ...initialAudioRefs })
  const timerRef = useRef<number | null>(null)
  const segmentTimeoutRef = useRef<number | null>(null)
  const segmentIntervalRef = useRef<number | null>(null)
  const hasUnlockedAudioRef = useRef(false)

  const segments = useMemo(() => breathingModes[breathMode].segments, [breathMode])
  const totalSeconds = selectedMinutes ? selectedMinutes * 60 : 0
  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0

  const circleStyle = useMemo(() => {
    const style: React.CSSProperties & Record<string, string | number> = {
      transform: `scale(${isInhaling ? 1.25 : 0.75})`,
      transition: 'transform 0.9s cubic-bezier(0.33, 1, 0.68, 1), filter 0.9s ease, box-shadow 0.9s ease',
      filter: `saturate(${isInhaling ? 1.15 : 0.95})`,
    }
    style['--from-color'] = isInhaling ? '#6366f1' : '#22d3ee'
    style['--to-color'] = isInhaling ? '#a855f7' : '#3b82f6'
    style['--glow-color'] = isInhaling ? 'rgba(168, 85, 247, 0.45)' : 'rgba(56, 189, 248, 0.35)'
    return style
  }, [isInhaling])

  const clearSegmentTimers = useCallback(() => {
    if (segmentTimeoutRef.current !== null) {
      window.clearTimeout(segmentTimeoutRef.current)
      segmentTimeoutRef.current = null
    }
    if (segmentIntervalRef.current !== null) {
      window.clearInterval(segmentIntervalRef.current)
      segmentIntervalRef.current = null
    }
  }, [])

  const stopAmbientTone = useCallback(() => {
    const { context, oscillator, gain } = audioRefs.current
    if (!context || !oscillator || !gain) {
      return
    }

    const now = context.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.8)
    oscillator.stop(now + 0.9)

    audioRefs.current = { ...initialAudioRefs }
  }, [])

  const fadeGain = useCallback(
    (baseTarget: number) => {
      const { context, gain } = audioRefs.current
      if (!context || !gain) {
        return
      }

      const now = context.currentTime
      const target = baseTarget * (isMuted ? 0 : volume)
      gain.gain.cancelScheduledValues(now)
      gain.gain.linearRampToValueAtTime(target, now + 0.75)
    },
    [isMuted, volume]
  )

  const ensureAmbientTone = useCallback(async () => {
    if (typeof window === 'undefined') {
      return
    }

    const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextConstructor) {
      setAudioSupported(false)
      return
    }

    if (audioRefs.current.context) {
      if (audioRefs.current.context.state === 'suspended') {
        try {
          await audioRefs.current.context.resume()
        } catch (error) {
          console.error('Kunne ikke genoptage AudioContext', error)
        }
      }
      return
    }

    try {
      const context = new AudioContextConstructor()
      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = 432
      gain.gain.value = 0.0001

      oscillator.connect(gain).connect(context.destination)
      oscillator.start()

      audioRefs.current = { context, oscillator, gain }
    } catch (error) {
      console.error('Kunne ikke starte ambient lyd', error)
      setAudioSupported(false)
    }
  }, [])

  const applyAmbientLevel = useCallback(
    (baseTarget: number) => {
      if (!audioRefs.current.context) {
        void ensureAmbientTone().then(() => {
          fadeGain(baseTarget)
        })
        return
      }
      fadeGain(baseTarget)
    },
    [ensureAmbientTone, fadeGain]
  )

  const createBellChime = useCallback(
    (context: AudioContext) => {
      const now = context.currentTime
      const masterGain = context.createGain()
      masterGain.gain.setValueAtTime(0.0001, now)
      masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.8), now + 0.01)
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6)
      masterGain.connect(context.destination)

      const overtoneRatios = [1, 1.5, 2.15]
      const baseFrequency = 660

      overtoneRatios.forEach((ratio, index) => {
        const oscillator = context.createOscillator()
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(baseFrequency * ratio, now)
        oscillator.detune.setValueAtTime(index === 0 ? 0 : ratio * 20, now)

        const gain = context.createGain()
        gain.gain.setValueAtTime(1 / (index + 1.25), now)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6)

        oscillator.connect(gain).connect(masterGain)
        oscillator.start(now)
        oscillator.stop(now + 1.6)
      })

      window.setTimeout(() => {
        masterGain.disconnect()
      }, 1700)
    },
    [volume]
  )

  const playBell = useCallback(() => {
    if (isMuted || volume === 0) {
      return
    }

    const { context } = audioRefs.current
    if (!context) {
      void ensureAmbientTone().then(() => {
        const refreshedContext = audioRefs.current.context
        if (refreshedContext && !isMuted && volume > 0) {
          createBellChime(refreshedContext)
        }
      })
      return
    }

    createBellChime(context)
  }, [createBellChime, ensureAmbientTone, isMuted, volume])

  const unlockAudio = useCallback(async () => {
    if (!hasUnlockedAudioRef.current) {
      hasUnlockedAudioRef.current = true
      await ensureAmbientTone()
      const context = audioRefs.current.context
      if (context && context.state === 'suspended') {
        try {
          await context.resume()
        } catch (error) {
          console.error('Kunne ikke genoptage AudioContext', error)
        }
      }
      const silentUnlockContext = audioRefs.current.context
      if (silentUnlockContext) {
        try {
          const buffer = silentUnlockContext.createBuffer(1, 1, silentUnlockContext.sampleRate)
          const source = silentUnlockContext.createBufferSource()
          source.buffer = buffer
          source.connect(silentUnlockContext.destination)
          source.start()
        } catch (error) {
          console.error('Kunne ikke aktivere lyd', error)
        }
      }
      return
    }
    await ensureAmbientTone()
  }, [ensureAmbientTone, isMuted, volume])

  const startSegment = useCallback(
    (index: number) => {
      if (segments.length === 0) {
        return
      }

      clearSegmentTimers()
      const nextIndex = index % segments.length
      const segment = segments[nextIndex]
      setCurrentSegmentIndex(nextIndex)
      setBreathPhase(segment.phase)
      setSegmentRemaining(segment.duration)
      setIsInhaling((previous) => {
        if (segment.phase === 'inhale') {
          return true
        }
        if (segment.phase === 'exhale') {
          return false
        }
        return previous
      })
      playBell()

      segmentIntervalRef.current = window.setInterval(() => {
        setSegmentRemaining((previous) => (previous > 0 ? previous - 1 : 0))
      }, 1000)

      segmentTimeoutRef.current = window.setTimeout(() => {
        startSegment(nextIndex + 1)
      }, segment.duration * 1000)
    },
    [segments, playBell, clearSegmentTimers]
  )

  const handleSessionComplete = useCallback(() => {
    clearSegmentTimers()
    setRemainingSeconds(0)
    setPhase('complete')
    setIsInhaling(false)
    setBreathPhase('inhale')
    setSegmentRemaining(0)
    setCurrentSegmentIndex(0)
    stopAmbientTone()
  }, [clearSegmentTimers, stopAmbientTone])

  const handleReset = useCallback(() => {
    clearSegmentTimers()
    setPhase('select')
    setRemainingSeconds(0)
    setIsInhaling(false)
    setBreathPhase('inhale')
    setSegmentRemaining(0)
    setCurrentSegmentIndex(0)
    stopAmbientTone()
  }, [clearSegmentTimers, stopAmbientTone])

  const handleStartSession = useCallback(async () => {
    if (!selectedMinutes) {
      return
    }
    if (segments.length === 0) {
      return
    }
    clearSegmentTimers()
    const minutes = selectedMinutes
    const firstSegment = segments[0]
    setRemainingSeconds(minutes * 60)
    setCurrentSegmentIndex(0)
    setBreathPhase(firstSegment.phase)
    setSegmentRemaining(firstSegment.duration)
    setIsInhaling(firstSegment.phase === 'inhale')
    await unlockAudio()
    setPhase('session')
  }, [selectedMinutes, segments, unlockAudio, clearSegmentTimers])

  useEffect(() => {
    if (phase !== 'session') {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
    }

    timerRef.current = window.setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(timerRef.current ?? undefined)
          timerRef.current = null
          handleSessionComplete()
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [phase, handleSessionComplete])

  useEffect(() => {
    if (phase === 'session') {
      startSegment(0)
    } else {
      clearSegmentTimers()
    }
  }, [phase, startSegment, clearSegmentTimers])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(audioStorageKey, JSON.stringify({ mode: breathMode, volume }))
  }, [breathMode, volume])

  useEffect(() => {
    if (phase === 'session') {
      applyAmbientLevel(isInhaling ? 0.055 : 0.028)
    }
  }, [phase, isInhaling, applyAmbientLevel, isMuted, volume])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
      }
      clearSegmentTimers()
      stopAmbientTone()
    }
  }, [clearSegmentTimers, stopAmbientTone])

  const formattedRemaining = formatTime(Math.max(remainingSeconds, 0))
  const progressWidth = `${Math.min(100, Math.max(0, progress * 100))}%`
  const currentSegment = segments[currentSegmentIndex] ?? segments[0]
  const phaseLabels: Record<BreathPhase, string> = {
    inhale: 'Indånd',
    exhale: 'Udånd',
    hold: 'Hold',
  }

  return (
    <section className="menu flex flex-col gap-10">
      <div className="menu__top-bar">
        <BrandLogo size={64} wordmarkSize="1.75rem" />
        <button type="button" className="menu__back-button" onClick={() => navigate('/')}>Tilbage til menu</button>
      </div>

      {phase === 'select' && (
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl text-slate-900">Åndedræt</h1>
            <p className="text-lg leading-relaxed text-slate-600">
              Følg guidede vejrtrækningsmønstre med klokkeslag, lys og bevægelse. Vælg længde og rytme, og tryk derefter på start for at aktivere lyd og animationer.
            </p>
            <p className="text-base text-slate-500">
              Sessionen starter først, når du trykker &quot;Start&quot; – det sikrer at lyden kan afspilles på alle enheder.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 w-full">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {sessionOptions.map((option) => (
                <button
                  key={option.minutes}
                  type="button"
                  className="breath-session__option"
                  data-selected={selectedMinutes === option.minutes}
                  aria-pressed={selectedMinutes === option.minutes}
                  onClick={() => setSelectedMinutes(option.minutes)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3 max-w-2xl">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">Vejrtrækningsmønster</span>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {(Object.keys(breathingModes) as BreathingMode[]).map((modeKey) => {
                  const mode = breathingModes[modeKey]
                  return (
                    <button
                      key={modeKey}
                      type="button"
                      className="breath-session__option breath-session__mode-button"
                      data-selected={breathMode === modeKey}
                      aria-pressed={breathMode === modeKey}
                      onClick={() => setBreathMode(modeKey)}
                    >
                      {mode.label}
                    </button>
                  )
                })}
              </div>
              <p className="text-sm text-slate-500">{breathingModes[breathMode].description}</p>
            </div>

            <button
              type="button"
              className="breath-session__option breath-session__start-button"
              onClick={() => void handleStartSession()}
              disabled={!selectedMinutes}
            >
              Start
            </button>
          </div>

          {!audioSupported && (
            <p className="text-sm text-slate-500 max-w-2xl">
              Din browser understøtter ikke Web Audio API. Sessionen kan stadig gennemføres, men uden den blide baggrundslyd.
            </p>
          )}
        </div>
      )}

      {phase === 'session' && (
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-4 items-start text-left">
            <span className="breath-session__badge">{breathingModes[breathMode].label}</span>
            <h2 className="text-2xl text-slate-900">Følg klokkeslagene</h2>
            <p className="text-base text-slate-600 max-w-2xl">
              Hvert klokkeslag markerer næste fase. Lad cirklen guide din rytme, og følg teksten for indånding, pauser og udånding.
            </p>
          </header>

          <div className="breath-session__progress">
            <div className="breath-session__progress-fill" style={{ width: progressWidth }} />
          </div>

          <div className="flex flex-col items-center gap-6 text-center">
            <div className="breath-circle" style={circleStyle} aria-hidden="true" />
            <div className="flex flex-col items-center gap-3">
              <span className="breath-session__badge">{phaseLabels[breathPhase]}</span>
              <div className="text-4xl font-semibold text-sky-700 breath-session__timer">{formattedRemaining}</div>
              {currentSegment && <p className="text-base text-slate-600 max-w-2xl">{currentSegment.prompt}</p>}
              <p className="text-sm text-slate-500">Næste skift om {Math.max(segmentRemaining, 0)} sek.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <button type="button" className="breath-session__button-secondary" onClick={handleReset}>
              Afslut session
            </button>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
              <button
                type="button"
                className="breath-session__button-secondary"
                onClick={() => setIsMuted((previous) => !previous)}
              >
                {isMuted ? 'Slå lyd til' : 'Slå lyd fra'}
              </button>
              <label className="breath-session__volume-control">
                <span className="text-sm text-slate-500">Volumen</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(volume * 100)}
                  onChange={(event) => setVolume(Number(event.currentTarget.value) / 100)}
                  className="breath-session__volume-slider"
                  aria-label="Juster lydstyrke"
                  disabled={isMuted}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {phase === 'complete' && (
        <div className="flex flex-col items-center gap-8 text-center">
          <h2 className="text-4xl text-slate-900">Velkommen tilbage til nu’et</h2>
          <p className="text-lg leading-relaxed text-slate-600 max-w-2xl">
            Tag et øjeblik til at bemærke hvordan kroppen føles lige nu. Du kan starte en ny session eller vende tilbage til menuen.
          </p>
          <div className="flex items-center justify-center gap-6">
            <button type="button" className="breath-session__option" onClick={handleReset}>
              Ny session
            </button>
            <button
              type="button"
              className="breath-session__button-secondary"
              onClick={() => navigate('/')}
            >
              Tilbage til menuen
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
