import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GameShell from '../components/GameShell'
import OddOneOutGame from '../games/oddoneout/OddOneOutGame'
import './OddOneOutScreen.css'

export default function OddOneOutScreen() {
  const navigate = useNavigate()
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [startSignal, setStartSignal] = useState(0)

  const summaryLines = useMemo(() => {
    if (lastScore === null) return ['Ingen score registreret.']
    return [`Score: ${lastScore}`]
  }, [lastScore])

  return (
    <GameShell
      title="Odd One Out"
      subtitle="Find figuren der bryder mønsteret"
      isFinished={isFinished}
      summaryLines={summaryLines}
      onRestart={() => {
        setIsFinished(false)
        setLastScore(null)
        setStartSignal((value) => value + 1)
      }}
      onExit={() => navigate('/overview/games')}
      onReady={() => setStartSignal((value) => value + 1)}
    >
      <div className="odd-one-out__full">
        <OddOneOutGame
          startSignal={startSignal}
          onGameFinished={(score) => {
            setLastScore(score)
            setIsFinished(true)
          }}
        />
      </div>
    </GameShell>
  )
}
