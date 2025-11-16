import { useState } from 'react'
import { Link } from 'react-router-dom'
import './OverviewScreen.css'

type SectionLink = {
  to: string
  label: string
}

type OverviewSection = {
  id: string
  title: string
  description: string
  cta: SectionLink
  icon: string
  links?: SectionLink[]
}

const sections: OverviewSection[] = [
  {
    id: 'cognitive-games',
    title: 'Cognitive Games',
    description:
      'Boost hukommelsen og koncentrationen med hurtige, videnskabeligt inspirerede mini-udfordringer.',
    cta: { to: '/overview/games', label: 'Udforsk spil' },
    icon: '🧠',
    links: [
      { to: '/reaction-test', label: 'Reaktionstest' },
      { to: '/sorting', label: 'Sorteringsspillet' },
      { to: '/odd-one-out', label: 'Odd One Out' },
      { to: '/puzzle-blox', label: 'Puzzle Blox' },
      { to: '/pattern-pulse', label: 'Pattern Pulse' },
      { to: '/spatial-sweep', label: 'Spatial Sweep' },
      { to: '/mind-math', label: 'Mind Math' },
      { to: '/focus-flow', label: 'Focus Flow' },
      { to: '/word-weave', label: 'Word Weave' },
    ],
  },
  {
    id: 'meditation-breathing',
    title: 'Meditation & Breathing',
    description:
      'Find ro og rytme i åndedrættet med guidede meditationer og visuelle vejrtrækningsøvelser.',
    cta: { to: '/meditation/box-breathing', label: 'Start meditation' },
    icon: '🧘',
    links: [
      { to: '/meditation/box-breathing', label: 'Box Breathing' },
      { to: '/meditation/yoga-candle', label: 'Candle Breathing' },
    ],
  },
  {
    id: 'routine-builder',
    title: 'Rutiner & Vaner',
    description:
      'Byg holdbare vaner med daglige fokusområder og inspiration til dine egne rutiner.',
    cta: { to: '/rutines', label: 'Åbn rutinebygger' },
    icon: '🗓️',
  },
]

export default function OverviewScreen() {
  const [isHeroVisible, setHeroVisible] = useState(true)

  return (
    <div className="overview">
      {isHeroVisible && (
        <section className="overview__hero">
          <button
            type="button"
            className="overview__hero-close"
            aria-label="Skjul introduktion"
            onClick={() => setHeroVisible(false)}
          >
            ×
          </button>
          <div className="overview__hero-copy">
            <div className="overview__hero-badge">
              <span className="overview__hero-badge-text overview__hero-badge-text--calm">
                Calm Mode
              </span>
              <span className="overview__hero-badge-text overview__hero-badge-text--focus">
                Focus Mode
              </span>
            </div>
            <h1>Styrk din hjerne</h1>
            <p>
              Games, meditations, and routines to help you focus better every day. Strengthen
              your mental clarity and emotional balance through personalized daily practices.
            </p>
            <div className="overview__actions">
              <Link to="/overview/games" className="button--primary">
                Start Training
              </Link>
              <Link to="/rutines" className="button--ghost">
                Learn More
              </Link>
            </div>
          </div>

          <div className="overview__visual" aria-hidden="true">
            <div className="overview__planet">
              <span className="overview__orbit overview__orbit--one" />
              <span className="overview__orbit overview__orbit--two" />
              <span className="overview__orbit overview__orbit--three" />
            </div>
          </div>
        </section>
      )}

      <section className="overview__sections">
        <div className="overview__section-header">
          <h2>Explore Fokus</h2>
          <p className="overview__section-description">
            Games, meditationer og rutiner samlet ét sted.
          </p>
        </div>

        <div className="overview__cards">
          {sections.map((section) => (
            <article key={section.id} className="overview__card">
              <span aria-hidden="true" className="overview__card-icon">
                {section.icon}
              </span>
              <div className="overview__card-content">
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
              {section.links && (
                <ul className="overview__card-links">
                  {section.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="overview__card-cta">
                <Link to={section.cta.to} className="button--primary">
                  {section.cta.label}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
