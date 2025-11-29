import { MouseEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import './App.css'
import OverviewScreen from './screens/OverviewScreen'
import MemoryGame from './screens/MemoryGame'
import ReactionTestScreen from './screens/ReactionTestScreen'
import SortingGameScreen from './screens/SortingGameScreen'
import MeditationHubScreen from './screens/MeditationHubScreen'
import MeditationBoxBreathingScreen from './screens/MeditationBoxBreathingScreen'
import MeditationYogaCandleScreen from './screens/MeditationYogaCandleScreen'
import OddOneOutScreen from './screens/OddOneOutScreen'
import LoginScreen from './screens/LoginScreen'
import PuzzleBloxScreen from './screens/PuzzleBloxScreen'
import OverviewGamesScreen from './screens/OverviewGamesScreen'
import PatternPulseScreen from './screens/PatternPulseScreen'
import SpatialSweepScreen from './screens/SpatialSweepScreen'
import MindMathScreen from './screens/MindMathScreen'
import FocusFlowScreen from './screens/FocusFlowScreen'
import WordWeaveScreen from './screens/WordWeaveScreen'
import WordSearchScreen from './screens/WordSearchScreen'
import BrandLogo from './components/BrandLogo'

type ThemeMode = 'calm' | 'focus'

type AppChromeProps = {
  mode: ThemeMode
  onSetMode: (mode: ThemeMode) => void
  children: ReactNode
  onBack?: () => void
  canGoBack?: boolean
  onNavigate?: (to: string) => void
  hideTopBar?: boolean
}

type NavLink = {
  to: string
  label: string
  description?: string
}

const navLinks: NavLink[] = [
  { to: '/overview', label: 'Forside', description: 'Din fokus-hub' },
  { to: '/overview/games', label: 'Games', description: 'Mini udfordringer' },
  { to: '/meditation', label: 'Meditationer', description: 'Åndedræt & ro' },
]

function AppChrome({
  mode,
  onSetMode,
  children,
  onBack,
  canGoBack = true,
  onNavigate,
  hideTopBar = false,
}: AppChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleOverlayClick = () => {
    setMenuOpen(false)
  }

  const handleModeSelect = (nextMode: ThemeMode) => {
    onSetMode(nextMode)
  }

  const modeLabel = useMemo(
    () => (mode === 'focus' ? 'Focus Mode' : 'Calm Mode'),
    [mode],
  )

  const isLinkActive = (to: string) => {
    if (to === '/overview') {
      return location.pathname === to
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  const createLinkHandler = (to: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate) {
      event.preventDefault()
      onNavigate(to)
    }
    setMenuOpen(false)
  }

  return (
    <main className={`app app--${mode} ${hideTopBar ? 'app--fullbleed' : ''}`}>
      <span className="app__halo app__halo--one" aria-hidden="true" />
      <div className="app__inner">
        {!hideTopBar && (
        <header className="app-shell__top" aria-label="Global navigation">
          <div className="app-shell__brand-row">
            {onBack ? (
              <button
                type="button"
                className="app-shell__back"
                onClick={onBack}
                disabled={!canGoBack}
                aria-disabled={!canGoBack}
                aria-label="Gå tilbage"
              >
                <span aria-hidden="true">←</span>
                Tilbage
              </button>
            ) : (
              <span className="app-shell__back-placeholder" aria-hidden="true" />
            )}
            <div className="app-shell__brand">
              <div className="app-shell__brand-left">
                <BrandLogo
                  as="div"
                  align="left"
                  size={55}
                  wordmarkSize="clamp(1.35rem, 3vw, 1.85rem)"
                  wordmarkText="Fokus"
                />
                <p className="app-shell__tagline">Mental developing studio</p>
              </div>
              <button
                type="button"
                className={`app-shell__burger app-shell__brand-burger ${menuOpen ? 'is-open' : ''}`}
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="app-shell-menu"
                aria-label={menuOpen ? 'Luk hovedmenu' : 'Åbn hovedmenu'}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
           
        
          </div>

          <div className="app-shell__primary">
            <nav className="app-shell__primary-nav" aria-label="Primær navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`app-shell__nav-link ${isLinkActive(link.to) ? 'is-active' : ''}`}
                  onClick={createLinkHandler(link.to)}
                >
                  <span>{link.label}</span>
                  {link.description ? (
                    <span className="app-shell__nav-sublabel">{link.description}</span>
                  ) : null}
                </Link>
              ))}
            </nav>

         
          </div>
        </header>
        )}

        <div className="app-shell__content" aria-live="polite">

          {children}
        </div>
      </div>

      <nav
        id="app-shell-menu"
        className={`app-shell__drawer ${menuOpen ? 'is-open' : ''}`}
        aria-label="Sekundær navigation"
      >
        <div className="app-shell__drawer-inner">
          <div className="app-shell__drawer-header">
            <div className="app-shell__drawer-title-row">
              <p className="app-shell__drawer-title">Quick Access</p>
              <button
                type="button"
                className="app-shell__drawer-burger app-shell__burger"
                onClick={() => setMenuOpen(false)}
                aria-label="Luk Quick Access-menu"
                aria-expanded={menuOpen}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
            <div className="app-shell__drawer-switch" role="group" aria-label="Skift tema">
              <button
                type="button"
                className={`app-shell__mode-option ${mode === 'calm' ? 'is-active' : ''}`}
                onClick={() => handleModeSelect('calm')}
                aria-pressed={mode === 'calm'}
              >
                Calm Mode
              </button>
              <button
                type="button"
                className={`app-shell__mode-option ${mode === 'focus' ? 'is-active' : ''}`}
                onClick={() => handleModeSelect('focus')}
                aria-pressed={mode === 'focus'}
              >
                Focus Mode
              </button>
            </div>
          </div>

          <ul className="app-shell__drawer-list">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`app-shell__drawer-link ${isLinkActive(link.to) ? 'is-active' : ''}`}
                  onClick={createLinkHandler(link.to)}
                >
                  <span className="app-shell__drawer-link-label">{link.label}</span>
                  {link.description ? (
                    <span className="app-shell__drawer-link-description">{link.description}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>

          <div className="app-shell__drawer-meta">
            <p>Én samlet verden til fokus, ro og styrke.</p>
            <span className="app-shell__drawer-pill">Always-on beta</span>
          </div>
        </div>
      </nav>

      <button
        type="button"
        className={`app-shell__overlay ${menuOpen ? 'is-visible' : ''}`}
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
        onClick={handleOverlayClick}
      >
        <span className="sr-only">Luk menu</span>
      </button>
      {/* Brand watermark in left corner using SVG logo */}
      <div className="brand-watermark" aria-hidden="true">
        <BrandLogo as="div" align="left" size={72} showWordmark={false} />
      </div>
    </main>
  )
}

