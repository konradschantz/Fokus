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

interface PuzzleBloxGameProps {
  onExit?: () => void
}

type Phase = 'idle' | 'running' | 'finished'

const GAME_DURATION_SECONDS = 40

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

export default function PuzzleBloxGame({ onExit }: PuzzleBloxGameProps) {
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
    oscillator.frequency.setValueAtTime(420, now)
    oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.35)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start(now)
    oscillator.stop(now + 0.6)
  }, [ensureAudioContext])

  const activeLevels = hasInvalidLevels ? [] : generationResult.levels
  const invalidMask = useMemo(
    () => (invalidLevel && showDebug ? findGravityViolations(invalidLevel.target) : null),
    [invalidLevel, showDebug],
  )

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopTimer()
    }
  }, [stopTimer])

  useEffect(() => {
    if (phase !== 'running') {
      stopTimer()
      return undefined
    }

    timerRef.current = window.setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 1) {
          stopTimer()
          setPhase('finished')
          return 0
        }

        return previous - 1
      })
    }, 1000)

    return () => {
      stopTimer()
    }
  }, [phase, stopTimer])

  const handleStartGame = useCallback(() => {
    setSessionId((previous) => previous + 1)
    setPhase('running')
    setTimeRemaining(GAME_DURATION_SECONDS)
    setLevelsCompleted(0)
    setCurrentLevelIndex(0)
  }, [])

  const handleRestart = useCallback(() => {
    handleStartGame()
  }, [handleStartGame])

  const handleLevelComplete = useCallback(
    ({ completedLevelIndex, nextLevelIndex }: { completedLevelIndex: number; nextLevelIndex: number }) => {
      setLevelsCompleted((previous) => Math.max(previous, completedLevelIndex + 1))
      setCurrentLevelIndex(nextLevelIndex)
    },
    [],
  )

  const highestLevel = phase === 'idle' ? 0 : Math.max(levelsCompleted, currentLevelIndex + 1)
  const scoreboardTime = phase === 'idle' ? formatTime(GAME_DURATION_SECONDS) : formatTime(timeRemaining)

  const scoreboardFootnote = hasInvalidLevels
    ? 'Generatoren arbejder på et nyt niveau…'
    : phase === 'idle'
      ? 'Start spillet for at begynde nedtællingen.'
      : phase === 'running'
        ? 'Fortsæt med at matche figurer, indtil tiden udløber.'
        : 'Godt gået! Start igen for at forbedre din score.'

  return (
    <div className="puzzle-blox">
      <header className="puzzle-blox__header">
        <h1>Puzzle Blox</h1>
        <div className="puzzle-blox__header-controls">
          <span className="puzzle-blox__timer" aria-live="polite">{scoreboardTime}</span>
          {phase !== 'running' ? (
            <button
              type="button"
              className="puzzle-blox__primary-button puzzle-blox__start-button"
              onClick={handleStartGame}
            >
              {phase === 'idle' ? 'Start' : 'Start igen'}
            </button>
          ) : null}
        </div>
      </header>

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
              {phase === 'idle' ? (
                <section className="puzzle-blox__panel puzzle-blox__panel--intro">
                  <h2>Start Puzzle Blox</h2>
                  <p>
                    Tryk på &rdquo;Start spil&rdquo; for at få 40 sekunder til at løse så mange figurer som muligt.
                    Du starter på niveau 1 og kan højest nå til niveau 5.
                  </p>
                  <button type="button" className="puzzle-blox__primary-button" onClick={handleStartGame}>
                    Start spil
                  </button>
                </section>
              ) : null}

              {phase !== 'idle' ? (
                <>
                  <LevelManager
                    key={sessionId}
                    levels={activeLevels}
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
                      <div className="puzzle-blox__actions">
                        <button
                          type="button"
                          className="puzzle-blox__primary-button"
                          onClick={handleRestart}
                        >
                          Prøv igen
                        </button>
                      </div>
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
              ) : null}
            </>
          )}
        </div>

        <aside className="game-scoreboard puzzle-blox__scoreboard">
          <h2 className="game-scoreboard__title">Scoreboard</h2>
          <dl className="game-scoreboard__rows">
            <div className="game-scoreboard__row">
              <dt>Tid tilbage</dt>
              <dd>{scoreboardTime}</dd>
            </div>
            <div className="game-scoreboard__row">
              <dt>Aktuelt niveau</dt>
              <dd>
                {hasInvalidLevels
                  ? '–'
                  : phase === 'idle'
                    ? '–'
                    : Math.min(currentLevelIndex + 1, activeLevels.length)}
              </dd>
            </div>
            <div className="game-scoreboard__row">
              <dt>Niveauer gennemført</dt>
              <dd>
                {phase === 'idle'
                  ? 0
                  : Math.min(levelsCompleted, activeLevels.length)}
              </dd>
            </div>
          </dl>
          <p className="game-scoreboard__footnote">{scoreboardFootnote}</p>
        </aside>
      </div>
    </div>
  )
}
