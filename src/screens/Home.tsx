import type { JSX } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

interface FeatureLink {
  id: string
  label: string
  description: string
  to: string
}

interface FeatureCard {
  id: string
  title: string
  description: string
  to: string
  ctaLabel: string
  links: FeatureLink[]
  icon: JSX.Element
}

const featureCards: FeatureCard[] = [
  {
    id: 'cognitive-games',
    title: 'Kognitive spil',
    description:
      'Træn hukommelse, fokus og tempo gennem spil udviklet til at holde hjernen skarp.',
    to: '/memory',
    ctaLabel: 'Udforsk kognitive spil',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path
          d="M24 8c6.628 0 12 5.373 12 12 0 2.004-.483 3.894-1.337 5.556-.688 1.368-.773 3.015-.294 4.467l.195.593c.557 1.696-.388 3.518-2.084 4.075-1.16.381-2.418.089-3.247-.702l-.44-.419c-1.525-1.455-3.892-1.455-5.417 0-.758.724-1.781 1.172-2.923 1.172-1.146 0-2.172-.451-2.932-1.181-1.517-1.463-3.873-1.463-5.39 0-.664.64-1.553.963-2.48.878-1.805-.166-3.12-1.786-2.954-3.591l.052-.556c.138-1.476-.209-2.953-.984-4.213C9.406 23.741 8.5 21.02 8.5 18.14 8.5 11.513 13.872 6.14 20.5 6.14c1.25 0 2.457.209 3.58.595.358.124.75.124 1.108 0C26.31 6.35 27.517 6.14 28.767 6.14 35.395 6.14 40.767 11.513 40.767 18.14c0 2.44-.636 4.736-1.75 6.73-.932 1.688-1.265 3.648-.941 5.545l.096.548c.284 1.619-.802 3.159-2.42 3.443-1.152.202-2.312-.26-3.04-1.178l-.444-.557c-1.275-1.6-3.688-1.6-4.963 0-.694.87-1.74 1.377-2.855 1.377-1.114 0-2.158-.507-2.851-1.377-1.272-1.599-3.681-1.599-4.953 0-.732.918-1.894 1.38-3.047 1.178-1.618-.284-2.704-1.824-2.42-3.443l.096-.548c.324-1.897-.01-3.857-.941-5.545C7.365 22.875 6.73 20.579 6.73 18.14 6.73 10.27 13 4 20.87 4c1.4 0 2.765.213 4.048.603.36.114.743.114 1.103 0C27.302 4.213 28.667 4 30.067 4 37.937 4 44.207 10.27 44.207 18.14c0 2.878-.906 5.6-2.517 7.942-.775 1.259-1.122 2.737-.984 4.213l.052.556c.166 1.805-1.149 3.425-2.954 3.591-.927.085-1.816-.238-2.48-.878-1.517-1.463-3.873-1.463-5.39 0-.76.73-1.786 1.181-2.932 1.181-1.142 0-2.165-.448-2.923-1.172-1.525-1.455-3.892-1.455-5.417 0l-.44.419c-.83.791-2.088 1.083-3.248.702-1.696-.557-2.641-2.379-2.084-4.075l.195-.593c.479-1.452.394-3.099-.294-4.467C12.483 23.894 12 22.004 12 20c0-6.627 5.373-12 12-12Z"
          fill="url(#brainGradient)"
          fillRule="evenodd"
          clipRule="evenodd"
        />
        <defs>
          <linearGradient id="brainGradient" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
    ),
    links: [
      {
        id: 'reaction-test',
        label: 'Reaktionstest',
        description: 'Mål hvor hurtigt du reagerer, og jag din bedste tid.',
        to: '/reaction-test',
      },
      {
        id: 'memory',
        label: 'Memory',
        description: 'Find alle par på tid og vælg sværhedsgrad.',
        to: '/memory',
      },
      {
        id: 'sorting',
        label: 'Sorteringsspillet',
        description: 'Hold tempoet højt og sorter figurerne korrekt.',
        to: '/sorting',
      },
      {
        id: 'odd-one-out',
        label: 'Odd One Out',
        description: 'Spot symbolet der skiller sig ud, før tiden løber ud.',
        to: '/odd-one-out',
      },
      {
        id: 'puzzle-blox',
        label: 'Puzzle Blox',
        description: 'Genskab målfiguren ved at planlægge dine træk.',
        to: '/puzzle-blox',
      },
    ],
  },
  {
    id: 'meditation',
    title: 'Meditation & vejrtrækning',
    description: 'Find roen med guidede åndedrætsøvelser og mindfulde sessions.',
    to: '/meditation/box-breathing',
    ctaLabel: 'Start Box Breathing',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path
          d="M24 6c9.941 0 18 8.059 18 18s-8.059 18-18 18S6 33.941 6 24 14.059 6 24 6Zm0 4c-7.732 0-14 6.268-14 14s6.268 14 14 14 14-6.268 14-14S31.732 10 24 10Zm0 4.5c1.105 0 2 .895 2 2v2.306a4 4 0 0 1 2.429 1.429l1.657 2.209a2 2 0 1 1-3.214 2.357l-1.657-2.209a.5.5 0 0 0-.408-.198H22c-.276 0-.5.224-.5.5v1.064a2.5 2.5 0 1 1-2.5 0v-1.064A4.5 4.5 0 0 1 23 16.882V16.5c0-1.105.895-2 2-2Z"
          fill="url(#breathGradient)"
        />
        <defs>
          <linearGradient id="breathGradient" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>
    ),
    links: [
      {
        id: 'meditation-hub',
        label: 'Meditationshub',
        description: 'Vælg mellem flere guidede sessioner og musikalske flows.',
        to: '/meditation',
      },
      {
        id: 'yoga-candle',
        label: 'Yoga Candle',
        description: 'Følg flammen og find din rytme i en stille fokusøvelse.',
        to: '/meditation/yoga-candle',
      },
    ],
  },
  {
    id: 'routines',
    title: 'Rutiner & vaner',
    description: 'Skab sunde hverdagsvaner med guidede routines og daglige check-ins.',
    to: '/rutines',
    ctaLabel: 'Byg din rutine',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path
          d="M34 6a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2h4V8a2 2 0 1 1 4 0v2h14V8a2 2 0 1 1 4 0v2h4V8a2 2 0 0 1 2-2ZM10 18v4h4v-4h-4Zm8 0v4h4v-4h-4Zm8 0v4h4v-4h-4Zm8 0v4h4v-4h-4ZM10 26v4h4v-4h-4Zm8 0v4h4v-4h-4Zm8 0v4h4v-4h-4Zm8 0v4h4v-4h-4ZM10 34v4h4v-4h-4Zm8 0v4h4v-4h-4Zm8 0v4h4v-4h-4Z"
          fill="url(#routineGradient)"
        />
        <defs>
          <linearGradient id="routineGradient" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#22C55E" />
          </linearGradient>
        </defs>
      </svg>
    ),
    links: [
      {
        id: 'focus-routine',
        label: 'Fokus-rutinen',
        description: 'Guidede trin til at skabe et fokuseret arbejdsflow.',
        to: '/rutines',
      },
    ],
  },
]

export default function Home() {
  return (
    <div className="menu">
      <header className="menu__header">
        <BrandLogo
          as="h1"
          align="center"
          size={96}
          wordmarkSize="clamp(2.4rem, 6vw, 3.4rem)"
          wordmarkText="Fokus 2.0"
          style={{ marginBottom: '0.5rem' }}
        />
        <p>Alt, du behøver for mental klarhed samlet ét sted.</p>
      </header>

      <section className="menu__grid">
        {featureCards.map((feature) => (
          <article key={feature.id} className="menu__card menu__card--feature">
            <div className="menu__card-head">
              <span className="menu__card-icon">{feature.icon}</span>
              <div>
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
              </div>
            </div>

            <ul className="menu__card-list">
              {feature.links.map((link) => (
                <li key={link.id} className="menu__card-list-item">
                  <Link to={link.to} className="menu__card-link">
                    <span className="menu__card-link-label">{link.label}</span>
                    <span className="menu__card-link-description">{link.description}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <Link to={feature.to} className="menu__primary-button">
              {feature.ctaLabel}
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
