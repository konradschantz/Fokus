import { useState } from 'react'
import ReactionTest from '../ReactionTest'
import '../ReactionTest.css'

export default function ReactionTestScreen() {
  const [hasStarted, setHasStarted] = useState(false)

  if (!hasStarted) {
    return (
      <section className="reaction-test__intro">
        <div className="reaction-test__intro-card">
          <p className="reaction-test__eyebrow">Reaktionstest</p>
          <h1 className="reaction-test__intro-title">Test din reaktionstid</h1>
          <p className="reaction-test__intro-text">
            Træn dit fokus og mål hvor hurtigt du reagerer på et visuelt signal.
          </p>
          <ul className="reaction-test__intro-list">
            <li>Tryk på &quot;Start spil&quot; for at begynde en 3 sekunders nedtælling.</li>
            <li>Feltet bliver rødt. Vent, til det skifter til grønt.</li>
            <li>Klik så hurtigt som muligt, når du ser det grønne signal.</li>
            <li>Du får 30 sekunder til at samle forsøg og se dit gennemsnit.</li>
          </ul>
          <div className="reaction-test__intro-actions">
            <button type="button" className="reaction-test__start-button" onClick={() => setHasStarted(true)}>
              Start spil
            </button>
          </div>
        </div>
      </section>
    )
  }

  return <ReactionTest />
}
