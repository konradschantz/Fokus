import { useState } from 'react'
import './App.css'
import ReactionTest from './ReactionTest'

type GameId = 'reaction-test'

interface GameDefinition {
  id: GameId
  name: string
  description: string
  startLabel: string
}

const games: GameDefinition[] = [
  {
    id: 'reaction-test',
    name: 'Reaktionstest',
    description:
      'Hvor hurtigt kan du reagere? Klik, så snart skærmen skifter farve, og se dine bedste tider.',
    startLabel: 'Start reaktionstest',
  },
]

function App() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null)

  if (activeGame === 'reaction-test') {
    return <ReactionTest onExit={() => setActiveGame(null)} />
  }

  return (
    <main className="app">
      <div className="menu">
        <header className="menu__header">
          <h1>Fokus</h1>
          <p>Vælg et spil for at komme i gang.</p>
        </header>
        <section className="menu__grid">
          {games.map((game) => (
            <article key={game.id} className="menu__card">
              <h2>{game.name}</h2>
              <p>{game.description}</p>
              <button type="button" onClick={() => setActiveGame(game.id)}>
                {game.startLabel}
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

export default App
