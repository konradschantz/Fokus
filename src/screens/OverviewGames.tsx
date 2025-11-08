import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

type GameCard = {
  id: string
  title: string
  description: string
  to: string
  ctaLabel: string
}

const games: GameCard[] = [
  {
    id: 'memory-matrix',
    title: 'Memory Matrix',
    description:
      'Find de skjulte par på tid og udfordre din korttidshukommelse i det klassiske huskespil.',
    to: '/memory',
    ctaLabel: 'Spil Memory',
  },
  {
    id: 'reaction-test',
    title: 'Reaktionstest',
    description:
      'Test hvor hurtigt du kan reagere på visuelle signaler og følg din fremgang over tid.',
    to: '/reaction-test',
    ctaLabel: 'Start reaktionstest',
  },
  {
    id: 'sorting-game',
    title: 'Sorteringsspillet',
    description:
      'Sortér de faldende objekter i den rigtige kategori for at træne fokus og beslutningstagning.',
    to: '/sorting',
    ctaLabel: 'Åbn sorteringsspil',
  },
  {
    id: 'odd-one-out',
    title: 'Odd One Out',
    description:
      'Find symbolet der skiller sig ud og styrk din visuelle opmærksomhed på få minutter.',
    to: '/odd-one-out',
    ctaLabel: 'Spil Odd One Out',
  },
  {
    id: 'puzzle-blox',
    title: 'Puzzle Blox',
    description:
      'Placér brikkerne strategisk for at rydde rækker og forbedre din planlægningssans.',
    to: '/puzzle-blox',
    ctaLabel: 'Prøv Puzzle Blox',
  },
]

export default function OverviewGames() {
  return (
    <div className="menu">
      <header className="menu__header">
        <BrandLogo
          as="h1"
          align="center"
          size={72}
          wordmarkSize="clamp(2rem, 5vw, 3rem)"
          wordmarkText="Cognitive Games"
          style={{ marginBottom: '0.5rem' }}
        />
        <p>Vælg et spil og kom hurtigt i gang med at træne hjernen.</p>
      </header>

      <section className="menu__grid menu__grid--home">
        {games.map((game) => (
          <article key={game.id} className="menu__card menu__card--home">
            <div className="menu__card-content">
              <h2>{game.title}</h2>
              <p>{game.description}</p>
            </div>
            <Link to={game.to} className="menu__primary-button">
              {game.ctaLabel}
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
