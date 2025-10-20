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
import BrandLogo from '../../components/BrandLogo'
import { postOddOneOutScore } from '../../utils/oddOneOutScores'
import { MAX_GRID_SIZE } from './constants'

type OddOneOutPhase = 'idle' | 'running' | 'finished'

type Shape = 'CIRCLE' | 'SQUARE' | 'TRIANGLE' | 'DONUT' | 'CROSS'

interface OddOneOutCell {
  id: number
  isTarget: boolean
  type: Shape
  color: string
  accentColor: string
  scale: number
  rotation: number
  strokeWidth: number
  outlineColor: string
  outlineWidth: number
  dropShadow: string
}

interface BoardState {
  cells: OddOneOutCell[]
  gridSize: number
  stage: number
}

const GAME_DURATION_SECONDS = 60
const SHAPE_TYPES: Shape[] = ['CIRCLE', 'SQUARE', 'TRIANGLE', 'DONUT', 'CROSS']
const SEA_TONES = ['#bae6fd', '#7dd3fc', '#5eead4', '#99f6e4', '#67e8f9', '#c4b5fd']
const COLOR_VARIANCE = [0.32, 0.24, 0.16, 0.11, 0.08]
const SCALE_VARIANCE = [0, 0, 0.04, 0.08, 0.1]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function randomItem<T>(collection: readonly T[]): T {
  return collection[Math.floor(Math.random() * collection.length)]
}

type RGB = { r: number; g: number; b: number }

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace('#', '')
  const bigint = Number.parseInt(normalized.length === 3 ? normalized.repeat(2) : normalized, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function rgbToCss({ r, g, b }: RGB): string {
  const normalize = (value: number) => clamp(Math.round(value), 0, 255)
  return `rgb(${normalize(r)}, ${normalize(g)}, ${normalize(b)})`
}

function mixColor(color: RGB, target: RGB, ratio: number): RGB {
  const safeRatio = clamp(ratio, 0, 1)
  return {
    r: color.r + (target.r - color.r) * safeRatio,
    g: color.g + (target.g - color.g) * safeRatio,
    b: color.b + (target.b - color.b) * safeRatio,
  }
}

function adjustColor(color: RGB, amount: number): RGB {
  const target = amount >= 0 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }
  const ratio = Math.abs(amount)
  return mixColor(color, target, ratio)
}

function luminance({ r, g, b }: RGB): number {
  const mapped = [r, g, b].map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * mapped[0]! + 0.7152 * mapped[1]! + 0.0722 * mapped[2]!
}

function contrast(colorA: RGB, colorB: RGB): number {
  const lumA = luminance(colorA)
  const lumB = luminance(colorB)
  const [maxLum, minLum] = lumA > lumB ? [lumA, lumB] : [lumB, lumA]
  return (maxLum + 0.05) / (minLum + 0.05)
}

function pickUniqueColor(baseColor: RGB): RGB {
  const candidates: RGB[] = [
    { r: 20, g: 180, b: 160 },
    { r: 15, g: 120, b: 230 },
    { r: 250, g: 120, b: 60 },
    { r: 240, g: 80, b: 120 },
    { r: 50, g: 50, b: 50 },
    { r: 250, g: 250, b: 250 },
  ]

  for (const candidate of candidates) {
    if (contrast(candidate, baseColor) >= 4.5) {
      return candidate
    }
  }

  return { r: 30, g: 30, b: 30 }
}

function randomShape(exclude?: Shape): Shape {
  const pool = exclude ? SHAPE_TYPES.filter((shape) => shape !== exclude) : SHAPE_TYPES
  return randomItem(pool)
}

