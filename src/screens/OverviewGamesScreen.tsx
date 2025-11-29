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
  focus: string
}

type GameSection = {
  id: string
  title: string
  description: string
  eyebrow: string
  games: GameCard[]
}

const sections: GameSection[] = [
  {
    id: 'memory',
    eyebrow: 'Hukommelse',
    title: 'Hukommelse & mønstre',
    description:
      'Træningspakker til visuel hukommelse, mønstergenkendelse og arbejdshukommelsens udholdenhed.',
    games: [
      {
        id: 'memory',
        title: 'Memory Matrix',
        description:
          'Vend og match par under pres for at styrke korttidshukommelse og visuelt overblik.',
        ctaLabel: 'Spil Memory Matrix',
        to: '/memory',
        icon: '/gameIcons_svg/memory_game_svg.svg',
        focus: 'Visuospatisk hukommelse',
      },
      {
        id: 'pattern-pulse',
        title: 'Pattern Pulse',
        description:
          'Memorér pulserende farvesekvenser og gengiv dem præcist for at holde arbejdshukommelsen skarp.',
        ctaLabel: 'Start Pattern Pulse',
        to: '/pattern-pulse',
        icon: '/gameIcons_svg/pattern_pulse_game_svg.svg',
        badge: 'Ny',
        focus: 'Sekvenshukommelse',
      },
      {
        id: 'spatial-sweep',
        title: 'Spatial Sweep',
        description:
          'Følg lysende felter i et gitter og genskab mønsteret for at styrke rumlig hukommelse og opmærksomhed.',
        ctaLabel: 'Åbn Spatial Sweep',
        to: '/spatial-sweep',
        icon: '/gameIcons_svg/spatial_sweep_game_svg.svg',
        badge: 'Ny',
        focus: 'Rumlig arbejdshukommelse',
      },
    ],
  },
  {
    id: 'focus',
    eyebrow: 'Fokus & tempo',
    title: 'Fokus & reaktionstid',
    description:
      'Spil der forbedrer selektiv opmærksomhed, perifert blik og motorisk reaktionsevne.',
    games: [
      {
        id: 'reaction-test',
        title: 'Reaktionstest',
        description:
          'Klik på signaler i det øjeblik de skifter farve og mål din reaktionstid fra forsøg til forsøg.',
        ctaLabel: 'Start reaktionstest',
        to: '/reaction-test',
        icon: '/gameIcons_svg/reaction_game_svg.svg',
        focus: 'Perceptuel hastighed',
      },
      {
        id: 'focus-flow',
        title: 'Focus Flow',
        description:
          'Find tallene i rækkefølge mens layoutet skifter og træn evnen til at fastholde selektiv opmærksomhed.',
        ctaLabel: 'Træn Focus Flow',
        to: '/focus-flow',
        icon: '/gameIcons_svg/focus_flow_game_svg.svg',
        badge: 'Ny',
        focus: 'Selektiv opmærksomhed',
      },
      {
        id: 'odd-one-out',
        title: 'Odd One Out',
        description:
          'Zoom ind på bittesmå forskelle i form og farve for at skærpe mønstergenkendelse og visuel agilitet.',
        ctaLabel: 'Spil Odd One Out',
        to: '/odd-one-out',
        icon: '/gameIcons_svg/odd_one_out_game_svg.svg',
        focus: 'Visuel diskrimination',
      },
    ],
  },
  {
    id: 'agility',
    eyebrow: 'Mental agilitet',
    title: 'Strategi & problemløsning',
    description:
      'Øvelser der tester kognitiv fleksibilitet, logisk tænkning og rumlig planlægning.',
    games: [
      {
        id: 'sorting',
        title: 'Sorteringsspillet',
        description:
          'Skift mellem regler på splitsekunder og placer kortene korrekt for at træne kognitiv fleksibilitet.',
        ctaLabel: 'Åbn sorteringsspillet',
        to: '/sorting',
        icon: '/gameIcons_svg/sorting_game_svg.svg',
        focus: 'Regelskift & fleksibilitet',
      },
      {
        id: 'mind-math',
        title: 'Mind Math',
        description:
          'Evaluer udtryk lynhurtigt for at holde mental aritmetik og beslutningstempo i topform.',
        ctaLabel: 'Test Mind Math',
        to: '/mind-math',
        icon: '/gameIcons_svg/mind_math_game_svg.svg',
        badge: 'Ny',
        focus: 'Numerisk hastighed',
      },
      {
        id: 'puzzle-blox',
        title: 'Puzzle Blox',
        description:
          'Placer byggeklodser strategisk i begrænset plads og træn din rumlige planlægning.',
        ctaLabel: 'Gå til Puzzle Blox',
        to: '/puzzle-blox',
        icon: '/gameIcons_svg/puzzle_blocks_game_svg.svg',
        focus: 'Rumlig strategi',
      },
    ],
  },
  {
    id: 'language',
    eyebrow: 'Sprog',
    title: 'Sprog & begreber',
    description:
      'Aktiviteter der udvider ordforråd og semantisk fleksibilitet gennem præcise valg.',
    games: [
      {
        id: 'word-weave',
        title: 'Word Weave',
        description:
          'Forbind nøgleord med præcise synonymer og styrk den begrebslige smidighed.',
        ctaLabel: 'Spil Word Weave',
        to: '/word-weave',
        icon: '/gameIcons_svg/word_weave_game_svg.svg',
        badge: 'Ny',
        focus: 'Semantisk fleksibilitet',
      },
      {
        id: 'word-search',
        title: 'Word Search',
        description:
          'Find skjulte ord i gitteret på kryds og tværs med fuld kontrol over størrelse og ordliste.',
        ctaLabel: 'Åbn Word Search',
        to: '/word-search',
        icon: '/gameIcons_svg/word_search_game_svg.svg',
        badge: 'Ny',
        focus: 'Visuel scanning & mønstre',
      },
    ],
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

          <div
            className="menu__carousel"
            role="list"
            aria-label={`${section.title} spil der træner ${section.eyebrow}`}
          >
            {section.games.map((game) => (
              <article key={game.id} className="menu__card" role="listitem">
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
