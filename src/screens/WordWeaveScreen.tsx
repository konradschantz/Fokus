import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GameShell from '../components/GameShell'
import WordWeaveGame from '../games/wordweave/WordWeaveGame'
import './NewCognitiveGames.css'

export default function WordWeaveScreen() {
  const navigate = useNavigate()
  const [isFinished, setIsFinished] = useState(false)
  const [startSignal, setStartSignal] = useState(0)
  const [summary, setSummary] = useState<{ score: number; bestScore: number; bestStreak: number; round: number }>({
    score: 0,
    bestScore: 0,
    bestStreak: 0,
    round: 0,
  })

  const summaryLines = useMemo(
    () => [
      `Score: ${summary.score}`,
      `Bedste score: ${summary.bestScore}`,
      `Bedste streak: ${summary.bestStreak}`,
      `Runde: ${summary.round}`,
    ],
    [summary],
  )

  return (
    <GameShell
      title="Word Weave"
      subtitle="Find det stærkeste synonym"
      isFinished={isFinished}
      summaryLines={summaryLines}
      onRestart={() => {
        setIsFinished(false)
        setSummary({ score: 0, bestScore: 0, bestStreak: 0, round: 0 })
        setStartSignal((v) => v + 1)
      }}
      onExit={() => navigate('/overview/games')}
      onReady={() => setStartSignal((v) => v + 1)}
    >
      <WordWeaveGame
        startSignal={startSignal}
        onFinished={(result) => {
          setSummary(result)
          setIsFinished(true)
        }}
      />
    </GameShell>
  )
}
