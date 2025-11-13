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
  { symbol: '−', apply: (a, b) => a - b, range: [3, 18] },
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

export default function MindMathGame() {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [timeLeft, setTimeLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [level, setLevel] = useState(1)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [feedback, setFeedback] = useState('Sæt gang i træningen for at udfordre dit regnehoved.')
  const [bestScore, setBestScore] = useState(0)
  const [answers, setAnswers] = useState(0)

  useEffect(() => {
    if (status !== 'running') {
      return
    }

    if (timeLeft <= 0) {
      setStatus('finished')
      setFeedback('Tiden er gået! Hvor mange kunne du nå?')
      setBestScore((previous) => Math.max(previous, score))
      return
    }

    const id = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1)
    }, 1000)

    return () => window.clearTimeout(id)
  }, [score, status, timeLeft])

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

  const startGame = () => {
    setStatus('running')
    setTimeLeft(60)
    setScore(0)
    setMistakes(0)
    setLevel(1)
    setAnswers(0)
    setFeedback('Vurder om regnestykket er korrekt så hurtigt som muligt.')
    nextChallenge(1)
  }

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
  }

  return (
    <div className="mind-math-game">
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
          <button
            type="button"
            className="menu__primary-button"
            onClick={startGame}
            disabled={status === 'running'}
          >
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

      <aside className="game-scoreboard mind-math-game__scoreboard">
        <h2 className="game-scoreboard__title">Resultater</h2>
        <dl className="game-scoreboard__rows">
          <div className="game-scoreboard__row">
            <dt>Aktuel score</dt>
            <dd>{score}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Bedste score</dt>
            <dd>{bestScore}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Præcision</dt>
            <dd>{answers === 0 ? '-' : `${accuracy}%`}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Fejl</dt>
            <dd>{mistakes}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Nuværende tempo</dt>
            <dd>Level {level}</dd>
          </div>
        </dl>
        <p className="mind-math-game__hint">
          Mind Math bygger på mental aritmetik fra Peak-universet. Besvar rigtigt i træk for at øge
          tempoet og skærpe din numeriske fleksibilitet.
        </p>
      </aside>
    </div>
  )
}
