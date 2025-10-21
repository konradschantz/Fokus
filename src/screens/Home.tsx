import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

interface GameDefinition {
  id: string
  name: string
  description: string
  path: string
  startLabel: string
}

const games: GameDefinition[] = [
  {
    id: 'reaction-test',
    name: 'Reaktionstest',
    description:
      'Hvor hurtigt kan du reagere? Klik, så snart skærmen skifter farve, og se dine bedste tider.',
    path: '/reaction-test',
    startLabel: 'Start reaktionstest',
  },
  {
    id: 'meditation',
    name: 'Meditation',
    description:
      'Fordyb dig i guidede øvelser som Box Breathing og Yoga Meditation med levende lys. Find ro og fokus gennem vejrtrækning og nærvær.',
    path: '/meditation',
    startLabel: 'Start meditation',
  },
  {
    id: 'memory',
    name: 'Memory',
    description:
      'Vend to kort ad gangen og find alle par hurtigst muligt. Flere sværhedsgrader og highscores.',
    path: '/memory',
    startLabel: 'Start memory',
  },
  {
    id: 'sorting',
    name: 'Sorteringsspillet',
    description:
      'Sortér figurerne til venstre eller højre efter reglerne. Brug piletasterne, hold tempoet og jag din bedste score.',
    path: '/sorting',
    startLabel: 'Start sorteringsspil',
  },
  {
    id: 'odd-one-out',
    name: 'Odd One Out',
    description: 'Find figuren der skiller sig ud fra mængden på tid.',
    path: '/odd-one-out',
    startLabel: 'Start Odd One Out',
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
        <p>Vælg et spil for at komme i gang.</p>
      </header>

      <section className="menu__grid">
        {games.map((game) => (
          <article key={game.id} className="menu__card">
            <h2>{game.name}</h2>
            <p>{game.description}</p>
            <Link to={game.path} className="menu__primary-button">
              {game.startLabel}
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
