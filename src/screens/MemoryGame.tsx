import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loadHighscores,
  saveHighscores,
  type MemoryDifficulty,
  type MemoryHighscores,
} from '../utils/memoryHighscores'

interface MemoryCard {
  id: number
  symbol: string
  revealed: boolean
  matched: boolean
}

interface DifficultyConfig {
  label: string
  columns: number
  pairs: number
}

const difficulties: Record<MemoryDifficulty, DifficultyConfig> = {
  easy: { label: 'Let (4 × 4)', columns: 4, pairs: 8 },
  medium: { label: 'Mellem (5 × 4)', columns: 5, pairs: 10 },
  hard: { label: 'Svær (6 × 4)', columns: 6, pairs: 12 },
}

const symbols = [
  '🍎',
  '🍌',
  '🍇',
  '🍉',
  '🍓',
  '🥑',
  '🥕',
  '🍄',
  '🍔',
  '🍕',
  '🍣',
  '🍩',
  '⚽',
  '🚗',
  '✈️',
  '🎧',
  '📚',
  '🧩',
]

const HIDE_DELAY_MS = 700

function shuffle<T>(list: T[]): T[] {
  const array = [...list]
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[array[index], array[randomIndex]] = [array[randomIndex], array[index]]
  }
  return array
}

function createDeck(difficulty: MemoryDifficulty): MemoryCard[] {
  const { pairs } = difficulties[difficulty]
  const availableSymbols = shuffle(symbols)
  const selectedSymbols = availableSymbols.slice(0, pairs)
  const deckSymbols = shuffle([...selectedSymbols, ...selectedSymbols])
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
  const [highscores, setHighscores] = useState<MemoryHighscores>(() => loadHighscores())
  const [lastMismatch, setLastMismatch] = useState<{ first: number; second: number } | null>(
    null,
  )

  const startTimestampRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    if (!isTimerRunning) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    if (timerRef.current !== null) {
      return
    }

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

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
      }
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  const currentHighscore = highscores[difficulty]

  const gridTemplateColumns = useMemo(() => {
    const { columns } = difficulties[difficulty]
    return `repeat(${columns}, minmax(64px, 1fr))`
  }, [difficulty])

  const handleNewGame = (nextDifficulty?: MemoryDifficulty) => {
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
    setLastMismatch(null)
    setIsTimerRunning(false)
    startTimestampRef.current = null
  }

  const updateHighscores = (movesCount: number, timeMs: number, finishedDifficulty: MemoryDifficulty) => {
    setHighscores((previous) => {
      const next: MemoryHighscores = {
        easy: { ...previous.easy },
        medium: { ...previous.medium },
        hard: { ...previous.hard },
      }

      const entry = next[finishedDifficulty]
      let hasChanged = false

      if (entry.bestMoves === null || movesCount < entry.bestMoves) {
        entry.bestMoves = movesCount
        hasChanged = true
      }

      if (entry.bestTimeMs === null || timeMs < entry.bestTimeMs) {
        entry.bestTimeMs = timeMs
        hasChanged = true
      }

      if (hasChanged) {
        saveHighscores(next)
        return next
      }

      return previous
    })
  }

  const finishGame = (finalMoves: number) => {
    const finalTime = startTimestampRef.current
      ? performance.now() - startTimestampRef.current
      : elapsedMs
    setElapsedMs(finalTime)
    setIsTimerRunning(false)
    setIsComplete(true)
    startTimestampRef.current = null
    updateHighscores(finalMoves, finalTime, difficulty)
  }

  const handleCardClick = (cardId: number) => {
    if (isLocked || isComplete) {
      return
    }

    const card = cards.find((item) => item.id === cardId)
    if (!card || card.revealed || card.matched) {
      return
    }

    if (selectedCards.length === 0 && lastMismatch) {
      setLastMismatch(null)
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
      setLastMismatch({ first: firstId, second: secondId })
    }, HIDE_DELAY_MS)
  }

  const handleUndo = () => {
    if (!lastMismatch || isLocked || isComplete || selectedCards.length > 0) {
      return
    }

    const { first } = lastMismatch
    setLastMismatch(null)
    setMoves((previous) => (previous > 0 ? previous - 1 : 0))
    setIsLocked(false)
    setCards((currentCards) =>
      currentCards.map((card) =>
        card.id === first ? { ...card, revealed: true } : card,
      ),
    )
    setSelectedCards([first])

    if (!isTimerRunning) {
      startTimestampRef.current = performance.now() - elapsedMs
      setIsTimerRunning(true)
    }
  }

  const handleDifficultyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextDifficulty = event.target.value as MemoryDifficulty
    handleNewGame(nextDifficulty)
  }

  return (
    <section
      className="menu"
      style={{
        position: 'relative',
        width: 'min(960px, 100%)',
      }}
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '999px',
          color: '#fff',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '0.9rem',
          fontWeight: 600,
          padding: '0.5rem 1.25rem',
          position: 'absolute',
          right: '1rem',
          top: '1rem',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        }}
      >
        Tilbage til menu
      </button>
      <header className="menu__header" style={{ marginBottom: '1.25rem' }}>
        <h1>Memory</h1>
        <p>Vend kortene og find alle par hurtigst muligt.</p>
      </header>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          rowGap: '1rem',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 600 }}>
          Sværhedsgrad
          <select
            value={difficulty}
            onChange={handleDifficultyChange}
            style={{
              appearance: 'none',
              backgroundImage: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              border: '1px solid rgba(30, 64, 175, 0.75)',
              borderRadius: '0.75rem',
              boxShadow: '0 6px 12px rgba(37, 99, 235, 0.25)',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '0.65rem 1rem',
              maxWidth: '200px',
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            }}
            onFocus={(event) => {
              event.currentTarget.style.boxShadow = '0 10px 18px rgba(37, 99, 235, 0.35)'
              event.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onBlur={(event) => {
              event.currentTarget.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.25)'
              event.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {Object.entries(difficulties).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleNewGame()}
            style={{
              background: '#312e81',
              border: 'none',
              borderRadius: '999px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              padding: '0.65rem 1.5rem',
            }}
          >
            Nyt spil
          </button>
          <button
            type="button"
            onClick={handleUndo}
            disabled={!lastMismatch || isLocked || isComplete || selectedCards.length > 0}
            style={{
              background: '#64748b',
              border: 'none',
              borderRadius: '999px',
              color: '#fff',
              cursor: !lastMismatch || isLocked || isComplete || selectedCards.length > 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity:
                !lastMismatch || isLocked || isComplete || selectedCards.length > 0 ? 0.5 : 1,
              padding: '0.65rem 1.5rem',
              transition: 'opacity 0.2s ease',
            }}
          >
            Fortryd sidste træk
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '1.25rem',
          fontSize: '1.05rem',
        }}
      >
        <div>
          <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Træk</strong>
          {moves}
        </div>
        <div>
          <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Tid</strong>
          {formatSeconds(elapsedMs)} s
        </div>
        <div>
          <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Highscore</strong>
          {currentHighscore.bestMoves !== null && currentHighscore.bestTimeMs !== null ? (
            <span>
              {currentHighscore.bestMoves} træk · {formatSeconds(currentHighscore.bestTimeMs)} s
            </span>
          ) : (
            <span>–</span>
          )}
        </div>
      </div>

      {isComplete && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            borderRadius: '1rem',
            color: '#047857',
            marginBottom: '1.25rem',
            padding: '1rem 1.25rem',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Godt klaret!</strong>
          Du fandt alle par på {moves} træk og {formatSeconds(elapsedMs)} sekunder.
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns,
          justifyItems: 'stretch',
          margin: '0 auto',
          maxWidth: 'min(640px, 100%)',
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
              disabled={card.matched || card.revealed || isLocked}
              aria-label={ariaLabel}
              style={{
                alignItems: 'center',
                aspectRatio: '1 / 1',
                background: isShowing ? '#4f46e5' : 'rgba(79, 70, 229, 0.12)',
                border: '1px solid rgba(79, 70, 229, 0.3)',
                borderRadius: '0.9rem',
                color: isShowing ? '#fff' : '#312e81',
                cursor: card.matched || card.revealed || isLocked ? 'not-allowed' : 'pointer',
                display: 'flex',
                fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
                fontWeight: 600,
                justifyContent: 'center',
                minHeight: '64px',
                minWidth: '44px',
                outlineOffset: 4,
                transition: 'transform 0.2s ease, background 0.2s ease, color 0.2s ease',
              }}
            >
              <span aria-hidden="true">{isShowing ? card.symbol : '❓'}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
