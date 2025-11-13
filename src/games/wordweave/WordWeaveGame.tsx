import { useEffect, useMemo, useRef, useState } from 'react'
import { shuffle } from '../../utils/shuffle'
import './WordWeaveGame.css'

type GameStatus = 'idle' | 'active' | 'review' | 'finished'

type WordPrompt = {
  word: string
  correct: string
  distractors: string[]
}

const TOTAL_ROUNDS = 10

const prompts: WordPrompt[] = [
  {
    word: 'Adaptiv',
    correct: 'I stand til at tilpasse sig hurtigt til nye forhold',
    distractors: [
      'Fokuseret på gentagelse uden variation',
      'Uimodtagelig over for ydre påvirkninger',
      'Optaget af detaljer frem for helhed',
    ],
  },
  {
    word: 'Analytisk',
    correct: 'Arbejder systematisk med at nedbryde et problem i dele',
    distractors: [
      'Handler impulsivt uden overvejelse',
      'Foretrækker ustrukturerede og tilfældige input',
      'Fokuserer på sociale relationer frem for data',
    ],
  },
  {
    word: 'Resonere',
    correct: 'At ræsonnere sig frem til en konklusion ved logisk tænkning',
    distractors: [
      'At gentage noget uden at forstå det',
      'At reagere følelsesladet uden refleksion',
      'At træffe beslutninger alene på intuition',
    ],
  },
  {
    word: 'Abstraktion',
    correct: 'At udlede det væsentlige og skjule detaljer for at skabe overblik',
    distractors: [
      'At fokusere udelukkende på konkrete sanseindtryk',
      'At gentage en handling mekanisk uden forståelse',
      'At gemme informationer uden at bearbejde dem',
    ],
  },
  {
    word: 'Deduktion',
    correct: 'At udlede noget specifikt fra en generel regel',
    distractors: [
      'At indsamle data uden at konkludere',
      'At gætte uden nogen form for evidens',
      'At kombinere idéer for at skabe noget nyt',
    ],
  },
  {
    word: 'Intuitiv',
    correct: 'At handle hurtigt ud fra en stærk mavefornemmelse',
    distractors: [
      'At forlange detaljeret dokumentation før enhver beslutning',
      'At afvise ændringer uanset kontekst',
      'At analysere data i timevis uden konklusion',
    ],
  },
  {
    word: 'Syntese',
    correct: 'At samle forskellige dele til et nyt, meningsfuldt hele',
    distractors: [
      'At opdele noget i mindre dele for at forstå det',
      'At kassere information, der ikke passer til forventningerne',
      'At gentage et kendt mønster uden at ændre det',
    ],
  },
  {
    word: 'Fokuseret',
    correct: 'Evnen til at fastholde opmærksomheden på ét mål',
    distractors: [
      'At skifte aktivitet konstant for at undgå kedsomhed',
      'At vælge spontane inputs frem for planlagte aktiviteter',
      'At lade sig styre af tilfældige indtryk',
    ],
  },
  {
    word: 'Strategisk',
    correct: 'At planlægge målrettet med blik for fremtidige scenarier',
    distractors: [
      'At improvisere uden at se fremad',
      'At fokusere på enkeltstående opgaver uden sammenhæng',
      'At arbejde kun med kortsigtede løsninger',
    ],
  },
  {
    word: 'Modulere',
    correct: 'At justere en indsats trinvis for at finjustere resultatet',
    distractors: [
      'At fastholde én intensitet uanset behov',
      'At undgå forandring for enhver pris',
      'At vælge ekstreme løsninger frem for balance',
    ],
  },
  {
    word: 'Dynamisk',
    correct: 'Præget af energi og bevægelse, i stand til at ændre retning',
    distractors: [
      'Fastlåst og ufleksibel i sin tilgang',
      'Uinteresseret i nye muligheder',
      'Opbygget til at modstå enhver forandring',
    ],
  },
  {
    word: 'Konsensus',
    correct: 'En bred enighed opnået gennem dialog og afvejninger',
    distractors: [
      'Et kompromis, hvor ingen har fået indflydelse',
      'En hurtig beslutning truffet af én person',
      'Et tilfældigt udfald uden diskussion',
    ],
  },
]

const roundsToPlay = Math.min(TOTAL_ROUNDS, prompts.length)

