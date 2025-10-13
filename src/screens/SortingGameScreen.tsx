import { useNavigate } from 'react-router-dom'
import SortingGame from '../games/sorting/SortingGame'

export default function SortingGameScreen() {
  const navigate = useNavigate()

  return <SortingGame onExit={() => navigate('/')} />
}
