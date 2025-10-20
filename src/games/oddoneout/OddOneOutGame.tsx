import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import motion from 'framer-motion'
import './OddOneOutGame.css'
import { postOddOneOutScore } from '../../utils/oddOneOutScores'

type OddOneOutPhase = 'idle' | 'running' | 'finished'

type ShapeType = 'circle' | 'square' | 'triangle' | 'donut' | 'cross'

interface OddOneOutCell {
  id: number
  isTarget: boolean
  type: ShapeType
  color: string
  accentColor: string
  scale: number
  rotation: number
  strokeWidth: number
}

interface BoardState {
  cells: OddOneOutCell[]
  gridSize: number
  stage: number
}

const GAME_DURATION_SECONDS = 60
const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'triangle', 'donut', 'cross']
const SEA_TONES = ['#e0f2fe', '#bae6fd', '#99f6e4', '#7dd3fc', '#a5f3fc', '#c4b5fd']
const COLOR_VARIANCE = [0.32, 0.24, 0.18, 0.12, 0.08]
const SCALE_VARIANCE = [0, 0, 0.05, 0.08, 0.1]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function randomItem<T>(collection: readonly T[]): T {
  return collection[Math.floor(Math.random() * collection.length)]
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '')
  const bigint = Number.parseInt(normalized.length === 3 ? normalized.repeat(2) : normalized, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const toHex = (value: number) =>
    clamp(Math.round(value), 0, 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function adjustColor(hex: string, amount: number): string {
  const base = hexToRgb(hex)
  const mixTarget = amount >= 0 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }
  const ratio = clamp(Math.abs(amount), 0, 1)

  return rgbToHex({
    r: base.r + (mixTarget.r - base.r) * ratio,
    g: base.g + (mixTarget.g - base.g) * ratio,
    b: base.b + (mixTarget.b - base.b) * ratio,
  })
}

function ensureColorContrast(
  baseColor: string,
  candidate: string,
  variance: number,
  direction: 1 | -1,
): string {
  if (candidate.toLowerCase() !== baseColor.toLowerCase()) {
    return candidate
  }
  const alternativeDirection = direction === 1 ? -1 : 1
  const fallbackVariance = variance > 0 ? variance + 0.12 : 0.25
  return adjustColor(baseColor, clamp(fallbackVariance, 0.05, 0.45) * alternativeDirection)
}

function generateBoard(round: number): BoardState {
  const stage = Math.min(Math.floor(round / 3), 4)
  const gridSize = 3 + stage
  const totalCells = gridSize * gridSize
  const targetIndex = Math.floor(Math.random() * totalCells)

  const baseShape = randomItem(SHAPE_TYPES)
  const uniqueShape =
    stage < 3 ? randomItem(SHAPE_TYPES.filter((shape) => shape !== baseShape)) : baseShape

  const baseColor = randomItem(SEA_TONES)
  const variance = COLOR_VARIANCE[stage]
  const contrastDirection: 1 | -1 = Math.random() > 0.5 ? 1 : -1
  const proposedUniqueColor = adjustColor(baseColor, variance * contrastDirection)
  const uniqueColor = ensureColorContrast(baseColor, proposedUniqueColor, variance, contrastDirection)
  const baseAccent = adjustColor(baseColor, -0.3)
  const uniqueAccent = adjustColor(uniqueColor, -0.28)
  const scaleDelta = SCALE_VARIANCE[stage]
  const rotationVariance = stage >= 3 ? 6 : 10

  const cells: OddOneOutCell[] = []

  for (let index = 0; index < totalCells; index += 1) {
    const isTarget = index === targetIndex
    const rotation = (Math.random() * rotationVariance - rotationVariance / 2) * (stage >= 3 ? 0.5 : 1)

    cells.push({
      id: index,
      isTarget,
      type: isTarget ? uniqueShape : baseShape,
      color: isTarget ? uniqueColor : baseColor,
      accentColor: isTarget ? uniqueAccent : baseAccent,
      scale: isTarget ? 1 - scaleDelta : 1,
      rotation: isTarget && stage >= 4 ? rotation + (contrastDirection > 0 ? 6 : -6) : rotation,
      strokeWidth: stage >= 4 && isTarget ? 9 : 11,
    })
  }

  return { cells, gridSize, stage }
}

function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.ceil(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const rest = safeSeconds % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

function renderShape(cell: OddOneOutCell): JSX.Element {
  const commonProps = {
    role: 'presentation' as const,
    style: {
      transform: `scale(${cell.scale}) rotate(${cell.rotation}deg)`,
      transition: 'transform 0.25s ease',
      width: '100%',
      height: '100%',
    },
  }

  switch (cell.type) {
    case 'circle':
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          <circle cx="50" cy="50" r="36" fill={cell.color} />
        </svg>
      )
    case 'square':
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          <rect x="18" y="18" width="64" height="64" rx="18" fill={cell.color} />
        </svg>
      )
    case 'triangle':
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          <polygon points="50,16 84,82 16,82" fill={cell.color} />
        </svg>
      )
    case 'donut':
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke={cell.color}
            strokeWidth={cell.strokeWidth}
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="6" fill={cell.accentColor} />
        </svg>
      )
    case 'cross':
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          <rect x="44" y="18" width="12" height="64" rx="6" fill={cell.color} />
          <rect x="18" y="44" width="64" height="12" rx="6" fill={cell.color} />
          <rect x="46" y="42" width="8" height="16" rx="4" fill={cell.accentColor} />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          <circle cx="50" cy="50" r="36" fill={cell.color} />
        </svg>
      )
  }
}

