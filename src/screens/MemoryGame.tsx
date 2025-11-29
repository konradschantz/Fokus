import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GameShell from '../components/GameShell'

type MemoryDifficulty = 'easy' | 'medium' | 'hard'

type MemoryCard = {
  id: number
  symbol: string
  revealed: boolean
  matched: boolean
}

type DifficultyConfig = {
  columns: number
  pairs: number
}

const difficulties: Record<MemoryDifficulty, DifficultyConfig> = {
  easy: { columns: 4, pairs: 8 },
  medium: { columns: 5, pairs: 10 },
  hard: { columns: 6, pairs: 12 },
}

const symbols = ['🍎', '🚀', '🎧', '🌟', '📚', '🎲', '🧠', '🦊', '🏀', '🎨', '🌿', '⚡', '🍩', '🎹', '🚲', '🧩']
const HIDE_DELAY_MS = 700
const ROUND_DURATION_MS = 60000

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function createDeck(difficulty: MemoryDifficulty): MemoryCard[] {
  const { pairs } = difficulties[difficulty]
  const deckSymbols = shuffle([...shuffle(symbols).slice(0, pairs), ...shuffle(symbols).slice(0, pairs)])
  return deckSymbols.map((symbol, index) => ({
    id: index,
    symbol,
    revealed: false,
    matched: false,
  }))
}

function formatSeconds(ms: number): number {
  return Math.max(0, Math.floor(ms / 1000))
}

