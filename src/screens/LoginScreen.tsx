import { FormEvent, useState } from 'react'
import BrandLogo from '../components/BrandLogo'

type LoginScreenProps = {
  onSkip: () => void
}

export default function LoginScreen({ onSkip }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Placeholder for future authentication logic
  }

  return (
    <div
      style={{
        width: 'min(480px, 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.75rem',
      }}
    >
      <BrandLogo align="center" size={72} wordmarkSize="2.2rem" />

      <div
        className="menu"
        style={{
          width: '100%',
          padding: 'clamp(2rem, 5vw, 2.75rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxShadow: '0 24px 60px rgba(45, 156, 219, 0.15)',
        }}
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>Velkommen tilbage</h1>
          <p style={{ margin: 0, color: '#475569', fontSize: '1.05rem' }}>
            Log ind for at fortsætte din Fokus-oplevelse
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#1e293b', fontWeight: 600 }}>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="din@email.com"
              required
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '0.9rem',
                border: '1px solid rgba(45, 156, 219, 0.35)',
                background: 'rgba(255, 255, 255, 0.9)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.65)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                color: '#0f172a',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#1e293b', fontWeight: 600 }}>
            Adgangskode
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '0.9rem',
                border: '1px solid rgba(45, 156, 219, 0.35)',
                background: 'rgba(255, 255, 255, 0.9)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.65)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                color: '#0f172a',
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              marginTop: '0.5rem',
              padding: '0.95rem 1.5rem',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #2D9CDB 0%, #56CCF2 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '1.05rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
              boxShadow: '0 16px 32px rgba(45, 156, 219, 0.25)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            Log ind
          </button>
        </form>

        <button
          type="button"
          onClick={onSkip}
          style={{
            padding: '0.9rem 1.5rem',
            borderRadius: '999px',
            border: '1px solid rgba(45, 156, 219, 0.5)',
            background: '#fff',
            color: '#2D9CDB',
            fontWeight: 600,
            fontSize: '1rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          Spring login over
        </button>
      </div>
    </div>
  )
}
