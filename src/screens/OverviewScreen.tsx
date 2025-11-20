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
  cta?: SectionLink
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
      'Find ro i åndedrættet med guidede meditationer og visuelle vejrtrækningsøvelser.',
    cta: { to: '/meditation/box-breathing', label: 'Start meditation' },
    icon: '🧘🏽',
    links: [
      { to: '/meditation/box-breathing', label: 'Box Breathing' },
      { to: '/meditation/yoga-candle', label: 'Candle Breathing' },
    ],
  },
  {
    id: 'routine-builder',
    title: 'Noget nyt på vej',
    description:
      'Vi arbejder på en ny rutinebygger og personlige vaner – hold øje med næste release.',
    icon: '🧭',
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
            X
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
                          Spil og meditationer for at hjælpe dig med at fokusere bedre hver dag.
                          Styrk din mentale klarhed og følelsesmæssige balance gennem personlige daglige øvelser.
                        </p>
        
            <div className="overview__actions">
              <Link to="/overview/games" className="button--primary">
                Start træning
              </Link>
              <button type="button" className="button--ghost" disabled aria-label="Noget nyt på vej">
                Noget nyt på vej
              </button>
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
            Games, meditationer og noget nyt på vej samlet ét sted.
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
                {section.cta ? (
                  <Link to={section.cta.to} className="button--primary">
                    {section.cta.label}
                  </Link>
                ) : (
                  <span className="button--ghost" aria-disabled="true">
                    Noget nyt på vej
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

