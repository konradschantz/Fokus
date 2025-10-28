import { useCallback, useMemo, useRef } from 'react'
import { LevelManager } from './components/LevelManager'
import { puzzleBloxLevels } from './levels'
import './PuzzleBloxGame.css'

interface PuzzleBloxGameProps {
  onExit?: () => void
}

export default function PuzzleBloxGame({ onExit }: PuzzleBloxGameProps) {
  const audioContextRef = useRef<AudioContext | null>(null)

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

  const levels = useMemo(() => puzzleBloxLevels, [])

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

      <LevelManager levels={levels} onClickSound={playClickSound} onWinSound={playWinSound} />

      <div className="puzzle-blox__instructions">
        Lav samme figur som vist øverst. Fjern overflødige blokke ved at trykke på dem.
      </div>
    </div>
  )
}