function generateBoard(round: number): BoardState {
  const stage = Math.min(Math.floor(round / 3), 4)
  const requestedGridSize = 3 + stage
  const gridSize = clamp(requestedGridSize, 1, MAX_GRID_SIZE)
  const totalCells = gridSize * gridSize
  const targetIndex = Math.floor(Math.random() * totalCells)

  const baseShape = randomShape()
  const uniqueShape = randomShape(baseShape)

  const baseHex = randomItem(SEA_TONES)
  const baseColor = hexToRgb(baseHex)
  const variance = COLOR_VARIANCE[stage]
  const uniqueColor = pickUniqueColor(baseColor)
  const baseAccent = adjustColor(baseColor, -0.3)
  const uniqueAccent = adjustColor(uniqueColor, -0.28)
  const scaleDelta = SCALE_VARIANCE[stage]
  const rotationVariance = stage >= 3 ? 6 : 10
  const subtleVariance = variance * 0.35
  const uniqueRotationOffset = stage >= 4 ? (Math.random() > 0.5 ? 8 : -8) : 0

  const cells: OddOneOutCell[] = []

  for (let index = 0; index < totalCells; index += 1) {
    const isTarget = index === targetIndex
    const rotation = (Math.random() * rotationVariance - rotationVariance / 2) * (stage >= 3 ? 0.5 : 1)
    const nonUniqueAdjustment = (Math.random() * 2 - 1) * subtleVariance
    const tileColor = isTarget
      ? rgbToCss(uniqueColor)
      : rgbToCss(adjustColor(baseColor, nonUniqueAdjustment))
    const tileAccent = isTarget ? rgbToCss(uniqueAccent) : rgbToCss(baseAccent)

    cells.push({
      id: index,
      isTarget,
      type: isTarget ? uniqueShape : baseShape,
      color: tileColor,
      accentColor: tileAccent,
      scale: isTarget ? 1 - scaleDelta : 1,
      rotation: isTarget ? rotation + uniqueRotationOffset : rotation,
      strokeWidth: stage >= 4 && isTarget ? 9 : 11,
      outlineColor: isTarget ? '#000' : 'transparent',
      outlineWidth: isTarget ? 3 : 0,
      dropShadow: isTarget ? 'drop-shadow(0 0 8px rgba(0,0,0,0.25))' : 'none',
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
      filter: cell.dropShadow,
    },
  }

  switch (cell.type) {
    case 'CIRCLE':
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          <circle
            cx="50"
            cy="50"
            r="36"
            fill={cell.color}
            stroke={cell.outlineColor}
            strokeWidth={cell.outlineWidth}
          />
        </svg>
      )
    case 'SQUARE':
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          <rect
            x="18"
            y="18"
            width="64"
            height="64"
            rx="18"
            fill={cell.color}
            stroke={cell.outlineColor}
            strokeWidth={cell.outlineWidth}
          />
        </svg>
      )
    case 'TRIANGLE':
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          <polygon
            points="50,16 84,82 16,82"
            fill={cell.color}
            stroke={cell.outlineColor}
            strokeWidth={cell.outlineWidth}
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'DONUT':
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          {cell.outlineWidth > 0 ? (
            <circle cx="50" cy="50" r="41" fill="none" stroke={cell.outlineColor} strokeWidth={cell.outlineWidth} />
          ) : null}
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
    case 'CROSS':
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          <rect
            x="44"
            y="18"
            width="12"
            height="64"
            rx="6"
            fill={cell.color}
            stroke={cell.outlineColor}
            strokeWidth={cell.outlineWidth}
            strokeLinejoin="round"
          />
          <rect
            x="18"
            y="44"
            width="64"
            height="12"
            rx="6"
            fill={cell.color}
            stroke={cell.outlineColor}
            strokeWidth={cell.outlineWidth}
            strokeLinejoin="round"
          />
          <rect
            x="46"
            y="42"
            width="8"
            height="16"
            rx="4"
            fill={cell.accentColor}
            stroke={cell.outlineColor}
            strokeWidth={cell.outlineWidth > 0 ? 1.5 : 0}
          />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 100 100" {...commonProps}>
          <circle
            cx="50"
            cy="50"
            r="36"
            fill={cell.color}
            stroke={cell.outlineColor}
            strokeWidth={cell.outlineWidth}
          />
        </svg>
      )
  }
}

interface OddOneOutGameProps {
  onExit?: () => void
  onGameFinished?: (score: number) => void
  onScoreSubmitted?: () => void
}

