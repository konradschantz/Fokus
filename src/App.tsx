import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './screens/Home'
import MemoryGame from './screens/MemoryGame'
import ReactionTestScreen from './screens/ReactionTestScreen'

function AppLayout() {
  return (
    <main className="app">
      <Outlet />
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="memory" element={<MemoryGame />} />
      </Route>
      <Route path="reaction-test" element={<ReactionTestScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
