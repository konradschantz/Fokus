import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import BoxBreathing from '../components/breath/BoxBreathing'

export default function MeditationBoxBreathingScreen() {
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
        <h1>Box Breathing</h1>
        <p>
          Guidet 4-4-4-4 vejrtrækning. Justér tempoet, følg cirklen og lad teksten hjælpe dig gennem de fire faser i et roligt
          tempo.
        </p>
      </header>

      <div className="meditation-page__panel">
        <BoxBreathing />
      </div>
    </section>
  )
}
