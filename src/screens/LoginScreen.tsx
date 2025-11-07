import BrandLogo from '../components/BrandLogo'
import './LoginScreen.css'

type LoginScreenProps = {
  onSkip: () => void
  onGoToRoutine: () => void
  onGoToMeditation: () => void
}

export default function LoginScreen({ onSkip, onGoToRoutine, onGoToMeditation }: LoginScreenProps) {
  return (
    <div className="landing-wrapper">
      <div className="landing-overlay">
        <header className="landing-header">
          <BrandLogo align="left" size={64} wordmarkSize="2rem" />
          <nav className="landing-nav" aria-label="Primary navigation">
            <button type="button" className="landing-nav__link" onClick={onSkip}>
              Fokus spil
            </button>
            <button type="button" className="landing-nav__link" onClick={onGoToRoutine}>
              Fokus Rutiner
            </button>
            <a className="landing-nav__link" href="https://fokus-mu-snowy.vercel.app/meditation">
              Fokus meditation
            </a>
          </nav>
        </header>

        <main className="landing-content">
          <span className="landing-eyebrow">Mindful productivity</span>
          <h1 className="landing-title">Stay focused on what matters</h1>
          <p className="landing-subtitle">
            Fokus er udviklet til at styrke og træne dine kognitive evner gennem målrettede øvelser, der
            forbedrer hukommelse, koncentration og mental fleksibilitet. Appen kombinerer moderne neurovidenskab
            med enkel skandinavisk ro – så du kan skabe et klart sind i en travl hverdag.
          </p>
          <div className="landing-cta">
            <button type="button" className="landing-button landing-button--primary" onClick={onSkip}>
              Kom i gang
            </button>
            <button
              type="button"
              className="landing-button landing-button--secondary"
              onClick={onGoToRoutine}
            >
              Gå til rutine
            </button>
            <button
              type="button"
              className="landing-button landing-button--ghost"
              onClick={onGoToMeditation}
            >
              Meditation
            </button>
          </div>
        </main>

        <section className="landing-footer" aria-label="Highlights" id="learn-more">
          <div className="landing-pill-row" id="features">
            <span className="landing-pill">Guidede fokusøvelser</span>
            <span className="landing-pill">Afspændende lydlandskaber</span>
            <span className="landing-pill">Personlige rutiner</span>
          </div>
        </section>
      </div>
    </div>
  )
}
