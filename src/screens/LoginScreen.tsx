import BrandLogo from '../components/BrandLogo'
import './LoginScreen.css'

type LoginScreenProps = {
  onSkip: () => void
}

export default function LoginScreen({ onSkip }: LoginScreenProps) {
  return (
    <div className="landing-wrapper">
      <div className="landing-overlay">
        <header className="landing-header">
          <BrandLogo align="left" size={64} wordmarkSize="2rem" />
          <nav className="landing-nav" aria-label="Primary navigation">
            <a href="#features">Features</a>
            <a href="#rituals">Rituals</a>
            <a href="#pricing">Pricing</a>
          </nav>
        </header>

        <main className="landing-content">
          <span className="landing-eyebrow">Mindful productivity</span>
          <h1 className="landing-title">Stay focused on what matters</h1>
          <p className="landing-subtitle">
            Fokus hjælper dig med at skabe rolige rammer, minimere distraktioner og forankre dine daglige
            vaner. Inspireret af skandinavisk ro, designet til at give dig mentalt overskud.
          </p>
          <div className="landing-cta">
            <button type="button" className="landing-button landing-button--primary" onClick={onSkip}>
              Kom i gang
            </button>
            <a className="landing-button landing-button--ghost" href="#learn-more">
              Læs mere
            </a>
          </div>
        </main>

        <section className="landing-footer" aria-label="Highlights" id="learn-more">
          <div className="landing-pill-row" id="features">
            <span className="landing-pill">Guidede fokusøvelser</span>
            <span className="landing-pill">Afspændende lydlandskaber</span>
            <span className="landing-pill">Personlige rutiner</span>
          </div>
          <div className="landing-pill-row" id="rituals">
            <span className="landing-pill">Daglige påmindelser</span>
            <span className="landing-pill">Støttende community</span>
            <span className="landing-pill">Skræddersyet til dit tempo</span>
          </div>
          <div className="landing-pill-row" id="pricing">
            <span className="landing-pill">Gratis introduktion</span>
            <span className="landing-pill">Premium meditationer</span>
            <span className="landing-pill">Pause når som helst</span>
          </div>
        </section>
      </div>
    </div>
  )
}