export default function OddOneOutGame({
  onExit,
  onGameFinished,
  onScoreSubmitted,
}: OddOneOutGameProps) {
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
      return 'Skønt arbejde – skriv dit navn for at gemme scoren.'
    }

    if (phase === 'running') {
      return 'Find figuren, der skiller sig subtilt ud fra de andre.'
    }

    return 'Klik på start for at teste dine øjne og dit fokus.'
  }, [phase])

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <motion.div
        className="rounded-3xl shadow-xl"
        initial={{ opacity: 0, transform: 'translateY(12px)' }}
        animate={{ opacity: 1, transform: 'translateY(0)' }}
        transition={{ duration: 0.45 }}
        style={{
          background: 'linear-gradient(165deg, rgba(186, 230, 253, 0.9), rgba(45, 212, 191, 0.85))',
          padding: '1.75rem',
          backdropFilter: 'blur(6px)',
        }}
      >
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo as="div" size={64} wordmarkText="Odd One Out" wordmarkSize="1.75rem" />
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-600">{progressLabel}</p>
              <h2 className="text-2xl font-semibold text-sky-900">{variantLabel}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.div
              className="rounded-2xl bg-white px-4 py-3 shadow-md"
              initial={{ opacity: 0, transform: 'translateY(-6px)' }}
              animate={{ opacity: 1, transform: 'translateY(0)' }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">Tid</p>
              <p className="text-xl font-semibold text-sky-900">{formatSeconds(timeLeft)}</p>
            </motion.div>
            <motion.div
              className="rounded-2xl bg-white px-4 py-3 shadow-md"
              initial={{ opacity: 0, transform: 'translateY(-6px)' }}
              animate={{ opacity: 1, transform: 'translateY(0)' }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">Point</p>
              <p className="text-xl font-semibold text-sky-900">{score}</p>
            </motion.div>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl bg-sky-500 px-4 py-2 font-semibold text-white shadow-md"
              onClick={phase === 'running' ? handleReset : handleStart}
            >
              {phase === 'running' ? 'Nulstil' : 'Start spil'}
            </button>
            {phase === 'running' && (
              <p className="text-sm text-slate-600">
                Grid-størrelse: {board.gridSize} × {board.gridSize}
              </p>
            )}
          </div>
          {onExit ? (
            <button
              type="button"
              className="rounded-xl bg-teal-500 px-4 py-2 font-semibold text-white shadow-md"
              onClick={onExit}
            >
              Tilbage til menu
            </button>
          ) : null}
        </div>

        <motion.div
          className="grid gap-3 pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          style={{
            gridTemplateColumns: `repeat(${board.gridSize}, minmax(0, 1fr))`,
          }}
        >
          {board.cells.map((cell) => (
            <motion.button
              key={cell.id}
              type="button"
              className="rounded-2xl bg-white shadow-md"
              style={{
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(14, 165, 233, 0.18)',
                cursor: phase === 'running' ? 'pointer' : 'not-allowed',
              }}
              aria-label={cell.isTarget ? 'unik figur' : undefined}
              whileHover={
                phase === 'running'
                  ? { transform: 'translateY(-4px)', boxShadow: '0 18px 32px rgba(14, 165, 233, 0.18)' }
                  : undefined
              }
              whileTap={
                phase === 'running'
                  ? { transform: 'scale(0.96)' }
                  : undefined
              }
              onClick={() => handleCellClick(cell)}
              disabled={phase !== 'running'}
            >
              <span className="sr-only">
                {cell.isTarget ? 'Unik figur' : 'Standardfigur'}
              </span>
              <div style={{ width: '72%', height: '72%' }}>{renderShape(cell)}</div>
            </motion.button>
          ))}
        </motion.div>

        {phase === 'idle' ? (
          <motion.p
            className="pt-6 text-center text-sm text-slate-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            Du har 60 sekunder til at finde figuren, der skiller sig ud. Gridet vokser, og forskellene
            bliver mere subtile undervejs.
          </motion.p>
        ) : null}

        {phase === 'finished' ? (
          <motion.form
            className="mt-6 rounded-2xl bg-white px-6 py-5 shadow-lg"
            initial={{ opacity: 0, transform: 'translateY(12px)' }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            transition={{ duration: 0.45 }}
            onSubmit={handleSaveScore}
          >
            <p className="text-lg font-semibold text-sky-900">Din score: {scoreRef.current}</p>
            <p className="text-sm text-slate-600">
              Tiden er ude – skriv dit navn, og gem dit resultat i den fælles highscore.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="flex flex-col text-sm text-slate-600">
                Navn
                <input
                  type="text"
                  value={playerName}
                  onChange={handleNameChange}
                  className="mt-1 rounded-xl border border-sky-200 px-4 py-2 text-base text-sky-900 shadow-inner"
                  placeholder="Skriv dit navn"
                  maxLength={40}
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-sky-500 px-4 py-2 font-semibold text-white shadow-md"
                disabled={isSaving || hasSubmitted}
              >
                {hasSubmitted ? 'Score gemt' : isSaving ? 'Gemmer…' : 'Gem score'}
              </button>
              <button
                type="button"
                className="rounded-xl bg-teal-500 px-4 py-2 font-semibold text-white shadow-md"
                onClick={handleReset}
              >
                Spil igen
              </button>
            </div>
            {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
            {hasSubmitted ? (
              <p className="mt-3 text-sm text-emerald-600">
                Highscoren er gemt! Scroll ned for at se topresultaterne.
              </p>
            ) : null}
          </motion.form>
        ) : null}
      </motion.div>
    </div>
  )
}
