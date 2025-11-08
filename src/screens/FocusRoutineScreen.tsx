import { useEffect, useRef, useState } from 'react'
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

type QuickStartOption = {
  id: string
  label: string
  description: string
  duration: string
  isMini?: boolean
}

type WeeklyDay = {
  label: string
  completed: boolean
}

type StoredProgress = {
  streakCount: number
  lastCompletionDate: string | null
  weekStart: string
  weeklyProgress: WeeklyDay[]
}

const quickStartOptions: QuickStartOption[] = [
  {
    id: 'breath-mini',
    label: '1 minut vejrtrækning',
    description: 'En mikro-pause du kan tage mellem møder.',
    duration: '1 min',
    isMini: true,
  },
  {
    id: 'breath-box',
    label: '5 minutters box breathing',
    description: 'Din seneste favorit til at skabe ro.',
    duration: '5 min',
  },
  {
    id: 'movement-reset',
    label: '3 minutters stræk',
    description: 'Giv kroppen et lille boost midt på dagen.',
    duration: '3 min',
    isMini: true,
  },
]

const weekdayLabels = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']

const createEmptyWeek = (): WeeklyDay[] => weekdayLabels.map((label) => ({ label, completed: false }))

const getWeekStart = (date: Date) => {
  const current = new Date(date)
  const day = current.getDay()
  const diff = day === 0 ? -6 : 1 - day
  current.setDate(current.getDate() + diff)
  current.setHours(0, 0, 0, 0)
  return current.toISOString().slice(0, 10)
}

const getWeekdayIndex = (date: Date) => {
  const day = date.getDay()
  return (day + 6) % 7
}

const getIsoDate = (date: Date) => {
  const clone = new Date(date)
  clone.setHours(0, 0, 0, 0)
  return clone.toISOString().slice(0, 10)
}

const QUICK_START_STORAGE_KEY = 'focus.quick-start-preference'
const PROGRESS_STORAGE_KEY = 'focus.routine-progress'
const WEEKLY_GOAL = 5
const MS_PER_DAY = 86_400_000

const dailyFocus = {
  title: 'Dagens fokus: 5 min vejrtrækning',
  description: 'Et roligt åndedræts-anker, der hjælper dig med at lande og starte dagen bevidst.',
  icon: '🌬️',
  reminderTime: '09:00',
  reminderText: 'Påmindelsen dukker op hver dag kl. 09:00. Tag fem rolige, dybe åndedrag.',
}

