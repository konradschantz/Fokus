import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createDefaultHighscores,
  loadHighscores,
  saveHighscores,
  type MemoryDifficulty,
  type MemoryHighscores,
} from '../utils/memoryHighscores'
import BrandLogo from '../components/BrandLogo'

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

interface ToneOptions {
  type: OscillatorType
  startFrequency: number
  endFrequency?: number
  duration: number
  volume?: number
  startDelay?: number
}

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
  const [highscores, setHighscores] = useState<MemoryHighscores>(() =>
    createDefaultHighscores(),
  )
  const [lastMismatch, setLastMismatch] = useState<{ first: number; second: number } | null>(
    null,
  )

  const startTimestampRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const hasPlayedStartSoundRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const fetchHighscores = async () => {
      const remoteHighscores = await loadHighscores()
      if (isMounted) {
        setHighscores(remoteHighscores)
      }
    }

    void fetchHighscores()

    return () => {
      isMounted = false
    }
  }, [])

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextCtor) {
      return null
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor()
    }

    return audioContextRef.current
  }, [])

  const playTone = useCallback(
    ({ type, startFrequency, endFrequency, duration, volume = 0.2, startDelay = 0 }: ToneOptions) => {
      const context = getAudioContext()
      if (!context) {
        return
      }

      if (context.state === 'suspended') {
        void context.resume().catch(() => {})
      }

      const safeStartFrequency = Math.max(20, startFrequency)
      const safeEndFrequency = Math.max(20, endFrequency ?? startFrequency)
      const now = context.currentTime + Math.max(0, startDelay)

      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = type
      oscillator.frequency.setValueAtTime(safeStartFrequency, now)
      if (safeEndFrequency !== safeStartFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(safeEndFrequency, now + duration)
      }

      const initialGain = 0.0001
      const peakGain = Math.max(initialGain, Math.min(1, volume))

      gain.gain.setValueAtTime(initialGain, now)
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(initialGain, now + duration)

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.start(now)
      oscillator.stop(now + duration + 0.05)
    },
    [getAudioContext],
  )

  const playCardClickSound = useCallback(() => {
    playTone({
      type: 'sine',
      startFrequency: 520,
      endFrequency: 660,
      duration: 0.18,
      volume: 0.25,
    })
  }, [playTone])

  const playGameStartSound = useCallback(() => {
    playTone({
      type: 'triangle',
      startFrequency: 440,
      endFrequency: 660,
      duration: 0.22,
      volume: 0.3,
    })
    playTone({
      type: 'triangle',
      startFrequency: 660,
      endFrequency: 880,
      duration: 0.24,
      volume: 0.24,
      startDelay: 0.2,
    })
  }, [playTone])

  const playGameCompleteSound = useCallback(() => {
    playTone({
      type: 'sine',
      startFrequency: 660,
      endFrequency: 990,
      duration: 0.28,
      volume: 0.28,
    })
    playTone({
      type: 'sine',
      startFrequency: 990,
      endFrequency: 1320,
      duration: 0.32,
      volume: 0.26,
      startDelay: 0.26,
    })
    playTone({
      type: 'triangle',
      startFrequency: 1320,
      endFrequency: 880,
      duration: 0.36,
      volume: 0.22,
      startDelay: 0.52,
    })
  }, [playTone])

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
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
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
    hasPlayedStartSoundRef.current = false
    playGameStartSound()
    hasPlayedStartSoundRef.current = true
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
        void saveHighscores(next)
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
    hasPlayedStartSoundRef.current = false
    playGameCompleteSound()
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
      if (!hasPlayedStartSoundRef.current) {
        playGameStartSound()
        hasPlayedStartSoundRef.current = true
      }
    }

    playCardClickSound()

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
    <section className="menu game-page memory-game">
      <div className="menu__top-bar">
        <BrandLogo size={64} wordmarkSize="1.75rem" />
        <button type="button" className="menu__back-button" onClick={() => navigate('/')}>
          Tilbage til menu
        </button>
      </div>
      <header className="menu__header" style={{ marginBottom: '0.5rem' }}>
        <h1>Memory</h1>
        <p>Vend kortene og find alle par hurtigst muligt.</p>
      </header>

      <div className="game-page__grid memory-game__layout">
        <div className="memory-game__content">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'space-between',
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
                  cursor:
                    !lastMismatch || isLocked || isComplete || selectedCards.length > 0
                      ? 'not-allowed'
                      : 'pointer',
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
              <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Match status</strong>
              {cards.filter((card) => card.matched).length} / {cards.length}
            </div>
          </div>

          {isComplete && (
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                borderRadius: '1rem',
                color: '#047857',
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
        </div>

        <aside className="game-scoreboard">
          <h2 className="game-scoreboard__title">Scoreboard</h2>
          <dl className="game-scoreboard__rows">
            <div className="game-scoreboard__row">
              <dt>Færreste træk</dt>
              <dd>{currentHighscore.bestMoves !== null ? currentHighscore.bestMoves : '–'}</dd>
            </div>
            <div className="game-scoreboard__row">
              <dt>Hurtigste tid</dt>
              <dd>
                {currentHighscore.bestTimeMs !== null
                  ? `${formatSeconds(currentHighscore.bestTimeMs)} s`
                  : '–'}
              </dd>
            </div>
          </dl>
          <p className="game-scoreboard__footnote">
            Resultaterne gemmes pr. sværhedsgrad via Vercel KV, så du kan
            gense dine bedste præstationer.
          </p>
        </aside>
      </div>
    </section>
  )
}
