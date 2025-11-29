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
  { word: 'Adaptiv', correct: 'omstillingsparat', distractors: ['fastlåst', 'ufleksibel', 'stiv'] },
  { word: 'Analytisk', correct: 'systematisk', distractors: ['impulsiv', 'kaotisk', 'følelsesstyret'] },
  { word: 'Resonere', correct: 'reflektere', distractors: ['gætte', 'improvisere', 'kopiere'] },
  { word: 'Abstraktion', correct: 'begrebsliggørelse', distractors: ['detaljering', 'sansning', 'rutine'] },
  { word: 'Deduktion', correct: 'slutning', distractors: ['indsamling', 'fornemmelse', 'skabelse'] },
  { word: 'Intuitiv', correct: 'mavefornemmelsesstyret', distractors: ['dokumenterende', 'afventende', 'overanalyserende'] },
  { word: 'Syntese', correct: 'sammensmeltning', distractors: ['opdeling', 'afvisning', 'gentagelse'] },
  { word: 'Fokuseret', correct: 'målrettet', distractors: ['spredt', 'rastløs', 'tilfældig'] },
  { word: 'Strategisk', correct: 'langsigtet', distractors: ['spontan', 'øjebliksorienteret', 'tilfældig'] },
  { word: 'Modulere', correct: 'finjustere', distractors: ['fastlåse', 'ignorere', 'overdrive'] },
  { word: 'Dynamisk', correct: 'foranderlig', distractors: ['stagnant', 'passiv', 'monoton'] },
  { word: 'Konsensus', correct: 'fælles enighed', distractors: ['solobeslutning', 'lotteri', 'konfrontation'] },
]

const roundsToPlay = Math.min(TOTAL_ROUNDS, prompts.length)

type WordWeaveGameProps = {
  startSignal?: number
  onFinished?: (summary: { score: number; bestScore: number; bestStreak: number; round: number }) => void
}

export default function WordWeaveGame({ startSignal, onFinished }: WordWeaveGameProps) {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [roundOrder, setRoundOrder] = useState<number[]>([])
  const [roundIndex, setRoundIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [feedback, setFeedback] = useState('Start Word Weave og match præcise synonymer.')
  const [bestScore, setBestScore] = useState(0)

  const timeoutRef = useRef<number | null>(null)

  const currentPrompt = useMemo(() => {
    if (roundOrder.length === 0) {
      return null
    }
    return prompts[roundOrder[roundIndex]]
  }, [roundIndex, roundOrder])

  useEffect(() => {
    if (typeof startSignal === 'number') {
      startGame()
    }
  }, [startSignal])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (status !== 'active') {
      return
    }

    if (currentPrompt) {
      const choices = shuffle([currentPrompt.correct, ...currentPrompt.distractors])
      setOptions(choices)
      setSelected(null)
    }
  }, [currentPrompt, status])

  const startGame = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }

    const order = shuffle(Array.from({ length: roundsToPlay }, (_, index) => index))
    setRoundOrder(order)
    setRoundIndex(0)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setStatus('active')
    setFeedback('Find det mest præcise synonym.')
  }

  const handleSelect = (option: string) => {
    if (status !== 'active' || !currentPrompt || selected !== null) {
      return
    }

    setSelected(option)
    const isCorrect = option === currentPrompt.correct

    if (isCorrect) {
      setScore((prev) => prev + 1)
      setStreak((prev) => {
        const next = prev + 1
        setBestStreak((best) => Math.max(best, next))
        return next
      })
      setFeedback('Korrekt! Fortsæt flowet.')
    } else {
      setStreak(0)
      setFeedback(`Rigtig: ${currentPrompt.correct}`)
    }

    timeoutRef.current = window.setTimeout(() => {
      const nextRound = roundIndex + 1
      if (nextRound >= roundsToPlay) {
        setStatus('finished')
        setBestScore((prev) => Math.max(prev, isCorrect ? score + 1 : score))
        onFinished?.({
          score: isCorrect ? score + 1 : score,
          bestScore: Math.max(bestScore, isCorrect ? score + 1 : score),
          bestStreak: Math.max(bestStreak, isCorrect ? streak + 1 : streak),
          round: roundsToPlay,
        })
        return
      }

      setRoundIndex(nextRound)
      setFeedback('Vælg næste synonym.')
    }, 950)
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
    <div className="word-weave-game word-weave-game--immersive">
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
          <button type="button" className="menu__primary-button" onClick={startGame} disabled={status === 'active'}>
            Start Word Weave
          </button>
          <button type="button" className="menu__secondary-button" onClick={resetGame}>
            Nulstil
          </button>
        </div>
      </div>

      <div className="word-weave-game__score">
        <div>
          <span>Score</span>
          <strong>{score}</strong>
        </div>
        <div>
          <span>Bedste score</span>
          <strong>{Math.max(bestScore, score)}</strong>
        </div>
        <div>
          <span>Streak</span>
          <strong>{streak}</strong>
        </div>
        <div>
          <span>Bedste streak</span>
          <strong>{bestStreak}</strong>
        </div>
        <div>
          <span>Runde</span>
          <strong>
            {status === 'idle' ? '-' : `${Math.min(roundIndex + 1, roundsToPlay)} / ${roundsToPlay}`}
          </strong>
        </div>
      </div>
    </div>
  )
}
