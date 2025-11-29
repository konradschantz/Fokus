import { useCallback, useEffect, useMemo, useState } from 'react'
import { shuffle } from '../../utils/shuffle'
import './MindMathGame.css'

type GameStatus = 'idle' | 'running' | 'finished'

type Operation = {
  symbol: string
  apply: (a: number, b: number) => number
  range: [number, number]
}

type Challenge = {
  prompt: string
  isCorrect: boolean
}

const operations: Operation[] = [
  { symbol: '+', apply: (a, b) => a + b, range: [3, 24] },
  { symbol: '-', apply: (a, b) => a - b, range: [3, 18] },
  { symbol: '×', apply: (a, b) => a * b, range: [2, 12] },
]

function createOperands(range: [number, number]): [number, number] {
  const [min, max] = range
  const a = Math.floor(Math.random() * (max - min + 1)) + min
  const b = Math.floor(Math.random() * (max - min + 1)) + min
  return [a, b]
}

function createChallenge(level: number): Challenge {
  const weightedOperations = shuffle([...operations, ...(level > 6 ? operations : [])])
  const operation = weightedOperations[Math.floor(Math.random() * weightedOperations.length)]
  const [a, b] = createOperands(operation.range)
  const result = operation.apply(a, b)
  const shouldBeCorrect = Math.random() < 0.55
  let displayed = result

  if (!shouldBeCorrect) {
    const offsetOptions = shuffle([-3, -2, -1, 1, 2, 3, 4])
    displayed = result + offsetOptions[0]
  }

  return {
    prompt: `${a} ${operation.symbol} ${b} = ${displayed}`,
    isCorrect: shouldBeCorrect,
  }
}

type MindMathGameProps = {
  startSignal?: number
  onFinished?: (summary: { score: number; bestScore: number; accuracy: number; mistakes: number }) => void
}

export default function MindMathGame({ startSignal, onFinished }: MindMathGameProps) {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [timeLeft, setTimeLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [level, setLevel] = useState(1)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [feedback, setFeedback] = useState('Sæt gang i træningen for at udfordre dit regnehoved.')
  const [bestScore, setBestScore] = useState(0)
  const [answers, setAnswers] = useState(0)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    if (status !== 'running') {
      return
    }

    if (timeLeft <= 0) {
      setStatus('finished')
      setFeedback('Tiden er gået! Hvor mange kunne du nå?')
      setBestScore((previous) => Math.max(previous, score))
      setIsFinished(true)
      onFinished?.({
        score,
        bestScore: Math.max(bestScore, score),
        accuracy: answers === 0 ? 0 : Math.round((score / answers) * 100),
        mistakes,
      })
      return
    }

    const id = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1)
    }, 1000)

    return () => window.clearTimeout(id)
  }, [answers, bestScore, mistakes, onFinished, score, status, timeLeft])

  const accuracy = useMemo(() => {
    if (answers === 0) {
      return 0
    }
    return Math.round((score / answers) * 100)
  }, [answers, score])

  const nextChallenge = useCallback(
    (nextLevel: number) => {
      setChallenge(createChallenge(nextLevel))
    },
    [],
  )

  const startGame = useCallback(() => {
    setStatus('running')
    setTimeLeft(60)
    setScore(0)
    setMistakes(0)
    setLevel(1)
    setAnswers(0)
    setFeedback('Vurder om regnestykket er korrekt så hurtigt som muligt.')
    setIsFinished(false)
    nextChallenge(1)
  }, [nextChallenge])

  useEffect(() => {
    if (typeof startSignal === 'number') {
      startGame()
    }
  }, [startSignal, startGame])

  const handleAnswer = (isCorrect: boolean) => {
    if (status !== 'running' || challenge === null) {
      return
    }

    setAnswers((previous) => previous + 1)

    if (isCorrect === challenge.isCorrect) {
      setScore((previous) => previous + 1)
      setLevel((previous) => previous + 1)
      setFeedback('Korrekt! Tempoet stiger.')
      nextChallenge(level + 1)
    } else {
      setMistakes((previous) => previous + 1)
      setLevel((previous) => Math.max(1, previous - 1))
      setFeedback('Forkert. Tag en dyb indånding og prøv igen.')
      nextChallenge(Math.max(1, level - 1))
    }
  }

  const resetGame = () => {
    setStatus('idle')
    setTimeLeft(60)
    setScore(0)
    setMistakes(0)
    setLevel(1)
    setFeedback('Sæt gang i træningen for at udfordre dit regnehoved.')
    setChallenge(null)
    setAnswers(0)
    setIsFinished(false)
  }

  return (
    <div className="mind-math-game mind-math-game--immersive">
      <div className="mind-math-game__stage">
        <p className="mind-math-game__status" role="status">
          {feedback}
        </p>

        <div className="mind-math-game__timer" aria-live="polite">
          <span className="mind-math-game__timer-label">Tid tilbage</span>
          <span className={`mind-math-game__timer-value ${timeLeft <= 10 ? 'is-critical' : ''}`}>
            {timeLeft}s
          </span>
        </div>

        <div className="mind-math-game__challenge" aria-live="assertive">
          <span>{challenge?.prompt ?? 'Klar?'}</span>
        </div>

        <div className="mind-math-game__actions">
          <button type="button" className="menu__primary-button" onClick={startGame} disabled={status === 'running'}>
            Start Mind Math
          </button>
          <button type="button" className="menu__secondary-button" onClick={resetGame}>
            Nulstil
          </button>
        </div>

        <div className="mind-math-game__answer-buttons">
          <button
            type="button"
            className="mind-math-game__answer mind-math-game__answer--correct"
            onClick={() => handleAnswer(true)}
            disabled={status !== 'running'}
          >
            Korrekt
          </button>
          <button
            type="button"
            className="mind-math-game__answer mind-math-game__answer--incorrect"
            onClick={() => handleAnswer(false)}
            disabled={status !== 'running'}
          >
            Forkert
          </button>
        </div>
      </div>

      <div className="mind-math-game__score">
        <div>
          <span>Score</span>
          <strong>{score}</strong>
        </div>
        <div>
          <span>Bedste</span>
          <strong>{Math.max(bestScore, score)}</strong>
        </div>
        <div>
          <span>Præcision</span>
          <strong>{answers === 0 ? '-' : `${accuracy}%`}</strong>
        </div>
        <div>
          <span>Fejl</span>
          <strong>{mistakes}</strong>
        </div>
      </div>
    </div>
  )
}
