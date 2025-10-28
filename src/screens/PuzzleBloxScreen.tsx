import { useNavigate } from 'react-router-dom'
import PuzzleBloxGame from '../games/puzzleblox/PuzzleBloxGame'

export default function PuzzleBloxScreen() {
  const navigate = useNavigate()

  return <PuzzleBloxGame onExit={() => navigate('/')} />
}
