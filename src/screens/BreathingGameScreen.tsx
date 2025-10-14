import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

const sessionOptions = [
  { minutes: 3, label: '3 minutter' },
  { minutes: 5, label: '5 minutter' },
  { minutes: 10, label: '10 minutter' },
]

type Phase = 'select' | 'session' | 'complete'

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

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function BreathingGameScreen() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('select')
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isInhaling, setIsInhaling] = useState(false)
  const [ambientOn, setAmbientOn] = useState(true)
  const [audioSupported, setAudioSupported] = useState(true)
  const audioRefs = useRef<AudioRefs>({ ...initialAudioRefs })
  const timerRef = useRef<number | null>(null)
  const pointerStartY = useRef<number | null>(null)

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

  const stopAmbientTone = () => {
    const { context, oscillator, gain } = audioRefs.current
    if (!context || !oscillator || !gain) {
      return
    }

    const now = context.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.8)
    oscillator.stop(now + 0.9)

    audioRefs.current = { ...initialAudioRefs }
  }

  const fadeGain = (target: number) => {
    const { context, gain } = audioRefs.current
    if (!context || !gain) {
      return
    }
    const now = context.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.linearRampToValueAtTime(target, now + 0.75)
  }

  const ensureAmbientTone = async () => {
    if (!ambientOn) {
      return
    }

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
        await audioRefs.current.context.resume()
      }
      fadeGain(isInhaling ? 0.055 : 0.03)
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
      fadeGain(isInhaling ? 0.055 : 0.03)
    } catch (error) {
      console.error('Kunne ikke starte ambient lyd', error)
      setAudioSupported(false)
    }
  }

  const handleStartSession = async (minutes: number) => {
    setSelectedMinutes(minutes)
    setRemainingSeconds(minutes * 60)
    setPhase('session')
    setIsInhaling(false)
    await ensureAmbientTone()
  }

  const handleSessionComplete = () => {
    setPhase('complete')
    setIsInhaling(false)
    stopAmbientTone()
  }

  const handleReset = () => {
    setPhase('select')
    setSelectedMinutes(null)
    setRemainingSeconds(0)
    setIsInhaling(false)
    if (ambientOn) {
      stopAmbientTone()
    }
  }

  const resumeAudioIfNeeded = async () => {
    const { context } = audioRefs.current
    if (context && context.state === 'suspended') {
      try {
        await context.resume()
      } catch (error) {
        console.error('Kunne ikke genoptage AudioContext', error)
      }
    } else if (!context) {
      await ensureAmbientTone()
    }
  }

  const handlePointerDown = async (event: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'session') {
      return
    }
    pointerStartY.current = event.clientY
    setIsInhaling(true)
    await resumeAudioIfNeeded()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'session' || pointerStartY.current === null) {
      return
    }

    const delta = event.clientY - pointerStartY.current
    if (delta < -20) {
      setIsInhaling(true)
    }
    if (delta > 20) {
      setIsInhaling(false)
    }
  }

  const handlePointerUp = () => {
    if (phase !== 'session') {
      return
    }
    pointerStartY.current = null
    setIsInhaling(false)
  }

  useEffect(() => {
    if (phase !== 'session') {
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
  }, [phase])

  useEffect(() => {
    if (!ambientOn) {
      stopAmbientTone()
    } else if (phase === 'session') {
      void ensureAmbientTone()
    }
  }, [ambientOn, phase])

  useEffect(() => {
    if (!ambientOn) {
      return
    }
    fadeGain(isInhaling ? 0.055 : 0.028)
  }, [isInhaling, ambientOn])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
      }
      stopAmbientTone()
    }
  }, [])

  const formattedRemaining = formatTime(Math.max(remainingSeconds, 0))
  const progressWidth = `${Math.min(100, Math.max(0, progress * 100))}%`

  return (
    <section className="menu flex flex-col gap-10">
      <div className="menu__top-bar">
        <BrandLogo size={64} wordmarkSize="1.75rem" />
        <button type="button" className="menu__back-button" onClick={() => navigate('/')}>Tilbage til menu</button>
      </div>

      {phase === 'select' && (
        <div className="flex flex-col items-center gap-8 text-center">
          <span className="breath-session__badge">Nyt minigame</span>
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl text-slate-900">Åndedræt</h1>
            <p className="text-lg leading-relaxed text-slate-600">
              Et meditativt flow hvor du styrer rytmen i din vejrtrækning. Tryk eller swipe op for at indånde og giv slip eller swipe ned for at udånde.
            </p>
            <p className="text-base text-slate-500">
              Vælg en session for at komme i gang. Alle animationer kører i rolig 60 fps for at give en blid oplevelse.
            </p>
          </div>
          <div className="flex items-center justify-center gap-6">
            {sessionOptions.map((option) => (
              <button
                key={option.minutes}
                type="button"
                className="breath-session__option"
                onClick={() => void handleStartSession(option.minutes)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {!audioSupported && (
            <p className="text-sm text-slate-500 max-w-2xl">
              Din browser understøtter ikke Web Audio API. Spillet kan stadig gennemføres, men uden den blide baggrundslyd.
            </p>
          )}
        </div>
      )}

      {phase === 'session' && (
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-4 items-start text-left">
            <span className="breath-session__badge">Session i gang</span>
            <h2 className="text-2xl text-slate-900">Følg din vejrtrækning</h2>
            <p className="text-base text-slate-600 max-w-2xl">
              Hold eller swipe op for at udvide cirklen (indånding). Giv slip eller swipe ned for at trække den sammen (udånding). Lad din rytme være rolig og stabil.
            </p>
          </header>

          <div className="breath-session__progress">
            <div className="breath-session__progress-fill" style={{ width: progressWidth }} />
          </div>

          <div className="flex flex-col items-center gap-6">
            <div
              role="presentation"
              className="breath-circle"
              style={circleStyle}
              onPointerDown={(event) => void handlePointerDown(event)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onKeyDown={async (event) => {
                if (event.key === ' ' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  setIsInhaling(true)
                  await resumeAudioIfNeeded()
                }
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setIsInhaling(false)
                }
              }}
              onKeyUp={(event) => {
                if (event.key === ' ' || event.key === 'ArrowUp') {
                  setIsInhaling(false)
                }
              }}
              tabIndex={0}
            />
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="text-4xl font-semibold text-sky-700 breath-session__timer">{formattedRemaining}</div>
              <p className="text-base text-slate-600 max-w-2xl">
                Forestil dig at du fylder kroppen med ro ved hver indånding, og slipper spændingerne fri ved hver udånding.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" className="breath-session__button-secondary" onClick={handleReset}>
              Afslut session
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">Baggrundslyd</span>
              <button
                type="button"
                className="breath-session__button-secondary"
                onClick={() => setAmbientOn((previous) => !previous)}
              >
                {ambientOn ? 'Slå lyd fra' : 'Slå lyd til'}
              </button>
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
