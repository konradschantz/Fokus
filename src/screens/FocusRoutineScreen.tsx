import { useRef, useState } from 'react'
import BrandLogo from '../components/BrandLogo'
import './FocusRoutineScreen.css'

type RoutinePhase = {
  id: 'morning' | 'afternoon' | 'evening'
  icon: string
  label: string
  title: string
  summary: string
  steps: string[]
  notification: string
}

type NotificationPeriod = {
  id: RoutinePhase['id']
  label: string
  tone: string
}

const routinePhases: RoutinePhase[] = [
  {
    id: 'morning',
    icon: '🌞',
    label: 'Morgen',
    title: 'Start med lys og bevægelse',
    summary:
      'Væk kroppen med blidt lys og små bevægelser. Åbn vinduet, tag tre dybe åndedrag og fyld kroppen med energi.',
    steps: ['Et stort glas vand med et stænk citron', '5 minutters solhilsen eller blid udstrækning', 'Et øjeblik med taknemmelighed'],
    notification: 'Kl. 7:00 — Husk et glas vand og et smil. Din dag begynder nu 🌤️',
  },
  {
    id: 'afternoon',
    icon: '☀️',
    label: 'Eftermiddag',
    title: 'Bevar fokus og energi',
    summary:
      'Skru ned for tempoet og lad hjernen finde rytmen igen. En mindful pause gør dig klar til eftermiddagens opgaver.',
    steps: ['3 minutters box breathing', 'Stræk skuldrene og gå et par skridt', 'Planlæg dine næste to fokusblokke'],
    notification: 'Kl. 14:15 — Tid til en lille pause. Din hjerne elsker frisk luft 🌿',
  },
  {
    id: 'evening',
    icon: '🌙',
    label: 'Aften',
    title: 'Find ro og forbered søvnen',
    summary:
      'Slip dagen, skru ned for lyset og find en stille stund. Et roligt ritual hjælper både krop og sind til at lande.',
    steps: ['Dæmp lyset og sluk for skærme 30 minutter før sengetid', 'Guidet åndedræt eller kropsscanning', 'Skriv tre gode øjeblikke fra dagen'],
    notification: 'Kl. 21:30 — Dæmp lyset og tak for dagen 💫',
  },
]

const notificationPeriods: NotificationPeriod[] = [
  { id: 'morning', label: 'Morgenlys', tone: 'Blid energi og intention' },
  { id: 'afternoon', label: 'Eftermiddag', tone: 'Forny fokus og klarhed' },
  { id: 'evening', label: 'Aften', tone: 'Rolig afslutning på dagen' },
]

const notificationsByPeriod: Record<RoutinePhase['id'], string[]> = {
  morning: [
    'Godmorgen ☀️ Husk at tage 3 dybe åndedrag.',
    'Solstråle-check: Rejs dig, stræk kroppen og find lyset.',
  ],
  afternoon: [
    'Pauseklokke 🔔 Rejs dig og ryst skuldrene fri.',
    'Forny fokus – 5 minutters rolig vejrtrækning gør underværker.',
  ],
  evening: [
    'Dæmp lyset og tak for dagen 💫',
    'Sov godt 🌙 Skriv tre gode øjeblikke før du lukker øjnene.',
  ],
}

