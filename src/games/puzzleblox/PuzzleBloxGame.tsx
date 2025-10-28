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

export default function PuzzleBloxGame({ onExit }: PuzzleBloxGameProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [attempt, setAttempt] = useState(0)

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

  return (
    <div className="puzzle-blox">
      <header className="puzzle-blox__header">
        <button
          type="button"
          className="puzzle-blox__back-button"
          onClick={onExit}
          aria-label="Tilbage til forsiden"
          disabled={!onExit}
        >
          <span aria-hidden="true">←</span>
          Tilbage
        </button>
        <h1>Puzzle Blox</h1>
      </header>

      {hasInvalidLevels ? (
        <div
          className="puzzle-blox__panel puzzle-blox__panel--compact puzzle-blox__regenerating"
          role="status"
          aria-live="polite"
        >
          <p>Generatoren arbejder på et reachbart niveau…</p>
          {showDebug && invalidLevel ? (
            <TargetBoard
              pattern={invalidLevel.target}
              showDebug
              debugMask={invalidMask ?? undefined}
            />
          ) : null}
        </div>
      ) : (
        <LevelManager
          levels={activeLevels}
          onClickSound={playClickSound}
          onWinSound={playWinSound}
          showDebug={showDebug}
        />
      )}

      <div className="puzzle-blox__instructions">
        Lav samme figur som vist øverst. Fjern overflødige blokke ved at trykke på dem.
      </div>

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
    </div>
  )
}