function AppLayout({ mode, onSetMode }: { mode: ThemeMode; onSetMode: (mode: ThemeMode) => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const hideTopBar =
    location.pathname.startsWith('/reaction-test') ||
    location.pathname.startsWith('/memory') ||
    location.pathname.startsWith('/sorting') ||
    location.pathname.startsWith('/odd-one-out') ||
    location.pathname.startsWith('/puzzle-blox') ||
    location.pathname.startsWith('/pattern-pulse') ||
    location.pathname.startsWith('/spatial-sweep') ||
    location.pathname.startsWith('/mind-math') ||
    location.pathname.startsWith('/focus-flow') ||
    location.pathname.startsWith('/word-weave')

  const handleBack = () => {
    if (location.pathname === '/overview') {
      return
    }

    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/overview', { replace: true })
    }
  }

  return (
    <AppChrome
      mode={mode}
      onSetMode={onSetMode}
      onBack={location.pathname !== '/overview' ? handleBack : undefined}
      canGoBack={location.pathname !== '/overview'}
      hideTopBar={hideTopBar}
    >
      <Outlet />
    </AppChrome>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mode, setMode] = useState<ThemeMode>('calm')
  const navigate = useNavigate()

  useEffect(() => {
    document.body.dataset.theme = mode
    return () => {
      document.body.removeAttribute('data-theme')
    }
  }, [mode])

  const handleToggleMode = (nextMode: ThemeMode) => {
    setMode(nextMode)
  }

  const handleLogin = (route = '/') => {
    setIsLoggedIn(true)
    navigate(route, { replace: true })
  }

  if (!isLoggedIn) {
    return (
      <AppChrome mode={mode} onSetMode={handleToggleMode} onNavigate={handleLogin}>
        <LoginScreen
          onSkip={() => handleLogin('/')}
          onGoToMeditation={() => handleLogin('/meditation/box-breathing')}
        />
      </AppChrome>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout mode={mode} onSetMode={handleToggleMode} />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<OverviewScreen />} />
        <Route path="overview/games" element={<OverviewGamesScreen />} />
        <Route path="memory" element={<MemoryGame />} />
        <Route path="sorting" element={<SortingGameScreen />} />
        <Route path="odd-one-out" element={<OddOneOutScreen />} />
        <Route path="puzzle-blox" element={<PuzzleBloxScreen />} />
        <Route path="pattern-pulse" element={<PatternPulseScreen />} />
        <Route path="spatial-sweep" element={<SpatialSweepScreen />} />
        <Route path="mind-math" element={<MindMathScreen />} />
        <Route path="focus-flow" element={<FocusFlowScreen />} />
        <Route path="word-weave" element={<WordWeaveScreen />} />
        <Route path="word-search" element={<WordSearchScreen />} />
        <Route path="reaction-test" element={<ReactionTestScreen />} />
        <Route path="meditation">
          <Route index element={<MeditationHubScreen />} />
          <Route path="box-breathing" element={<MeditationBoxBreathingScreen />} />
          <Route path="yoga-candle" element={<MeditationYogaCandleScreen />} />
        </Route>
        <Route path="breath" element={<Navigate to="/meditation" replace />} />
        <Route path="breathing" element={<Navigate to="/meditation" replace />} />
        <Route path="åndedræt" element={<Navigate to="/meditation" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
