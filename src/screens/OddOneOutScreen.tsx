import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import motion from 'framer-motion'
import BrandLogo from '../components/BrandLogo'
import OddOneOutGame from '../games/oddoneout/OddOneOutGame'
import {
  getOddOneOutScores,
  type OddOneOutScoreEntry,
} from '../utils/oddOneOutScores'
import './OddOneOutScreen.css'

function formatScoreTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OddOneOutScreen() {
  const navigate = useNavigate()
  const [scores, setScores] = useState<OddOneOutScoreEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasFinished, setHasFinished] = useState(false)
  const [lastScore, setLastScore] = useState<number | null>(null)

  const refreshScores = useCallback(async () => {
    setIsLoading(true)
    const nextScores = await getOddOneOutScores(5)
    setScores(nextScores)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void refreshScores()
  }, [refreshScores])

  const handleGameFinished = useCallback(
    (score: number) => {
      setHasFinished(true)
      setLastScore(score)
      void refreshScores()
    },
    [refreshScores],
  )

  const handleScoreSubmitted = useCallback(() => {
    void refreshScores()
  }, [refreshScores])

  return (
    <section className="menu game-page odd-one-out">
      <div className="menu__top-bar">
        <BrandLogo size={64} wordmarkSize="1.75rem" />
        <button type="button" className="menu__back-button" onClick={() => navigate('/')}>
          Tilbage til menu
        </button>
      </div>

      <header className="menu__header odd-one-out__header">
        <h1>Odd One Out</h1>
        <p>Find figuren, der skiller sig subtilt ud fra de andre, før tiden løber ud.</p>
      </header>

      <div className="game-page__grid odd-one-out__layout">
        <OddOneOutGame
          onGameFinished={handleGameFinished}
          onScoreSubmitted={handleScoreSubmitted}
        />

        <motion.aside
          className="odd-one-out__scoreboard"
          initial={{ opacity: 0, transform: 'translateY(12px)' }}
          animate={{ opacity: 1, transform: 'translateY(0)' }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          <div className="odd-one-out__scoreboard-header">
            <div>
              <h2 className="odd-one-out__scoreboard-title">Highscore</h2>
              <p className="odd-one-out__scoreboard-description">
                {hasFinished
                  ? 'De bedste resultater fra Fokus-fællesskabet opdateres automatisk her.'
                  : 'Afslut et spil for at se de aktuelle topresultater og gemme dit eget.'}
              </p>
            </div>
            {lastScore !== null ? (
              <span className="odd-one-out__last-score">Din seneste score: {lastScore}</span>
            ) : null}
          </div>

          {isLoading ? (
            <p className="odd-one-out__scoreboard-hint">Indlæser highscores…</p>
          ) : scores.length === 0 ? (
            <p className="odd-one-out__scoreboard-hint">
              Ingen gemte resultater endnu. Vær den første til at sætte en rekord!
            </p>
          ) : (
            <ol className="odd-one-out__scores">
              {scores.map((entry, index) => (
                <li key={`${entry.name}-${entry.ts}`} className="odd-one-out__score-row">
                  <div className="odd-one-out__score-left">
                    <span className="odd-one-out__score-rank">#{index + 1}</span>
                    <span className="odd-one-out__score-name">{entry.name}</span>
                  </div>
                  <div className="odd-one-out__score-right">
                    <span className="odd-one-out__score-points">{entry.score} point</span>
                    <span>{formatScoreTimestamp(entry.ts)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <p className="odd-one-out__scoreboard-footnote">
            Highscoren opdateres automatisk, når du gemmer et resultat.
          </p>
        </motion.aside>
      </div>
    </section>
  )
}
