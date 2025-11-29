import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GameShell from '../components/GameShell'
import SpatialSweepGame from '../games/spatialsweep/SpatialSweepGame'
import './NewCognitiveGames.css'

export default function SpatialSweepScreen() {
  const navigate = useNavigate()
  const [isFinished, setIsFinished] = useState(false)
  const [startSignal, setStartSignal] = useState(0)
  const [summary, setSummary] = useState<{
    level: number
    bestLevel: number
    attemptsLeft: number
    averageTime: number
  } | null>(null)

  const summaryLines = useMemo(() => {
    if (!summary) return ['Ingen score registreret.']
    return [
      `Niveau: ${summary.level}`,
      `Bedste niveau: ${summary.bestLevel}`,
      `Forsøg tilbage: ${summary.attemptsLeft}`,
      summary.averageTime > 0 ? `Gns. reaktion: ${Math.round(summary.averageTime)} ms` : 'Ingen data',
    ]
  }, [summary])

  return (
    <GameShell
      title="Spatial Sweep"
      subtitle="Husk mønsteret og genskab det"
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
      <SpatialSweepGame
        startSignal={startSignal}
        onFinished={(result) => {
          setSummary(result)
          setIsFinished(true)
        }}
      />
    </GameShell>
  )
}
