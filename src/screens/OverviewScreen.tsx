import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

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
  return (
    <div className="menu menu--overview">
      <header className="menu__header">
        <BrandLogo
          as="h1"
          align="center"
          size={96}
          wordmarkSize="clamp(2.4rem, 6vw, 3.4rem)"
          wordmarkText="Fokus 2.0"
          style={{ marginBottom: '0.5rem' }}
        />
        <p>Everything you need for mental clarity.</p>
      </header>

      <section className="menu__grid menu__grid--home">
        {sections.map((section) => (
          <article key={section.id} className="menu__card menu__card--home">
            <span aria-hidden="true" className="menu__card-icon">
              {section.icon}
            </span>
            <div className="menu__card-content">
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>
            {section.links && (
              <ul className="menu__card-links">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to={section.cta.to} className="menu__primary-button">
              {section.cta.label}
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
