import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GameShell from '../components/GameShell'
import MindMathGame from '../games/mindmath/MindMathGame'
import './NewCognitiveGames.css'

export default function MindMathScreen() {
  const navigate = useNavigate()
  const [isFinished, setIsFinished] = useState(false)
  const [startSignal, setStartSignal] = useState(0)
  const [summary, setSummary] = useState<{ score: number; bestScore: number; accuracy: number; mistakes: number }>({
    score: 0,
    bestScore: 0,
    accuracy: 0,
    mistakes: 0,
  })

  const summaryLines = useMemo(
    () => [
      `Score: ${summary.score}`,
      `Bedste: ${summary.bestScore}`,
      `Præcision: ${summary.accuracy}%`,
      `Fejl: ${summary.mistakes}`,
    ],
    [summary],
  )

  return (
    <GameShell
      title="Mind Math"
      subtitle="Vurder udtryk lynhurtigt"
      isFinished={isFinished}
      summaryLines={summaryLines}
      onRestart={() => {
        setIsFinished(false)
        setSummary({ score: 0, bestScore: 0, accuracy: 0, mistakes: 0 })
        setStartSignal((v) => v + 1)
      }}
      onExit={() => navigate('/overview/games')}
      onReady={() => setStartSignal((v) => v + 1)}
    >
      <MindMathGame
        startSignal={startSignal}
        onFinished={(result) => {
          setSummary(result)
          setIsFinished(true)
        }}
      />
    </GameShell>
  )
}
