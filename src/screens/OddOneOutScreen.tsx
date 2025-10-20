import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import motion from 'framer-motion'
import OddOneOutGame from '../games/oddoneout/OddOneOutGame'
import {
  getOddOneOutScores,
  type OddOneOutScoreEntry,
} from '../utils/oddOneOutScores'

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
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <OddOneOutGame
        onExit={() => navigate('/')}
        onGameFinished={handleGameFinished}
        onScoreSubmitted={handleScoreSubmitted}
      />

      <motion.section
        className="rounded-3xl bg-white px-6 py-5 shadow-xl"
        initial={{ opacity: 0, transform: 'translateY(12px)' }}
        animate={{ opacity: 1, transform: 'translateY(0)' }}
        transition={{ duration: 0.45, delay: 0.2 }}
      >
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-sky-900">Odd One Out – Top 5</h3>
            <p className="text-sm text-slate-600">
              {hasFinished
                ? 'De bedste resultater fra Fokus-fællesskabet opdateres automatisk her.'
                : 'Afslut et spil for at se de aktuelle topresultater og gemme dit eget.'}
            </p>
          </div>
          {lastScore !== null ? (
            <span className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-md">
              Din seneste score: {lastScore}
            </span>
          ) : null}
        </header>

        <div className="mt-4">
          {isLoading ? (
            <p className="text-sm text-slate-600">Indlæser highscores…</p>
          ) : scores.length === 0 ? (
            <p className="text-sm text-slate-600">
              Ingen gemte resultater endnu. Vær den første til at sætte en rekord!
            </p>
          ) : (
            <ol className="mt-3">
              {scores.map((entry, index) => (
                <li
                  key={`${entry.name}-${entry.ts}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(186, 230, 253, 0.35), rgba(125, 211, 252, 0.55))',
                    padding: '0.85rem 1.2rem',
                    boxShadow: '0 18px 28px rgba(15, 23, 42, 0.12)',
                    border: '1px solid rgba(125, 211, 252, 0.45)',
                    marginTop: index === 0 ? 0 : '0.85rem',
                  }}
                >
                  <div className="flex items-center gap-3 text-sky-900">
                    <span className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-sky-900 shadow-md">
                      #{index + 1}
                    </span>
                    <span className="text-lg font-semibold text-sky-900">{entry.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="font-semibold text-sky-900">{entry.score} point</span>
                    <span>{formatScoreTimestamp(entry.ts)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </motion.section>
    </div>
  )
}
