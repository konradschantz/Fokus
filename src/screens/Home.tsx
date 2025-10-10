import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadHighscores, type MemoryHighscores } from '../utils/memoryHighscores'

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
    id: 'memory',
    name: 'Memory',
    description:
      'Vend to kort ad gangen og find alle par hurtigst muligt. Flere sværhedsgrader og highscores.',
    path: '/memory',
    startLabel: 'Start memory',
  },
]

export default function Home() {
  const [highscores, setHighscores] = useState<MemoryHighscores>(() => loadHighscores())

  useEffect(() => {
    const updateScores = () => {
      setHighscores(loadHighscores())
    }

    updateScores()

    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('storage', updateScores)
    return () => {
      window.removeEventListener('storage', updateScores)
    }
  }, [])

  const easyScore = highscores.easy
  const hasEasyScore = easyScore.bestMoves !== null && easyScore.bestTimeMs !== null

  return (
    <div className="menu">
      <header className="menu__header">
        <h1>Fokus</h1>
        <p>Vælg et spil for at komme i gang.</p>
      </header>

      <section
        style={{
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          borderRadius: '1rem',
          marginBottom: '1.5rem',
          padding: '1rem 1.25rem',
          fontSize: '0.95rem',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
          Bedste hukommelses-score (Let):
        </strong>
        {hasEasyScore ? (
          <span>
            {easyScore.bestMoves} træk · {Math.max(0, Math.floor(easyScore.bestTimeMs! / 1000))} s
          </span>
        ) : (
          <span>–</span>
        )}
      </section>

      <section className="menu__grid">
        {games.map((game) => (
          <article key={game.id} className="menu__card">
            <h2>{game.name}</h2>
            <p>{game.description}</p>
            <Link to={game.path}>
              {game.startLabel}
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
