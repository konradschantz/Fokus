import { useNavigate } from 'react-router-dom'
import ReactionTest from '../ReactionTest'

export default function ReactionTestScreen() {
  const navigate = useNavigate()

  return <ReactionTest onExit={() => navigate('/')} />
}
