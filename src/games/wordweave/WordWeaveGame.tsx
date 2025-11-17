import { useEffect, useMemo, useRef, useState } from 'react'
import { shuffle } from '../../utils/shuffle'
import './WordWeaveGame.css'

type GameStatus = 'idle' | 'active' | 'review' | 'finished'

type WordPrompt = {
  word: string
  correct: string
  distractors: string[]
}

const TOTAL_ROUNDS = 10

const prompts: WordPrompt[] = [
  {
    word: 'Adaptiv',
    correct: 'omstillingsparat',
    distractors: ['fastlåst', 'ufleksibel', 'stiv'],
  },
  {
    word: 'Analytisk',
    correct: 'systematisk',
    distractors: ['impulsiv', 'kaotisk', 'følelsesstyret'],
  },
  {
    word: 'Resonere',
    correct: 'reflektere',
    distractors: ['gætte', 'improvisere', 'kopiere'],
  },
  {
    word: 'Abstraktion',
    correct: 'begrebsliggørelse',
    distractors: ['detaljering', 'sansning', 'rutine'],
  },
  {
    word: 'Deduktion',
    correct: 'slutning',
    distractors: ['indsamling', 'fornemmelse', 'skabelse'],
  },
  {
    word: 'Intuitiv',
    correct: 'mavefornemmelsesstyret',
    distractors: ['dokumenterende', 'afventende', 'overanalyserende'],
  },
  {
    word: 'Syntese',
    correct: 'sammensmeltning',
    distractors: ['opdeling', 'afvisning', 'gentagelse'],
  },
  {
    word: 'Fokuseret',
    correct: 'målrettet',
    distractors: ['spredt', 'rastløs', 'tilfældig'],
  },
  {
    word: 'Strategisk',
    correct: 'langsigtet',
    distractors: ['spontan', 'øjebliksorienteret', 'tilfældig'],
  },
  {
    word: 'Modulere',
    correct: 'finjustere',
    distractors: ['fastlåse', 'ignorere', 'overdrive'],
  },
  {
    word: 'Dynamisk',
    correct: 'foranderlig',
    distractors: ['stagnant', 'passiv', 'monoton'],
  },
  {
    word: 'Konsensus',
    correct: 'fælles enighed',
    distractors: ['solobeslutning', 'lotteri', 'konfrontation'],
  },
]

const roundsToPlay = Math.min(TOTAL_ROUNDS, prompts.length)

export default function WordWeaveGame() {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [roundOrder, setRoundOrder] = useState<number[]>([])
  const [roundIndex, setRoundIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('Start Word Weave og match præcise synonymer.')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const timeoutRef = useRef<number | null>(null)

  const currentPrompt = useMemo(() => {
    if (status === 'idle' || roundOrder.length === 0) {
      return null
    }
    return prompts[roundOrder[roundIndex]]
  }, [roundIndex, roundOrder, status])

  useEffect(() => {
    if (status === 'active' && currentPrompt) {
      setOptions(shuffle([currentPrompt.correct, ...currentPrompt.distractors]))
      setSelected(null)
    }
  }, [currentPrompt, status])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const startGame = () => {
    const order = shuffle(Array.from({ length: prompts.length }, (_, index) => index)).slice(
      0,
      roundsToPlay,
    )
    setRoundOrder(order)
    setRoundIndex(0)
    setScore(0)
    setStreak(0)
    setFeedback('Vælg det ord, der matcher betydningen tættest.')
    setStatus('active')
  }

  const goToSummary = (finalScore: number) => {
    setStatus('finished')
    setBestScore((previous) => Math.max(previous, finalScore))
    setFeedback('Runden er slut. Start en ny for at væve endnu flere synonymforbindelser.')
  }

  const handleSelect = (option: string) => {
    if (status !== 'active' || currentPrompt === null || selected !== null) {
      return
    }

    const isCorrect = option === currentPrompt.correct
    const nextScore = isCorrect ? score + 1 : score
    const nextStreak = isCorrect ? streak + 1 : 0

    setSelected(option)
    setScore(nextScore)
    setStreak(nextStreak)
    setBestStreak((previous) => Math.max(previous, nextStreak))
    setFeedback(
      isCorrect
        ? 'Korrekt! Din sproglige radar er skarp.'
        : `Næsten! Det korrekte synonym er: ${currentPrompt.correct}.`,
    )
    setStatus('review')

    timeoutRef.current = window.setTimeout(() => {
      const nextIndex = roundIndex + 1
      if (nextIndex >= roundsToPlay) {
        goToSummary(nextScore)
      } else {
        setRoundIndex(nextIndex)
        setStatus('active')
        setFeedback('Fortsæt og vælg det næste præcise synonym.')
      }
    }, 1300)
  }

  const resetGame = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
    setStatus('idle')
    setRoundOrder([])
    setRoundIndex(0)
    setOptions([])
    setSelected(null)
    setScore(0)
    setStreak(0)
    setFeedback('Start Word Weave og match præcise synonymer.')
  }

  return (
    <div className="word-weave-game">
      <div className="word-weave-game__stage">
        <p className="word-weave-game__status" role="status">
          {feedback}
        </p>

        <div className="word-weave-game__prompt" aria-live="polite">
          <span className="word-weave-game__label">Nøgleord</span>
          <strong className="word-weave-game__word">{currentPrompt?.word ?? 'Klar?'}</strong>
        </div>

        <div className="word-weave-game__options" role="list">
          {options.map((option) => {
            const isChosen = selected === option
            const isCorrect = currentPrompt?.correct === option
            const optionState =
              selected === null
                ? ''
                : isCorrect
                  ? 'is-correct'
                  : isChosen
                    ? 'is-incorrect'
                    : ''

            return (
              <button
                key={option}
                type="button"
                className={`word-weave-game__option ${optionState}`}
                onClick={() => handleSelect(option)}
                disabled={status !== 'active'}
              >
                {option}
              </button>
            )
          })}
        </div>

        <div className="word-weave-game__actions">
          <button
            type="button"
            className="menu__primary-button"
            onClick={startGame}
            disabled={status === 'active'}
          >
            Start Word Weave
          </button>
          <button type="button" className="menu__secondary-button" onClick={resetGame}>
            Nulstil
          </button>
        </div>
      </div>

      <aside className="game-scoreboard word-weave-game__scoreboard">
        <h2 className="game-scoreboard__title">Sprogdata</h2>
        <dl className="game-scoreboard__rows">
          <div className="game-scoreboard__row">
            <dt>Score</dt>
            <dd>{score}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Bedste score</dt>
            <dd>{bestScore}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Streak</dt>
            <dd>{streak}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Bedste streak</dt>
            <dd>{bestStreak}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Runde</dt>
            <dd>
              {status === 'idle'
                ? '-'
                : `${Math.min(roundIndex + 1, roundsToPlay)} / ${roundsToPlay}`}
            </dd>
          </div>
        </dl>
        <p className="word-weave-game__hint">
          Word Weave træner din semantiske smidighed. Spot det stærkeste synonym og udbyg
          forbindelserne i dit ordforråd.
        </p>
      </aside>
    </div>
  )
}
