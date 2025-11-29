import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GameShell from '../components/GameShell'
import PuzzleBloxGame from '../games/puzzleblox/PuzzleBloxGame'

type PuzzleBloxSummary = {
  levelsCompleted: number
  highestLevel: number
  timeRemaining: number
}

export default function PuzzleBloxScreen() {
  const navigate = useNavigate()
  const [isFinished, setIsFinished] = useState(false)
  const [lastSummary, setLastSummary] = useState<PuzzleBloxSummary | null>(null)
  const [startSignal, setStartSignal] = useState(0)

  const summaryLines = useMemo(() => {
    if (!lastSummary) return ['Ingen score registreret.']
    return [
      `Niveauer gennemført: ${lastSummary.levelsCompleted}`,
      `Højeste niveau: ${lastSummary.highestLevel}`,
      `Tid tilbage: ${Math.max(0, Math.floor(lastSummary.timeRemaining))}s`,
    ]
  }, [lastSummary])

  return (
    <GameShell
      title="Puzzle Blox"
      subtitle="Fjern blokke og match mønsteret"
      isFinished={isFinished}
      summaryLines={summaryLines}
      onRestart={() => {
        setIsFinished(false)
        setLastSummary(null)
        setStartSignal((value) => value + 1)
      }}
      onExit={() => navigate('/overview/games')}
      onReady={() => setStartSignal((value) => value + 1)}
    >
      <PuzzleBloxGame
        startSignal={startSignal}
        onFinished={(summary) => {
          setLastSummary(summary)
          setIsFinished(true)
        }}
      />
    </GameShell>
  )
}