export default function WordWeaveGame() {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [roundOrder, setRoundOrder] = useState<number[]>([])
  const [roundIndex, setRoundIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('Start Word Weave for at træne din verbale fleksibilitet.')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const timeoutRef = useRef<number | null>(null)

  const currentPrompt = useMemo(() => {
    if (status === 'idle' || roundOrder.length === 0) {
      return null
    }
    return prompts[roundOrder[roundIndex]]
  }, [roundIndex, roundOrder, status])

  useEffect(() => {
    if (status === 'active' && currentPrompt) {
      setOptions(shuffle([currentPrompt.correct, ...currentPrompt.distractors]))
      setSelected(null)
    }
  }, [currentPrompt, status])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const startGame = () => {
    const order = shuffle(Array.from({ length: prompts.length }, (_, index) => index)).slice(
      0,
      roundsToPlay,
    )
    setRoundOrder(order)
    setRoundIndex(0)
    setScore(0)
    setStreak(0)
    setFeedback('Vælg den definition, der bedst beskriver ordet.')
    setStatus('active')
  }

  const goToSummary = (finalScore: number) => {
    setStatus('finished')
    setBestScore((previous) => Math.max(previous, finalScore))
    setFeedback('Runden er slut. Start en ny for at væve endnu flere ordforbindelser.')
  }

  const handleSelect = (option: string) => {
    if (status !== 'active' || currentPrompt === null || selected !== null) {
      return
    }

    const isCorrect = option === currentPrompt.correct
    const nextScore = isCorrect ? score + 1 : score
    const nextStreak = isCorrect ? streak + 1 : 0

    setSelected(option)
    setScore(nextScore)
    setStreak(nextStreak)
    setBestStreak((previous) => Math.max(previous, nextStreak))
    setFeedback(
      isCorrect
        ? 'Korrekt! Din verbale intuition er skarp.'
        : `Næsten! Det korrekte svar er: ${currentPrompt.correct}.`,
    )
    setStatus('review')

    timeoutRef.current = window.setTimeout(() => {
      const nextIndex = roundIndex + 1
      if (nextIndex >= roundsToPlay) {
        goToSummary(nextScore)
      } else {
        setRoundIndex(nextIndex)
        setStatus('active')
        setFeedback('Fortsæt og vælg den næste præcise definition.')
      }
    }, 1300)
  }

  const resetGame = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
    setStatus('idle')
    setRoundOrder([])
    setRoundIndex(0)
    setOptions([])
    setSelected(null)
    setScore(0)
    setStreak(0)
    setFeedback('Start Word Weave for at træne din verbale fleksibilitet.')
  }

  return (
    <div className="word-weave-game">
      <div className="word-weave-game__stage">
        <p className="word-weave-game__status" role="status">
          {feedback}
        </p>

        <div className="word-weave-game__prompt" aria-live="polite">
          <span className="word-weave-game__label">Ord</span>
          <strong className="word-weave-game__word">{currentPrompt?.word ?? 'Klar?'}</strong>
        </div>

        <div className="word-weave-game__options" role="list">
          {options.map((option) => {
            const isChosen = selected === option
            const isCorrect = currentPrompt?.correct === option
            const optionState =
              selected === null
                ? ''
                : isCorrect
                  ? 'is-correct'
                  : isChosen
                    ? 'is-incorrect'
                    : ''

            return (
              <button
                key={option}
                type="button"
                className={`word-weave-game__option ${optionState}`}
                onClick={() => handleSelect(option)}
                disabled={status !== 'active'}
              >
                {option}
              </button>
            )
          })}
        </div>

        <div className="word-weave-game__actions">
          <button
            type="button"
            className="menu__primary-button"
            onClick={startGame}
            disabled={status === 'active'}
          >
            Start Word Weave
          </button>
          <button type="button" className="menu__secondary-button" onClick={resetGame}>
            Nulstil
          </button>
        </div>
      </div>

      <aside className="game-scoreboard word-weave-game__scoreboard">
        <h2 className="game-scoreboard__title">Sprogdata</h2>
        <dl className="game-scoreboard__rows">
          <div className="game-scoreboard__row">
            <dt>Score</dt>
            <dd>{score}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Bedste score</dt>
            <dd>{bestScore}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Streak</dt>
            <dd>{streak}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Bedste streak</dt>
            <dd>{bestStreak}</dd>
          </div>
          <div className="game-scoreboard__row">
            <dt>Runde</dt>
            <dd>
              {status === 'idle'
                ? '-'
                : `${Math.min(roundIndex + 1, roundsToPlay)} / ${roundsToPlay}`}
            </dd>
          </div>
        </dl>
        <p className="word-weave-game__hint">
          Word Weave træner din semantiske smidighed. Find det mest præcise match og byg stærkere
          forbindelser i dit ordforråd.
        </p>
      </aside>
    </div>
  )
}