export default function FocusRoutineScreen() {
  const routineSectionRef = useRef<HTMLElement | null>(null)
  const celebrationTimeoutRef = useRef<number | null>(null)
  const storedProgressRef = useRef<StoredProgress | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<RoutinePhase['id'] | null>('morning')
  const [activePeriod, setActivePeriod] = useState<RoutinePhase['id']>('morning')
  const [isQuickStartActive, setIsQuickStartActive] = useState(false)

  if (storedProgressRef.current === null && typeof window !== 'undefined') {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (raw) {
      try {
        storedProgressRef.current = JSON.parse(raw) as StoredProgress
      } catch (error) {
        storedProgressRef.current = null
      }
    }
  }

  const today = new Date()
  const todayIso = getIsoDate(today)
  const currentWeekStart = getWeekStart(today)

  const [selectedQuickStartId, setSelectedQuickStartId] = useState(() => {
    if (typeof window === 'undefined') {
      return quickStartOptions[0].id
    }

    const storedPreference = window.localStorage.getItem(QUICK_START_STORAGE_KEY)
    const hasMatch = quickStartOptions.some((option) => option.id === storedPreference)
    return hasMatch && storedPreference ? storedPreference : quickStartOptions[0].id
  })

  const [streakCount, setStreakCount] = useState(() => storedProgressRef.current?.streakCount ?? 2)
  const [lastCompletionDate, setLastCompletionDate] = useState<string | null>(
    storedProgressRef.current?.lastCompletionDate ?? null,
  )
  const [weekStart, setWeekStart] = useState(() => storedProgressRef.current?.weekStart ?? currentWeekStart)
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyDay[]>(() => {
    const stored = storedProgressRef.current
    if (stored?.weekStart === currentWeekStart && Array.isArray(stored.weeklyProgress)) {
      const template = createEmptyWeek()
      return template.map((day, index) => ({
        ...day,
        completed: Boolean(stored.weeklyProgress[index]?.completed),
      }))
    }
    return createEmptyWeek()
  })
  const [isCelebrating, setIsCelebrating] = useState(false)

  const handleScrollToRoutine = () => {
    routineSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const selectedQuickStart =
    quickStartOptions.find((option) => option.id === selectedQuickStartId) ?? quickStartOptions[0]
  const completedThisWeek = weeklyProgress.filter((day) => day.completed).length
  const progressValue = Math.min(completedThisWeek, WEEKLY_GOAL)
  const progressPercent = Math.min(100, (progressValue / WEEKLY_GOAL) * 100)
  const hasCompletedToday = lastCompletionDate === todayIso
  const quickStartButtonLabel = hasCompletedToday
    ? 'Rutinen er fuldført i dag'
    : isQuickStartActive
      ? 'Rutinen er i gang...'
      : `Start ${selectedQuickStart.label}`
  const quickStartStatusMessage = hasCompletedToday
    ? 'Du har allerede markeret dagens rutine. Gentag gerne for ekstra ro.'
    : isQuickStartActive
      ? 'Din mikro-rutine er startet – find ro i åndedrættet.'
      : 'Tryk på knappen for at komme i gang med det samme.'

  const handleSelectQuickStart = (optionId: string) => {
    setSelectedQuickStartId(optionId)
    if (hasCompletedToday) {
      setIsQuickStartActive(false)
    }
  }

  const handleStartQuickStart = () => {
    setIsQuickStartActive(true)
    setIsCelebrating(false)
    if (celebrationTimeoutRef.current) {
      window.clearTimeout(celebrationTimeoutRef.current)
    }
  }

  const handleCompleteRoutine = () => {
    const isoToday = todayIso

    let nextStreak = 1
    if (lastCompletionDate) {
      const last = new Date(lastCompletionDate)
      const lastIso = getIsoDate(last)
      const diff = (new Date(isoToday).getTime() - new Date(lastIso).getTime()) / MS_PER_DAY
      if (diff === 0) {
        nextStreak = streakCount
      } else if (diff === 1) {
        nextStreak = streakCount + 1
      } else {
        nextStreak = 1
      }
    }

    const newWeekStart = getWeekStart(new Date())
    const dayIndex = getWeekdayIndex(new Date())

    setWeeklyProgress((previous) => {
      const base = newWeekStart === weekStart ? previous : createEmptyWeek()
      const updated = base.map((day, index) => ({
        ...day,
        completed: index === dayIndex ? true : day.completed,
      }))
      if (newWeekStart !== weekStart) {
        setWeekStart(newWeekStart)
      }
      return updated
    })

    setStreakCount(nextStreak)
    setLastCompletionDate(isoToday)
    setIsQuickStartActive(false)
    setIsCelebrating(true)

    if (celebrationTimeoutRef.current) {
      window.clearTimeout(celebrationTimeoutRef.current)
    }

    celebrationTimeoutRef.current = window.setTimeout(() => {
      setIsCelebrating(false)
    }, 2600)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(QUICK_START_STORAGE_KEY, selectedQuickStartId)
  }, [selectedQuickStartId])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const payload: StoredProgress = {
      streakCount,
      lastCompletionDate,
      weekStart,
      weeklyProgress,
    }

    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(payload))
  }, [streakCount, lastCompletionDate, weekStart, weeklyProgress])

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        window.clearTimeout(celebrationTimeoutRef.current)
      }
    }
  }, [])

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

      <section className="focus-daily" aria-labelledby="daily-focus-heading">
        <h2 id="daily-focus-heading" className="sr-only">
          Dagens vane og hurtig start
        </h2>

        <article className="focus-daily__cue" aria-labelledby="daily-cue-title">
          <span className="focus-daily__eyebrow">Gør det synligt</span>
          <h3 id="daily-cue-title">{dailyFocus.title}</h3>
          <p>{dailyFocus.description}</p>
          <div className="focus-daily__reminder" role="status" aria-live="polite">
            <span className="focus-daily__icon" aria-hidden="true">
              {dailyFocus.icon}
            </span>
            <div>
              <p className="focus-daily__reminder-time">Påmindelse kl. {dailyFocus.reminderTime}</p>
              <p className="focus-daily__reminder-text">{dailyFocus.reminderText}</p>
            </div>
          </div>
        </article>

        <article className="focus-quick-start" aria-labelledby="quick-start-heading">
          <span className="focus-quick-start__eyebrow">Gør det nemt</span>
          <h3 id="quick-start-heading">Start din rutine med ét tryk</h3>
          <p className="focus-quick-start__memory">Appen husker: {selectedQuickStart.description}</p>

          <div className="focus-quick-start__actions">
            <button
              type="button"
              className="focus-quick-start__button"
              onClick={handleStartQuickStart}
              disabled={isQuickStartActive && !hasCompletedToday}
            >
              {quickStartButtonLabel}
            </button>
            <p className="focus-quick-start__status">{quickStartStatusMessage}</p>

            {isQuickStartActive && !hasCompletedToday && (
              <button type="button" className="focus-quick-start__complete" onClick={handleCompleteRoutine}>
                Markér rutinen som fuldført
              </button>
            )}
          </div>

          <p className="focus-quick-start__hint">Start småt, men konsekvent – vælg en mini-version når tiden er knap.</p>
          <div className="focus-quick-start__options">
            {quickStartOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`focus-quick-start__chip ${selectedQuickStartId === option.id ? 'is-active' : ''} ${
                  option.isMini ? 'is-mini' : ''
                }`}
                onClick={() => handleSelectQuickStart(option.id)}
                aria-pressed={selectedQuickStartId === option.id}
              >
                <span>{option.label}</span>
                <small>{option.duration}</small>
              </button>
            ))}
          </div>

          {isCelebrating && (
            <div className="focus-celebration" role="status" aria-live="assertive">
              <span className="focus-quick-start__reward-label">Gør det tilfredsstillende</span>
              <span className="focus-celebration__icon" aria-hidden="true">
                🌱
              </span>
              <p>Stærkt gået! Din vane vokser – kom tilbage i morgen for at bygge videre.</p>
            </div>
          )}
        </article>
      </section>

      <section className="focus-progress" aria-labelledby="progress-heading">
        <header className="focus-section-header">
          <span className="focus-section-eyebrow">📈 Gør det konkret og målbart</span>
          <h2 id="progress-heading">Hold øje med din udvikling</h2>
          <p>
            {progressValue}/{WEEKLY_GOAL} rutiner gennemført denne uge. Hver lille handling tæller mod en stærk vane.
          </p>
        </header>

        <div className="focus-progress__grid">
          <article className="focus-progress__card focus-progress__card--streak">
            <h3>{streakCount} dage i træk</h3>
            <p>
              Bliv ved! Når du følger rytmen dag efter dag, bygger du en vane, der holder.
            </p>
            <div
              className="focus-progress__bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={WEEKLY_GOAL}
              aria-valuenow={progressValue}
              aria-label="Ugentlig fremdrift"
            >
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <small className="focus-progress__goal">Mål: {WEEKLY_GOAL} rutiner om ugen</small>
          </article>

          <article className="focus-progress__card focus-progress__card--week" aria-label="Ugens rutineoversigt">
            <p>Marker dagene, efterhånden som du gennemfører rutinen. En tydelig rytme holder motivationen høj.</p>
            <ul className="focus-progress__week">
              {weeklyProgress.map((day, index) => (
                <li
                  key={`${day.label}-${index}`}
                  className={`focus-progress__day ${day.completed ? 'is-complete' : ''}`}
                  aria-label={`${day.label}: ${day.completed ? 'Gennemført' : 'Ikke gennemført'}`}
                >
                  <span className="focus-progress__day-label">{day.label}</span>
                  <span className="focus-progress__day-status" aria-hidden="true">
                    {day.completed ? '●' : '○'}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

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
