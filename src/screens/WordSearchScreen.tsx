import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GameShell from '../components/GameShell'
import WordSearchGame from '../games/wordsearch/WordSearchGame'
import './NewCognitiveGames.css'

export default function WordSearchScreen() {
  const navigate = useNavigate()
  const [isFinished, setIsFinished] = useState(false)
  const [startSignal, setStartSignal] = useState(0)
  const [summary, setSummary] = useState<{ found: number; total: number; gridSize: number; mistakes: number }>(
    {
      found: 0,
      total: 0,
      gridSize: 10,
      mistakes: 0,
    },
  )

  const summaryLines = useMemo(
    () => [
      `Fundet: ${summary.found} / ${summary.total}`,
      `Gitter: ${summary.gridSize} × ${summary.gridSize}`,
      `Fejlmarkeringer: ${summary.mistakes}`,
    ],
    [summary],
  )

  return (
    <GameShell
      title="Word Search"
      subtitle="Find ordene på tværs af gitteret"
      isFinished={isFinished}
      summaryLines={summaryLines}
      onRestart={() => {
        setIsFinished(false)
        setSummary({ found: 0, total: 0, gridSize: 10, mistakes: 0 })
        setStartSignal((value) => value + 1)
      }}
      onExit={() => navigate('/overview/games')}
      onReady={() => setStartSignal((value) => value + 1)}
    >
      <WordSearchGame
        startSignal={startSignal}
        onFinished={(result) => {
          setSummary(result)
          setIsFinished(true)
        }}
      />
    </GameShell>
  )
}
