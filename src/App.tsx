import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import Home from './screens/Home'
import MemoryGame from './screens/MemoryGame'
import ReactionTestScreen from './screens/ReactionTestScreen'
import SortingGameScreen from './screens/SortingGameScreen'
import MeditationHubScreen from './screens/MeditationHubScreen'
import MeditationBoxBreathingScreen from './screens/MeditationBoxBreathingScreen'
import MeditationYogaCandleScreen from './screens/MeditationYogaCandleScreen'
import OddOneOutScreen from './screens/OddOneOutScreen'
import LoginScreen from './screens/LoginScreen'
import PuzzleBloxScreen from './screens/PuzzleBloxScreen'
import FocusRoutineScreen from './screens/FocusRoutineScreen'

function AppLayout() {
  return (
    <main className="app">
      <Outlet />
    </main>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [nextRoute, setNextRoute] = useState('/')
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoggedIn) {
      navigate(nextRoute, { replace: true })
    }
  }, [isLoggedIn, nextRoute, navigate])

  const handleLogin = (route = '/') => {
    setNextRoute(route)
    setIsLoggedIn(true)
  }

  if (!isLoggedIn) {
    return (
      <main
        className="app"
        style={{ background: 'linear-gradient(135deg, #E6F4FA 0%, #FDFEFF 100%)' }}
      >
        <LoginScreen onSkip={() => handleLogin('/')} onGoToRoutine={() => handleLogin('/rutines')} />
      </main>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="memory" element={<MemoryGame />} />
        <Route path="rutines" element={<FocusRoutineScreen />} />
        <Route path="sorting" element={<SortingGameScreen />} />
        <Route path="odd-one-out" element={<OddOneOutScreen />} />
        <Route path="puzzle-blox" element={<PuzzleBloxScreen />} />
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
