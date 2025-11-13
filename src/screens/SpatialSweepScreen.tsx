import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import SpatialSweepGame from '../games/spatialsweep/SpatialSweepGame'
import './NewCognitiveGames.css'

export default function SpatialSweepScreen() {
  const navigate = useNavigate()

  return (
    <section className="menu game-page spatial-sweep">
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

      <header className="menu__header spatial-sweep__header">
        <h1>Spatial Sweep</h1>
        <p>Følg lysmønstrene i gitteret og genskab dem, før de forsvinder.</p>
      </header>

      <div className="game-page__grid spatial-sweep__layout">
        <SpatialSweepGame />
      </div>
    </section>
  )
}
