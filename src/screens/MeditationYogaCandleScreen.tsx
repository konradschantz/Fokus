import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import YogaCandleMeditation from '../components/breath/YogaCandleMeditation'

export default function MeditationYogaCandleScreen() {
  const navigate = useNavigate()

  return (
    <section className="menu meditation-page">
      <div className="menu__top-bar">
        <BrandLogo size={64} wordmarkSize="1.75rem" />
        <button type="button" className="menu__back-button" onClick={() => navigate('/meditation')}>
          Tilbage til meditation
        </button>
      </div>

      <header className="meditation-page__header">
        <h1>Yoga meditation med levende lys</h1>
        <p>
          Find et stabilt fokus i fem minutter. Start meditationen, følg timeren og lad den blide klokke guide dig ind og ud af
          øvelsen.
        </p>
      </header>

      <div className="meditation-page__panel">
        <YogaCandleMeditation />
      </div>
    </section>
  )
}
