import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import FocusFlowGame from '../games/focusflow/FocusFlowGame'
import './NewCognitiveGames.css'

export default function FocusFlowScreen() {
  const navigate = useNavigate()

  return (
    <section className="menu game-page focus-flow">
      <div className="menu__top-bar">
        <BrandLogo size={64} wordmarkSize="1.75rem" />
        <button
          type="button"
          className="menu__back-button"
          onClick={() => navigate('/overview/games')}
        >
          Tilbage til spiloversigt
        </button>
      </div>

      <header className="menu__header focus-flow__header">
        <h1>Focus Flow</h1>
        <p>Klik tallene i rækkefølge og hold hovedet koldt, når nettet skifter form.</p>
      </header>

      <div className="game-page__grid focus-flow__layout">
        <FocusFlowGame />
      </div>
    </section>
  )
}
