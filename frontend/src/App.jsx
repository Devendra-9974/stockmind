import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { Activity, TrendingUp, Brain, BarChart2, Layers } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import TrainPage from './pages/TrainPage'
import PredictPage from './pages/PredictPage'
import ModelsPage from './pages/ModelsPage'

const NAV = [
  { to: '/',        label: 'Dashboard', icon: Activity },
  { to: '/train',   label: 'Train',     icon: Brain },
  { to: '/predict', label: 'Predict',   icon: TrendingUp },
  { to: '/models',  label: 'Models',    icon: Layers },
]

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top nav ── */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-8">
          <div className="flex items-center gap-2 text-accent font-semibold tracking-wider text-sm">
            <BarChart2 size={18} />
            STOCKMIND
          </div>
          <nav className="flex gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all
                   ${isActive
                     ? 'bg-accent/10 text-accent'
                     : 'text-muted hover:text-white hover:bg-white/5'}`
                }
              >
                <Icon size={13} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-muted">LSTM · Self-Correcting</span>
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
          </div>
        </div>
      </header>

      {/* ── Pages ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/train"   element={<TrainPage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/models"  element={<ModelsPage />} />
        </Routes>
      </main>

      <footer className="border-t border-border text-center text-[10px] text-muted py-3">
        StockMind · Yahoo Finance data · For educational purposes only — not financial advice
      </footer>
    </div>
  )
}