interface OddOneOutGameProps {
  onGameFinished?: (score: number) => void
  onScoreSubmitted?: () => void
}

export default function OddOneOutGame({ onGameFinished, onScoreSubmitted }: OddOneOutGameProps) {
  const [phase, setPhase] = useState<OddOneOutPhase>('idle')
  const [board, setBoard] = useState<BoardState>(() => generateBoard(0))
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timerRef = useRef<number | null>(null)
  const endTimeRef = useRef<number>(0)
  const phaseRef = useRef<OddOneOutPhase>(phase)
  const scoreRef = useRef(score)
  const roundRef = useRef(round)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    roundRef.current = round
  }, [round])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const finishGame = useCallback(() => {
    if (phaseRef.current === 'finished') {
      return
    }

    clearTimer()
    setPhase('finished')
    setTimeLeft(0)
    setHasSubmitted(false)
    setError(null)
    setPlayerName('')

    onGameFinished?.(scoreRef.current)
  }, [clearTimer, onGameFinished])

  useEffect(() => {
    if (phase !== 'running') {
      clearTimer()
      return
    }

    timerRef.current = window.setInterval(() => {
      const remainingMs = Math.max(0, endTimeRef.current - Date.now())
      const remainingSeconds = remainingMs / 1000
      setTimeLeft(Math.max(0, Math.ceil(remainingSeconds)))

      if (remainingMs <= 0) {
        finishGame()
      }
    }, 200)

    return () => {
      clearTimer()
    }
  }, [clearTimer, finishGame, phase])

  const handleStart = useCallback(() => {
    clearTimer()
    endTimeRef.current = Date.now() + GAME_DURATION_SECONDS * 1000
    setPhase('running')
    setBoard(generateBoard(0))
    setTimeLeft(GAME_DURATION_SECONDS)
    setScore(0)
    setRound(0)
    setPlayerName('')
    setHasSubmitted(false)
    setError(null)
  }, [clearTimer])

  const handleReset = useCallback(() => {
    handleStart()
  }, [handleStart])

  const handleCellClick = useCallback(
    (cell: OddOneOutCell) => {
      if (!cell.isTarget || phaseRef.current !== 'running') {
        return
      }

      const nextRound = roundRef.current + 1
      setScore((value) => value + 1)
      setRound(nextRound)
      setBoard(generateBoard(nextRound))
    },
    [],
  )

  const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPlayerName(event.target.value)
  }, [])

  const handleSaveScore = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()

      const trimmedName = playerName.trim()

      if (!trimmedName) {
        setError('Skriv dit navn, før du gemmer din score.')
        return
      }

      setIsSaving(true)
      setError(null)

      try {
        await postOddOneOutScore(trimmedName.slice(0, 32), scoreRef.current)
        setHasSubmitted(true)
        onScoreSubmitted?.()
      } catch (saveError) {
        console.error('Kunne ikke gemme Odd One Out-scoren.', saveError)
        setError('Noget gik galt under gemningen. Prøv igen.')
      } finally {
        setIsSaving(false)
      }
    },
    [onScoreSubmitted, playerName],
  )

  const progressLabel = useMemo(() => {
    if (phase === 'idle') {
      return 'Klar til start'
    }

    if (phase === 'running') {
      return `Runde ${round + 1}`
    }

    return 'Tiden er gået'
  }, [phase, round])

  const variantLabel = useMemo(() => {
    if (phase === 'finished') {
      return 'Flot fokus – gem din score og prøv igen for at slå den.'
    }

    if (phase === 'running') {
      return 'Find figuren, der skiller sig ud fra de andre.'
    }

    return 'Klik på start for at teste dit blik for detaljer.'
  }, [phase])

  return (
    <motion.div
      className="odd-one-out-game__card"
      initial={{ opacity: 0, transform: 'translateY(12px)' }}
      animate={{ opacity: 1, transform: 'translateY(0)' }}
      transition={{ duration: 0.45 }}
    >
      <div className="odd-one-out-game__header">
        <div className="odd-one-out-game__heading">
          <span className="odd-one-out-game__eyebrow">{progressLabel}</span>
          <h2 className="odd-one-out-game__title">{variantLabel}</h2>
        </div>
        <div className="odd-one-out-game__metrics" aria-live="polite">
          <div className="odd-one-out-game__metric">
            <span className="odd-one-out-game__metric-label">Tid</span>
            <span className="odd-one-out-game__metric-value">{formatSeconds(timeLeft)}</span>
          </div>
          <div className="odd-one-out-game__metric">
            <span className="odd-one-out-game__metric-label">Point</span>
            <span className="odd-one-out-game__metric-value">{score}</span>
          </div>
        </div>
      </div>

      <div className="odd-one-out-game__actions">
        <button
          type="button"
          className="odd-one-out-game__primary-button"
          onClick={phase === 'running' ? handleReset : handleStart}
        >
          {phase === 'running' ? 'Nulstil' : 'Start spil'}
        </button>
        <div className="odd-one-out-game__status-text" aria-live="polite">
          <span>Grid-størrelse: {board.gridSize} × {board.gridSize}</span>
        </div>
      </div>

      <motion.div
        className="odd-one-out-game__board"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        style={{
          gridTemplateColumns: `repeat(${board.gridSize}, minmax(0, 1fr))`,
        }}
      >
        {board.cells.map((cell) => (
          <motion.button
            key={cell.id}
            type="button"
            className="odd-one-out-game__cell"
            whileHover={
              phase === 'running'
                ? { transform: 'translateY(-4px)', boxShadow: '0 14px 32px rgba(14, 165, 233, 0.22)' }
                : undefined
            }
            whileTap={phase === 'running' ? { transform: 'scale(0.96)' } : undefined}
            onClick={() => handleCellClick(cell)}
            disabled={phase !== 'running'}
          >
            <span className="sr-only">{cell.isTarget ? 'Unik figur' : 'Standardfigur'}</span>
            <div className="odd-one-out-game__shape">{renderShape(cell)}</div>
          </motion.button>
        ))}
      </motion.div>

      {phase === 'idle' ? (
        <p className="odd-one-out-game__hint">
          Du har ét minut til at finde figuren, der skiller sig ud. Gridet vokser, og forskellene bliver
          mere subtile undervejs.
        </p>
      ) : null}

      {phase === 'finished' ? (
        <motion.form
          className="odd-one-out-game__form"
          initial={{ opacity: 0, transform: 'translateY(10px)' }}
          animate={{ opacity: 1, transform: 'translateY(0)' }}
          transition={{ duration: 0.35 }}
          onSubmit={handleSaveScore}
        >
          <p className="odd-one-out-game__result">Din score: {scoreRef.current}</p>
          <p className="odd-one-out-game__result-text">
            Tiden er gået – del dit resultat med holdet og se, om du kan slå det næste gang.
          </p>
          <div className="odd-one-out-game__form-row">
            <label className="odd-one-out-game__label">
              Navn
              <input
                type="text"
                value={playerName}
                onChange={handleNameChange}
                className="odd-one-out-game__input"
                placeholder="Skriv dit navn"
                maxLength={40}
              />
            </label>
            <button
              type="submit"
              className="odd-one-out-game__secondary-button"
              disabled={isSaving || hasSubmitted}
            >
              {hasSubmitted ? 'Score gemt' : isSaving ? 'Gemmer…' : 'Gem score'}
            </button>
            <button
              type="button"
              className="odd-one-out-game__ghost-button"
              onClick={handleReset}
            >
              Spil igen
            </button>
          </div>
          {error ? <p className="odd-one-out-game__error">{error}</p> : null}
          {hasSubmitted ? (
            <p className="odd-one-out-game__success">Highscoren er gemt. Se tavlen for de bedste resultater.</p>
          ) : null}
        </motion.form>
      ) : null}
    </motion.div>
  )
}
