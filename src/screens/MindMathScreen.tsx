import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import MindMathGame from '../games/mindmath/MindMathGame'
import './NewCognitiveGames.css'

export default function MindMathScreen() {
  const navigate = useNavigate()

  return (
    <section className="menu game-page mind-math">
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

      <header className="menu__header mind-math__header">
        <h1>Mind Math</h1>
        <p>Evaluer hovedregnestykker lynhurtigt og jagt en fejlfri serie af svar.</p>
      </header>

      <div className="game-page__grid mind-math__layout">
        <MindMathGame />
      </div>
    </section>
  )
}
