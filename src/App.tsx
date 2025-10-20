import { useState } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
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

function AppLayout() {
  return (
    <main className="app">
      <Outlet />
    </main>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return (
      <main
        className="app"
        style={{ background: 'linear-gradient(135deg, #E6F4FA 0%, #FDFEFF 100%)' }}
      >
        <LoginScreen onSkip={() => setIsLoggedIn(true)} onLogin={() => setIsLoggedIn(true)} />
      </main>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="memory" element={<MemoryGame />} />
        <Route path="sorting" element={<SortingGameScreen />} />
        <Route path="odd-one-out" element={<OddOneOutScreen />} />
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
