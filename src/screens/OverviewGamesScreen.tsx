import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

type GameCard = {
  id: string
  title: string
  description: string
  ctaLabel: string
  to: string
  icon: string
  badge?: string
}

type GameSection = {
  id: string
  title: string
  description: string
  eyebrow: string
  games: GameCard[]
}

const classicGames: GameCard[] = [
  {
    id: 'memory',
    title: 'Memory Matrix',
    description:
      'Vend kortene og find parrene pǾ tid for at styrke din korttidshukommelse og m��nstergenkendelse.',
    ctaLabel: 'Spil Memory Matrix',
    to: '/memory',
    icon: '/gameIcons_svg/memory_game_svg.svg',
  },
  {
    id: 'reaction-test',
    title: 'Reaktionstest',
    description:
      'Test din reaktionsevne og forbedr dit fokus ved at reagere lynhurtigt pǾ visuelle signaler.',
    ctaLabel: 'Start reaktionstest',
    to: '/reaction-test',
    icon: '/gameIcons_svg/reaction_game_svg.svg',
  },
  {
    id: 'sorting',
    title: 'Sorteringsspillet',
    description:
      'Sk��rp din kognitive fleksibilitet ved at sortere elementer i de rigtige kategorier sǾ hurtigt som muligt.',
    ctaLabel: '�.bn sorteringsspillet',
    to: '/sorting',
    icon: '/gameIcons_svg/sorting_game_svg.svg',
  },
  {
    id: 'odd-one-out',
    title: 'Odd One Out',
    description:
      'Find elementet der skiller sig ud for at tr��ne m��nstergenkendelse og analytisk t��nkning.',
    ctaLabel: 'Spil Odd One Out',
    to: '/odd-one-out',
    icon: '/gameIcons_svg/odd_one_out_game_svg.svg',
  },
  {
    id: 'puzzle-blox',
    title: 'Puzzle Blox',
    description:
      'L��s rumlige puslespil og udfordr din probleml��sningsevne med farverige byggeklodser.',
    ctaLabel: 'GǾ til Puzzle Blox',
    to: '/puzzle-blox',
    icon: '/gameIcons_svg/puzzle_blocks_game_svg.svg',
  },
]

const nextGenGames: GameCard[] = [
  {
    id: 'pattern-pulse',
    title: 'Pattern Pulse',
    description:
      'MemorǸr pulserende farvekombinationer og gentag dem for at sk��rpe din arbejdshukommelse.',
    ctaLabel: 'Start Pattern Pulse',
    to: '/pattern-pulse',
    icon: '/gameIcons_svg/pattern_pulse_game_svg.svg',
    badge: 'Ny',
  },
  {
    id: 'spatial-sweep',
    title: 'Spatial Sweep',
    description:
      'Fang og genskab lysm��nstre i et gitter for at styrke din rumlige hukommelse og opm��rksomhed.',
    ctaLabel: '�.bn Spatial Sweep',
    to: '/spatial-sweep',
    icon: '/gameIcons_svg/spatial_sweep_game_svg.svg',
    badge: 'Ny',
  },
  {
    id: 'mind-math',
    title: 'Mind Math',
    description:
      'Evaluer regnestykker lynhurtigt og jagt en fejlfri serie for at tr��ne mental aritmetik.',
    ctaLabel: 'Test Mind Math',
    to: '/mind-math',
    icon: '/gameIcons_svg/mind_math_game_svg.svg',
    badge: 'Ny',
  },
  {
    id: 'focus-flow',
    title: 'Focus Flow',
    description:
      'Klik tallene i r��kkef��lge, selv nǾr nettet ��ndrer sig, og hold din selektive opm��rksomhed skarp.',
    ctaLabel: 'Tr��n Focus Flow',
    to: '/focus-flow',
    icon: '/gameIcons_svg/focus_flow_game_svg.svg',
    badge: 'Ny',
  },
  {
    id: 'word-weave',
    title: 'Word Weave',
    description:
      'Knyt ord og definitioner sammen og forst��rk din semantiske fleksibilitet gennem pr��cise valg.',
    ctaLabel: 'Spil Word Weave',
    to: '/word-weave',
    icon: '/gameIcons_svg/word_weave_game_svg.svg',
    badge: 'Ny',
  },
]

const sections: GameSection[] = [
  {
    id: 'classic',
    eyebrow: 'Favoritter',
    title: 'Kerneklassikere',
    description: 'Velafprřvede spil til at teste hukommelse, fokus og reaktionstid.',
    games: classicGames,
  },
  {
    id: 'next-gen',
    eyebrow: 'Nyheder',
    title: 'Nye spil',
    description: 'Splitter nye oplevelser, der mǿlretter arbejdshukommelse, tempo og ordforstňelse.',
    games: nextGenGames,
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
        <p>
          Udforsk hele biblioteket af fokus- og hukommelsesspil. Klassiske favoritter og helt nye
          udfordringer ligger klar til dig.
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.id} className="menu__section" aria-labelledby={`${section.id}-title`}>
          <div className="menu__section-header">
            <div>
              <p className="menu__section-eyebrow">{section.eyebrow}</p>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
            </div>
            <p className="menu__section-description">{section.description}</p>
          </div>

          <div className="menu__grid">
            {section.games.map((game) => (
              <article key={game.id} className="menu__card">
                {game.badge && <span className="menu__card-badge">{game.badge}</span>}
                <div className="menu__card-media">
                  <img src={game.icon} alt={`${game.title} ikon`} className="menu__card-icon" />
                </div>
                <div className="menu__card-content">
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                </div>
                <Link to={game.to} className="menu__primary-button">
                  {game.ctaLabel}
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
