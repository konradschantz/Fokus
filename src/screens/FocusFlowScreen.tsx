import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GameShell from '../components/GameShell'
import FocusFlowGame from '../games/focusflow/FocusFlowGame'
import './NewCognitiveGames.css'

export default function FocusFlowScreen() {
  const navigate = useNavigate()
  const [isFinished, setIsFinished] = useState(false)
  const [startSignal, setStartSignal] = useState(0)
  const [summary, setSummary] = useState<{ level: number; bestLevel: number; lives: number }>({
    level: 1,
    bestLevel: 1,
    lives: 3,
  })

  const summaryLines = useMemo(
    () => [
      `Niveau: ${summary.level}`,
      `Bedste: ${summary.bestLevel}`,
      `Liv tilbage: ${summary.lives}`,
    ],
    [summary],
  )

  return (
    <GameShell
      title="Focus Flow"
      subtitle="Klik tallene i rækkefølge"
      isFinished={isFinished}
      summaryLines={summaryLines}
      onRestart={() => {
        setIsFinished(false)
        setSummary({ level: 1, bestLevel: 1, lives: 3 })
        setStartSignal((v) => v + 1)
      }}
      onExit={() => navigate('/overview/games')}
      onReady={() => setStartSignal((v) => v + 1)}
    >
      <FocusFlowGame
        startSignal={startSignal}
        onFinished={(result) => {
          setSummary(result)
          setIsFinished(true)
        }}
      />
    </GameShell>
  )
}
