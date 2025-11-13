import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import PatternPulseGame from '../games/patternpulse/PatternPulseGame'
import './NewCognitiveGames.css'

export default function PatternPulseScreen() {
  const navigate = useNavigate()

  return (
    <section className="menu game-page pattern-pulse">
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

      <header className="menu__header pattern-pulse__header">
        <h1>Pattern Pulse</h1>
        <p>Memorér og gentag lyssekvenser, der gradvist bliver længere og hurtigere.</p>
      </header>

      <div className="game-page__grid pattern-pulse__layout">
        <PatternPulseGame />
      </div>
    </section>
  )
}
