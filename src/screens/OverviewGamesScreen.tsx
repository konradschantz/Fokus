import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

type GameCard = {
  id: string
  title: string
  description: string
  ctaLabel: string
  to: string
  icon: string
}

const games: GameCard[] = [
  {
    id: 'memory',
    title: 'Memory Matrix',
    description:
      'Vend kortene og find parrene på tid for at styrke din korttidshukommelse og mønstergenkendelse.',
    ctaLabel: 'Spil Memory Matrix',
    to: '/memory',
    icon: '/gameIcons_svg/memory_game_svg.svg',
  },
  {
    id: 'reaction-test',
    title: 'Reaktionstest',
    description:
      'Test din reaktionsevne og forbedr dit fokus ved at reagere lynhurtigt på visuelle signaler.',
    ctaLabel: 'Start reaktionstest',
    to: '/reaction-test',
    icon: '/gameIcons_svg/reaction_game_svg.svg',
  },
  {
    id: 'sorting',
    title: 'Sorteringsspillet',
    description:
      'Skærp din kognitive fleksibilitet ved at sortere elementer i de rigtige kategorier så hurtigt som muligt.',
    ctaLabel: 'Åbn sorteringsspillet',
    to: '/sorting',
    icon: '/gameIcons_svg/sorting_game_svg.svg',
  },
  {
    id: 'odd-one-out',
    title: 'Odd One Out',
    description:
      'Find elementet der skiller sig ud for at træne mønstergenkendelse og analytisk tænkning.',
    ctaLabel: 'Spil Odd One Out',
    to: '/odd-one-out',
    icon: '/gameIcons_svg/odd_one_out_game_svg.svg',
  },
  {
    id: 'puzzle-blox',
    title: 'Puzzle Blox',
    description:
      'Løs rumlige puslespil og udfordr din problemløsningsevne med farverige byggeklodser.',
    ctaLabel: 'Gå til Puzzle Blox',
    to: '/puzzle-blox',
    icon: '/gameIcons_svg/puzzle_blocks_game_svg.svg',
  },
  {
    id: 'pattern-pulse',
    title: 'Pattern Pulse',
    description:
      'Memorér pulserende farvekombinationer og gentag dem for at skærpe din arbejdshukommelse.',
    ctaLabel: 'Start Pattern Pulse',
    to: '/pattern-pulse',
    icon: '/gameIcons_svg/pattern_pulse_game_svg.svg',
  },
  {
    id: 'spatial-sweep',
    title: 'Spatial Sweep',
    description:
      'Fang og genskab lysmønstre i et gitter for at styrke din rumlige hukommelse og opmærksomhed.',
    ctaLabel: 'Åbn Spatial Sweep',
    to: '/spatial-sweep',
    icon: '/gameIcons_svg/spatial_sweep_game_svg.svg',
  },
  {
    id: 'mind-math',
    title: 'Mind Math',
    description:
      'Evaluer regnestykker lynhurtigt og jagt en fejlfri serie for at træne mental aritmetik.',
    ctaLabel: 'Test Mind Math',
    to: '/mind-math',
    icon: '/gameIcons_svg/mind_math_game_svg.svg',
  },
  {
    id: 'focus-flow',
    title: 'Focus Flow',
    description:
      'Klik tallene i rækkefølge, selv når nettet ændrer sig, og hold din selektive opmærksomhed skarp.',
    ctaLabel: 'Træn Focus Flow',
    to: '/focus-flow',
    icon: '/gameIcons_svg/focus_flow_game_svg.svg',
  },
  {
    id: 'word-weave',
    title: 'Word Weave',
    description:
      'Knyt ord og definitioner sammen og forstærk din semantiske fleksibilitet gennem præcise valg.',
    ctaLabel: 'Spil Word Weave',
    to: '/word-weave',
    icon: '/gameIcons_svg/word_weave_game_svg.svg',
  },
]

export default function OverviewGamesScreen() {
  return (
    <div className="menu">
      <header className="menu__header">
        <BrandLogo
          as="h1"
          align="center"
          size={72}
          wordmarkSize="clamp(2rem, 5vw, 2.8rem)"
          wordmarkText="Cognitive Games"
          style={{ marginBottom: '1rem' }}
        />
        <p>Udforsk vores samling af spil designet til at styrke fokus, hukommelse og reaktionsevne.</p>
       
      </header>

      <section className="menu__grid menu__grid--home">
        {games.map((game) => (
          <article key={game.id} className="menu__card menu__card--home">
            <div className="menu__card-media">
              <img src={game.icon} alt={`${game.title} ikon`} className="menu__card-icon" />
            </div>
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
