import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import WordWeaveGame from '../games/wordweave/WordWeaveGame'
import './NewCognitiveGames.css'

export default function WordWeaveScreen() {
  const navigate = useNavigate()

  return (
    <section className="menu game-page word-weave">
      <div className="menu__top-bar">
        <BrandLogo size={64} wordmarkSize="1.75rem" />
        <button
          type="button"
          className="menu__back-button"
          onClick={() => navigate('/overview/games')}
        >
          Tilbage til spiloversigt
        </button>
      </div>

      <header className="menu__header word-weave__header">
        <h1>Word Weave</h1>
        <p>Match ord med den præcise definition og opbyg en stærkere semantisk intuition.</p>
      </header>

      <div className="game-page__grid word-weave__layout">
        <WordWeaveGame />
      </div>
    </section>
  )
}
