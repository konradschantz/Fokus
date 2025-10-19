import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

type MeditationExercise = {
  id: string
  title: string
  eyebrow: string
  description: string
  cta: string
  to: string
}

const exercises: MeditationExercise[] = [
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    eyebrow: 'Guidet vejrtrækning',
    description:
      'Balancer åndedrættet i fire faser på fire sekunder. Følg cirklens bevægelse og stemmen i teksten for at finde en rolig rytme.',
    cta: 'Åbn Box Breathing',
    to: '/meditation/box-breathing',
  },
  {
    id: 'yoga-candle',
    title: 'Yoga meditation (levende lys)',
    eyebrow: 'Fem minutter i ro',
    description:
      'Find et stille fokus med et roligt lys i midten og en blid klokke i starten og slutningen. Timeren hjælper dig gennem fem minutter.',
    cta: 'Åbn yoga meditation',
    to: '/meditation/yoga-candle',
  },
]

export default function MeditationHubScreen() {
  const navigate = useNavigate()

  return (
    <section className="menu meditation-page">
      <div className="menu__top-bar">
        <BrandLogo size={64} wordmarkSize="1.75rem" />
        <button type="button" className="menu__back-button" onClick={() => navigate('/')}>Tilbage til menu</button>
      </div>

      <header className="meditation-page__header">
        <h1>Meditation</h1>
        <p>
          Vælg mellem to guidede meditationer. Box Breathing hjælper dig med at styre åndedrættet trin for trin,
          mens yoga meditationen giver fem rolige minutter med et levende lys.
        </p>
      </header>

      <div className="meditation-hub__grid">
        {exercises.map((exercise) => (
          <article key={exercise.id} className="meditation-hub-card">
            <div className="meditation-hub-card__eyebrow">{exercise.eyebrow}</div>
            <h2 id={`${exercise.id}-title`}>{exercise.title}</h2>
            <p id={`${exercise.id}-description`}>{exercise.description}</p>
            <Link
              to={exercise.to}
              className="meditation-hub-card__link"
              aria-labelledby={`${exercise.id}-title`}
              aria-describedby={`${exercise.id}-description`}
            >
              {exercise.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
