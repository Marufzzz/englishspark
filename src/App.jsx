import { useState } from 'react'
import './index.css'
import Home from './screens/Home'
import Reading from './screens/Reading'
import Writing from './screens/Writing'
import Speaking from './screens/Speaking'
import Grammar from './screens/Grammar'

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'reading', label: 'Reading' },
  { id: 'writing', label: 'Writing' },
  { id: 'speaking', label: 'Speaking' },
]

const TITLES = { home:'EnglishSpark', reading:'Reading', writing:'Writing', speaking:'Speaking', grammar:'Grammar Ladder' }

export default function App() {
  const [screen, setScreen] = useState('home')
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>{TITLES[screen]}</h1>
          <div className="sub">Offline AI English tutor</div>
        </div>
        <button onClick={() => setScreen('grammar')}
          style={{ background:'rgba(255,255,255,0.15)',border:'none',borderRadius:8,padding:'6px 10px',color:'white',cursor:'pointer',fontSize:'.75rem',fontFamily:'var(--font-sans)' }}>
          🧱 Grammar
        </button>
      </header>
      <main className="app-content">
        {screen === 'home' && <Home onNavigate={setScreen} />}
        {screen === 'reading' && <Reading />}
        {screen === 'writing' && <Writing />}
        {screen === 'speaking' && <Speaking />}
        {screen === 'grammar' && <Grammar />}
      </main>
      <nav className="bottom-nav">
        {NAV.map(n => (
          <button key={n.id} className={`nav-btn ${screen === n.id ? 'active' : ''}`} onClick={() => setScreen(n.id)}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {n.id === 'home' && <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
              {n.id === 'reading' && <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>}
              {n.id === 'writing' && <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></>}
              {n.id === 'speaking' && <><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>}
            </svg>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
