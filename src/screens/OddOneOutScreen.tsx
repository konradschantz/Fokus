import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
        <BrandLogo size={64} wordmarkSize="1.75rem" wordmarkText="Odd One Out" />
        <button type="button" className="menu__back-button" onClick={() => navigate('/')}>
          Tilbage til menu
        </button>
      </div>

      <header className="menu__header odd-one-out__header">
        <h1>Odd One Out</h1>
        <p>
          Find figuren, der skiller sig ud fra mængden på tid. Spillet starter blødt og bliver gradvist
          mere udfordrende, efterhånden som gridet vokser.
        </p>
      </header>

      <div className="game-page__grid odd-one-out__layout">
        <OddOneOutGame onGameFinished={handleGameFinished} onScoreSubmitted={handleScoreSubmitted} />

        <aside className="game-scoreboard odd-one-out__scoreboard">
          <div className="odd-one-out__scoreboard-header">
            <h2 className="game-scoreboard__title">Top 5 Highscores</h2>
            {lastScore !== null ? (
              <span className="odd-one-out__last-score">Seneste score: {lastScore}</span>
            ) : null}
          </div>

          {isLoading ? (
            <p className="game-scoreboard__empty">Indlæser highscores…</p>
          ) : !hasFinished ? (
            <p className="game-scoreboard__empty">
              Afslut et spil for at se de aktuelle placeringer og gemme din egen score.
            </p>
          ) : scores.length === 0 ? (
            <p className="game-scoreboard__empty">
              Ingen resultater endnu. Vær den første til at sætte en rekord!
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
                    <span className="odd-one-out__score-time">{formatScoreTimestamp(entry.ts)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <p className="game-scoreboard__footnote odd-one-out__scoreboard-footnote">
            Highscores gemmes i Vercel KV ligesom de andre Fokus-spil, så holdet kan følge de bedste
            resultater på tværs af enheder.
          </p>
          {hasFinished ? null : (
            <p className="odd-one-out__scoreboard-hint">
              Tip: Start spillet og gem din score for at låse op for highscorelisten.
            </p>
          )}
        </aside>
      </div>
    </section>
  )
}
