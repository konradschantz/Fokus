import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LevelManager } from './components/LevelManager'
import { TargetBoard } from './components/TargetBoard'
import {
  PUZZLE_BLOX_DEFAULT_SEED,
  generatePuzzleBloxLevels,
  type PuzzleBloxLevel,
} from './levels'
import { findGravityViolations } from './logic'
import './PuzzleBloxGame.css'

type Phase = 'idle' | 'running' | 'finished'

const GAME_DURATION_SECONDS = 40

interface PuzzleBloxGameProps {
  startSignal?: number
  onFinished?: (summary: { levelsCompleted: number; highestLevel: number; timeRemaining: number }) => void
}

export default function PuzzleBloxGame({ startSignal, onFinished }: PuzzleBloxGameProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [sessionId, setSessionId] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION_SECONDS)
  const [levelsCompleted, setLevelsCompleted] = useState(0)
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const timerRef = useRef<number | null>(null)

  const [levelSeed] = useState(() => {
    if (typeof window === 'undefined') {
      return PUZZLE_BLOX_DEFAULT_SEED
    }

    const params = new URLSearchParams(window.location.search)
    return params.get('puzzlebloxSeed') ?? PUZZLE_BLOX_DEFAULT_SEED
  })

  const generationResult = useMemo(
    () => generatePuzzleBloxLevels(`${levelSeed}-${attempt}`),
    [levelSeed, attempt],
  )

  const hasInvalidLevels = generationResult.invalidLevels.length > 0
  const invalidLevel: PuzzleBloxLevel | null = hasInvalidLevels
    ? generationResult.levels[generationResult.invalidLevels[0]!] ?? null
    : null

  useEffect(() => {
    const MAX_GENERATION_ATTEMPTS = 5

    if (hasInvalidLevels && attempt < MAX_GENERATION_ATTEMPTS) {
      setAttempt((previous) => previous + 1)
    }
  }, [attempt, hasInvalidLevels])

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') {
      return null
    }

    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) {
        return null
      }
      audioContextRef.current = new AudioCtx()
    }

    return audioContextRef.current
  }, [])

  const playClickSound = useCallback(() => {
    const ctx = ensureAudioContext()
    if (!ctx) {
      return
    }

    void ctx.resume()

    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    const now = ctx.currentTime
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(520, now)
    oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.18)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start(now)
    oscillator.stop(now + 0.26)
  }, [ensureAudioContext])

  const playWinSound = useCallback(() => {
    const ctx = ensureAudioContext()
    if (!ctx) {
      return
    }

    void ctx.resume()

    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    const now = ctx.currentTime
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(660, now)
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.24)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start(now)
    oscillator.stop(now + 0.34)
  }, [ensureAudioContext])

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    timerRef.current = window.setInterval(() => {
      setTimeRemaining((previous) => {
        const next = previous - 1
        if (next <= 0) {
          stopTimer()
          setPhase('finished')
          onFinished?.({
            levelsCompleted,
            highestLevel: Math.max(levelsCompleted, currentLevelIndex + 1),
            timeRemaining: 0,
          })
          return 0
        }
        return next
      })
    }, 1000)
  }, [currentLevelIndex, levelsCompleted, onFinished, stopTimer])

  useEffect(() => {
    return () => {
      stopTimer()
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [stopTimer])

  const handleStartGame = useCallback(() => {
    stopTimer()
    setSessionId((value) => value + 1)
    setPhase('running')
    setTimeRemaining(GAME_DURATION_SECONDS)
    setLevelsCompleted(0)
    setCurrentLevelIndex(0)
    startTimer()
  }, [startTimer, stopTimer])

  useEffect(() => {
    if (typeof startSignal === 'number') {
      handleStartGame()
    }
  }, [handleStartGame, startSignal])

  const handleLevelComplete = useCallback(
    ({ completedLevelIndex, nextLevelIndex }: { completedLevelIndex: number; nextLevelIndex: number }) => {
      setLevelsCompleted((previous) => Math.max(previous, completedLevelIndex + 1))
      setCurrentLevelIndex(nextLevelIndex)
    },
    [],
  )

  const highestLevel = phase === 'idle' ? 0 : Math.max(levelsCompleted, currentLevelIndex + 1)

  useEffect(() => {
    if (phase !== 'finished') {
      return
    }
    onFinished?.({
      levelsCompleted,
      highestLevel,
      timeRemaining,
    })
  }, [highestLevel, levelsCompleted, onFinished, phase, timeRemaining])

  const invalidMask = useMemo(
    () => (invalidLevel ? findGravityViolations(invalidLevel.target) : null),
    [invalidLevel],
  )

  return (
    <div className="puzzle-blox puzzle-blox--immersive">
      <div className="puzzle-blox__content">
        <div className="puzzle-blox__main">
          {hasInvalidLevels ? (
            <div
              className="puzzle-blox__panel puzzle-blox__panel--compact puzzle-blox__regenerating"
              role="status"
              aria-live="polite"
            >
              <p>Generatoren arbejder på et reachbart niveau…</p>
              {showDebug && invalidLevel ? (
                <TargetBoard pattern={invalidLevel.target} showDebug debugMask={invalidMask ?? undefined} />
              ) : null}
            </div>
          ) : (
            <>
              <LevelManager
                key={sessionId}
                levels={generationResult.levels}
                onClickSound={playClickSound}
                onWinSound={playWinSound}
                showDebug={showDebug}
                isLocked={phase !== 'running'}
                onLevelComplete={handleLevelComplete}
              />

              <div className="puzzle-blox__instructions">
                Lav samme figur som vist øverst. Fjern overflødige blokke ved at trykke på dem.
              </div>

              {phase === 'finished' ? (
                <div className="puzzle-blox__summary" role="status" aria-live="polite">
                  <h2>Tiden er gået!</h2>
                  <p>
                    Du nåede niveau {highestLevel} og gennemførte{' '}
                    {levelsCompleted === 1 ? '1 niveau' : `${levelsCompleted} niveauer`}.
                  </p>
                </div>
              ) : null}

              <div className="puzzle-blox__debug-controls">
                <label className="puzzle-blox__debug-toggle">
                  <input
                    type="checkbox"
                    checked={showDebug}
                    onChange={(event) => setShowDebug(event.target.checked)}
                  />
                  Vis reachability debug
                </label>

                {showDebug && hasInvalidLevels ? (
                  <div className="puzzle-blox__debug-warning">Ikke reach-bar – regenererer…</div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