export default function MemoryGame() {
  const navigate = useNavigate()
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>('easy')
  const [cards, setCards] = useState<MemoryCard[]>(() => createDeck('easy'))
  const [selectedCards, setSelectedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  const startTimestampRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const hideTimeoutRef = useRef<number | null>(null)

  const gridTemplateColumns = useMemo(() => {
    const { columns } = difficulties[difficulty]
    const maxColumns = 4
    const effectiveColumns = Math.min(columns, maxColumns)
    return `repeat(${effectiveColumns}, minmax(64px, 1fr))`
  }, [difficulty])

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
      }
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (!isTimerRunning) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    if (timerRef.current !== null) return

    timerRef.current = window.setInterval(() => {
      if (startTimestampRef.current !== null) {
        setElapsedMs(performance.now() - startTimestampRef.current)
      }
    }, 250)

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isTimerRunning])

  const handleNewGame = useCallback(
    (nextDifficulty?: MemoryDifficulty) => {
      const targetDifficulty = nextDifficulty ?? difficulty
      if (targetDifficulty !== difficulty) {
        setDifficulty(targetDifficulty)
      }

      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }

      setCards(createDeck(targetDifficulty))
      setSelectedCards([])
      setMoves(0)
      setElapsedMs(0)
      setIsLocked(false)
      setIsComplete(false)
      setIsTimerRunning(false)
      startTimestampRef.current = null
    },
    [difficulty],
  )

  const finishGame = useCallback(
    (finalMoves: number) => {
      const finalTime = startTimestampRef.current
        ? performance.now() - startTimestampRef.current
        : elapsedMs
      setElapsedMs(finalTime)
      setIsTimerRunning(false)
      setIsComplete(true)
      startTimestampRef.current = null
    },
    [elapsedMs],
  )

  const handleCardClick = (cardId: number) => {
    if (isLocked || isComplete) {
      return
    }

    const card = cards.find((item) => item.id === cardId)
    if (!card || card.revealed || card.matched) {
      return
    }

    if (!isTimerRunning) {
      startTimestampRef.current = performance.now()
      setElapsedMs(0)
      setIsTimerRunning(true)
    }

    const revealedCards = cards.map((item) =>
      item.id === cardId ? { ...item, revealed: true } : item,
    )
    setCards(revealedCards)

    const nextSelected = [...selectedCards, cardId]
    setSelectedCards(nextSelected)

    if (nextSelected.length !== 2) {
      return
    }

    const [firstId, secondId] = nextSelected
    const firstCard = revealedCards.find((item) => item.id === firstId)
    const secondCard = revealedCards.find((item) => item.id === secondId)

    if (!firstCard || !secondCard) {
      setSelectedCards([])
      return
    }

    const nextMoves = moves + 1
    setMoves(nextMoves)

    if (firstCard.symbol === secondCard.symbol) {
      const matchedCards = revealedCards.map((item) =>
        item.id === firstId || item.id === secondId
          ? { ...item, matched: true }
          : item,
      )
      setCards(matchedCards)
      setSelectedCards([])

      const allMatched = matchedCards.every((item) => item.matched)
      if (allMatched) {
        finishGame(nextMoves)
      }

      return
    }

    setIsLocked(true)
    setSelectedCards([])

    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current)
    }

    hideTimeoutRef.current = window.setTimeout(() => {
      setCards((currentCards) =>
        currentCards.map((item) =>
          item.id === firstId || item.id === secondId
            ? { ...item, revealed: false }
            : item,
        ),
      )
      setIsLocked(false)
    }, HIDE_DELAY_MS)
  }

  const summaryLines = useMemo(
    () => [
      `Træk: ${moves}`,
      `Tid: ${formatSeconds(elapsedMs)} sek`,
      `Matched: ${cards.filter((card) => card.matched).length}/${cards.length}`,
    ],
    [cards, elapsedMs, moves],
  )

  const remainingSeconds = useMemo(
    () => Math.max(0, Math.ceil((ROUND_DURATION_MS - elapsedMs) / 1000)),
    [elapsedMs],
  )

  useEffect(() => {
    if (!isTimerRunning) return
    if (ROUND_DURATION_MS - elapsedMs <= 0) {
      setIsTimerRunning(false)
      setIsComplete(true)
      startTimestampRef.current = null
    }
  }, [elapsedMs, isTimerRunning])

  return (
    <GameShell
      title="Memory"
      subtitle="Find alle par"
      isFinished={isComplete}
      summaryLines={summaryLines}
      eyebrowAddon={
        <span aria-live="polite" style={{ fontSize: '0.85rem' }}>
          Tid: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{remainingSeconds}s</strong>
        </span>
      }
      onRestart={() => handleNewGame()}
      onExit={() => navigate('/overview/games')}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: 'min(900px, 100%)',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#e2e8f0' }}>
            Sværhedsgrad
            <select
              value={difficulty}
              onChange={(event) => handleNewGame(event.target.value as MemoryDifficulty)}
              style={{
                appearance: 'none',
                background: '#111827',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                padding: '0.6rem 0.9rem',
                minWidth: '180px',
              }}
            >
              {Object.entries(difficulties).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.columns}x{config.pairs * 2} kort
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns,
            justifyItems: 'stretch',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {cards.map((card) => {
            const isShowing = card.revealed || card.matched
            const ariaLabel = card.matched
              ? `Kort, matchet, ${card.symbol}`
              : card.revealed
                ? `Kort, vist, ${card.symbol}`
                : 'Kort, skjult'

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card.id)}
                disabled={card.matched || card.revealed || isLocked || (!isTimerRunning && isComplete)}
                aria-label={ariaLabel}
                style={{
                  alignItems: 'center',
                  aspectRatio: '1 / 1',
                  background: isShowing ? '#2563eb' : 'rgba(37, 99, 235, 0.12)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '0.9rem',
                  color: isShowing ? '#fff' : '#e2e8f0',
                  cursor: card.matched || card.revealed || isLocked || isComplete ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
                  fontWeight: 700,
                  justifyContent: 'center',
                  minHeight: '64px',
                  minWidth: '44px',
                  outlineOffset: 4,
                  transition: 'transform 0.2s ease, background 0.2s ease, color 0.2s ease',
                }}
              >
                <span aria-hidden="true">{isShowing ? card.symbol : ''}</span>
              </button>
            )
          })}
        </div>
      </div>
    </GameShell>
  )
}
