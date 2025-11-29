import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GameShell from '../components/GameShell'
import PatternPulseGame from '../games/patternpulse/PatternPulseGame'
import './NewCognitiveGames.css'

export default function PatternPulseScreen() {
  const navigate = useNavigate()
  const [isFinished, setIsFinished] = useState(false)
  const [startSignal, setStartSignal] = useState(0)
  const [summary, setSummary] = useState<{ level: number; bestLevel: number; timeLeft: number } | null>(null)

  const summaryLines = useMemo(() => {
    if (!summary) return ['Ingen score registreret.']
    return [
      `Nuværende niveau: ${summary.level}`,
      `Bedste niveau: ${summary.bestLevel}`,
      `Tid tilbage: ${summary.timeLeft}s`,
    ]
  }, [summary])

  return (
    <GameShell
      title="Pattern Pulse"
      subtitle="Memorér og gentag pulserende sekvenser"
      isFinished={isFinished}
      summaryLines={summaryLines}
      onRestart={() => {
        setIsFinished(false)
        setSummary(null)
        setStartSignal((value) => value + 1)
      }}
      onExit={() => navigate('/overview/games')}
      onReady={() => setStartSignal((value) => value + 1)}
    >
      <PatternPulseGame
        startSignal={startSignal}
        onFinished={(result) => {
          setSummary(result)
          setIsFinished(true)
        }}
      />
    </GameShell>
  )
}