export default function FocusRoutineScreen() {
  const routineSectionRef = useRef<HTMLElement | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<RoutinePhase['id'] | null>('morning')
  const [activePeriod, setActivePeriod] = useState<RoutinePhase['id']>('morning')

  const handleScrollToRoutine = () => {
    routineSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="focus-page">
      <header className="focus-hero">
        <div className="focus-hero__background" aria-hidden="true">
          <div className="focus-hero__sun" />
          <div className="focus-hero__horizon" />
          <div className="focus-hero__ocean" />
        </div>

        <div className="focus-hero__content">
          <BrandLogo as="div" align="left" size={56} wordmarkSize="2.4rem" wordmarkText="Fokus" />
          <span className="focus-hero__eyebrow">Din dag med Fokus</span>
          <h1 className="focus-hero__title">Skab balance i din hverdag med personlige rutiner</h1>
          <p className="focus-hero__subtitle">
            Fokus guider dig gennem dagen med små øjeblikke af ro og klarhed. Fra solopgang til nat ro hjælper vi dig
            med at skabe rytme, nærvær og fornyet energi.
          </p>
          <button type="button" className="focus-hero__cta" onClick={handleScrollToRoutine}>
            Se din daglige rutine
          </button>
        </div>
      </header>

      <section className="focus-routine" ref={routineSectionRef} id="rutine">
        <header className="focus-section-header">
          <span className="focus-section-eyebrow">🕰️ Din dag i balance</span>
          <h2>Et roligt flow fra morgen til aften</h2>
          <p>
            Følg solens bevægelse gennem dagen. Tre enkle rutiner hjælper dig med at vågne, bevare fokus og lande blidt
            i aftenen.
          </p>
        </header>
        <div className="focus-timeline" role="list">
          {routinePhases.map((phase) => {
            const isExpanded = expandedPhase === phase.id
            return (
              <article key={phase.id} className={`focus-timeline__card ${isExpanded ? 'is-expanded' : ''}`} role="listitem">
                <button
                  type="button"
                  className="focus-timeline__toggle"
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="focus-timeline__icon" aria-hidden="true">
                    {phase.icon}
                  </span>
                  <div>
                    <p className="focus-timeline__label">{phase.label}</p>
                    <h3>{phase.title}</h3>
                  </div>
                  <span className="focus-timeline__chevron" aria-hidden="true" />
                </button>
                <p className="focus-timeline__summary">{phase.summary}</p>
                <div className="focus-timeline__details" hidden={!isExpanded}>
                  <p className="focus-timeline__details-title">Se rutinen</p>
                  <ul>
                    {phase.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
                <figure className="focus-timeline__bubble">
                  <figcaption>💬 Eksempel på notifikation</figcaption>
                  <blockquote>{phase.notification}</blockquote>
                </figure>
              </article>
            )
          })}
        </div>
      </section>

      <section className="focus-notifications" aria-labelledby="notifications-heading">
        <header className="focus-section-header">
          <span className="focus-section-eyebrow">🔔 Små påmindelser, stor effekt</span>
          <h2 id="notifications-heading">Se hvordan Fokus guider dig gennem dagen</h2>
          <p>
            Vælg tidspunktet på dagen og se eksempler på de beskeder, der lander på din telefon. Blide skub hjælper dig
            med at holde rytmen i gang.
          </p>
        </header>

        <div className="focus-notifications__switcher" role="tablist" aria-label="Vælg tidspunkt">
          {notificationPeriods.map((period) => (
            <button
              key={period.id}
              type="button"
              role="tab"
              aria-selected={activePeriod === period.id}
              className={`focus-notifications__chip ${activePeriod === period.id ? 'is-active' : ''}`}
              onClick={() => setActivePeriod(period.id)}
            >
              <span>{period.label}</span>
              <small>{period.tone}</small>
            </button>
          ))}
        </div>

        <div className="focus-notifications__mockup" role="tabpanel" aria-live="polite">
          <div className="focus-phone">
            <div className="focus-phone__notch" />
            <div className="focus-phone__screen">
              <div className="focus-phone__status">{notificationPeriods.find((period) => period.id === activePeriod)?.label}</div>
              <ul className="focus-phone__messages">
                {notificationsByPeriod[activePeriod].map((message) => (
                  <li key={message} className="focus-phone__message">
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="focus-science" aria-labelledby="science-heading">
        <div className="focus-science__overlay" />
        <div className="focus-science__content">
          <span className="focus-section-eyebrow">🌊 Videnskaben bag Fokus</span>
          <h2 id="science-heading">Ro, evidens og nærvær i samme oplevelse</h2>
          <p>
            Fokus bygger på principper fra kognitiv træning, søvnforskning og mindfulness. Små daglige vaner – som lys,
            bevægelse og taknemmelighed – har dokumenteret effekt på koncentration og velvære.
          </p>
          <p>
            Med en rytme, der følger naturens tempo, hjælper Fokus dig med at skabe varige vaner. Resultatet er en hverdag
            med mere klarhed, overskud og ro.
          </p>
        </div>
      </section>
    </div>
  )
}
