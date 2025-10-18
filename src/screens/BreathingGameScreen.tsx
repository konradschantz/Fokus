import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import BoxBreathing from '../components/breath/BoxBreathing'
import YogaCandleMeditation from '../components/breath/YogaCandleMeditation'

export default function BreathingGameScreen() {
  const navigate = useNavigate()

  return (
    <section className="menu breath-page">
      <div className="menu__top-bar">
        <BrandLogo size={64} wordmarkSize="1.75rem" />
        <button type="button" className="menu__back-button" onClick={() => navigate('/')}>Tilbage til menu</button>
      </div>

      <header className="breath-page__header">
        <h1>Åndedræt</h1>
        <p>
          Find ro i to guidede øvelser. Box Breathing hjælper dig med at balancere rytmen, mens yogaens lysmeditation
          giver fem minutters stille fokus.
        </p>
      </header>

      <div className="breath-page__grid">
        <BoxBreathing />
        <YogaCandleMeditation />
      </div>
    </section>
  )
}
