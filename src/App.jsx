import { useState, useEffect } from 'react'
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

const TITLES = { home: 'EnglishSpark', reading: 'Reading', writing: 'Writing', speaking: 'Speaking', grammar: 'Grammar' }

// PWA install prompt
let deferredPrompt = null
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e })

function WelcomeModal({ onStart }) {
  const [step, setStep] = useState('welcome')
  const [showInstall, setShowInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone)
    setShowInstall(!!deferredPrompt || /iphone|ipad|ipod/i.test(navigator.userAgent))
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      deferredPrompt = null
    }
    setStep('download')
  }

  if (step === 'welcome') return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📒</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 8, color: 'var(--forest)' }}>Welcome to EnglishSpark</h2>
        <p style={{ color: 'var(--ink-mid)', fontSize: '.9rem', marginBottom: 20, lineHeight: 1.6 }}>
          Your offline AI English tutor for Classes 6-10. Practise Reading, Writing, Speaking, and Grammar — all powered by Gemma 4 AI.
        </p>
        <div style={{ background: 'var(--cream)', borderRadius: 12, padding: 14, marginBottom: 20, textAlign: 'left' }}>
          <p style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 8, color: 'var(--ink)' }}>✅ What you get:</p>
          {['🐖 Reading passages with AI questions', '✏️ Writing with AI feedback', '💿 Speaking practice with analysis', '🧇 Grammar Ladder (14 steps)', '📶 Works offline after setup'].map(f => (
            <p key={f} style={{ fontSize: '.82rem', color: 'var(--ink-mid)', marginBottom: 4 }}>{f}</p>
          ))}
        </div>
        <button className="btn btn-primary btn-full" onClick={() => setStep('install')} style={{ marginBottom: 8 }}>
          Get Started →
        </button>
      </div>
    </div>
  )

  if (step === 'install') return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📲</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 8, color: 'var(--forest)' }}>Install on Your Phone</h2>
        <p style={{ color: 'var(--ink-mid)', fontSize: '.9rem', marginBottom: 16, lineHeight: 1.6 }}>
          Install EnglishSpark as an app on your phone to use it offline — no App Store needed!
        </p>
        {isStandalone ? (
          <div style={{ background: 'var(--forest-pale)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <p style={{ color: 'var(--forest)', fontWeight: 600, fontSize: '.85rem' }}>✅ Already installed as an app!</p>
          </div>
        ) : isIOS ? (
          <div style={{ background: 'var(--cream)', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'left' }}>
            <p style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 8 }}>To install on iPhone/iPad:</p>
            <p style={{ fontSize: '.82rem', color: 'var(--ink-mid)', marginBottom: 4 }}>1. Tap the <strong>Share</strong> button 📤 at the bottom of Safari</p>
            <p style={{ fontSize: '.82rem', color: 'var(--ink-mid)', marginBottom: 4 }}>2. Scroll down and tap <strong>"Add to Home Screen"</strong></p>
            <p style={{ fontSize: '.82rem', color: 'var(--ink-mid)' }}>3. Tap <strong>Add</strong> — done!</p>
          </div>
        ) : showInstall ? (
          <button className="btn btn-primary btn-full" onClick={handleInstall} style={{ marginBottom: 12 }}>
            phoneIcon Install EnglishSpark App
          </button>
        ) : (
          <div style={{ background: 'var(--cream)', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'left' }}>
            <p style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 6 }}>To install on Android:</p>
            <p style={{ fontSize: '.82rem', color: 'var(--ink-mid)', marginBottom: 4 }}>1. Tap the menu (⎶) in Chrome</p>
            <p style={{ fontSize: '.82rem', color: 'var(--ink-mid)' }}>2. Tap <strong>"Add to Home screen"</strong></p>
          </div>
        )}
        <button className="btn btn-ghost btn-full" onClick={() => setStep('download')} style={{ fontSize: '.82rem' }}>
          Skip and continue
        </button>
      </div>
    </div>
  )

  if (step === 'download') return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤁</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 8, color: 'var(--forest)' }}>Download Gemma 4 AI</h2>
        <p style={{ color: 'var(--ink-mid)', fontSize: '.9rem', marginBottom: 16, lineHeight: 1.6 }}>
          EnglishSpark uses <strong>Gemma 4</strong> — Google's AI that runs directly on your device, so your data stays private.
        </p>
        <div style={{ background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'left' }}>
          <p style={{ fontWeight: 600, fontSize: '.85rem', color: '#E65100', marginBottom: 6 }}>⚡ Important before starting:</p>
          <p style={{ fontSize: '.82rem', color: 'var(--ink-mid)', marginBottom: 4 }}>🗶 <strong>Use Wi-Fi</strong> — the model is ~1.5 GB</p>
          <p style={{ fontSize: '.82rem', color: 'var(--ink-mid)', marginBottom: 4 }}>🔋 <strong>Keep your screen on</strong> while downloading</p>
          <p style={{ fontSize: '.82rem', color: 'var(--ink-mid)', marginBottom: 4 }}>📭 <strong>Requires WebGPU:</strong> Chrome 113+ or Edge 113+ on Android/desktop</p>
          <p style={{ fontSize: '.82rem', color: 'var(--ink-mid)' }}>✅ <strong>Downloaded once</strong> — cached offline forever</p>
        </div>
        <div style={{ background: 'var(--forest-pale)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <p style={{ fontSize: '.82rem', color: 'var(--forest)', lineHeight: 1.5 }}>
            The download starts automatically when you open any feature. Just make sure you are on Wi-Fi first!
          </p>
        </div>
        <button className="btn btn-primary btn-full" onClick={onStart} style={{ marginBottom: 8 }}>
          I understand — Start the App
        </button>
        <p style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: 8 }}>
          If your device does not support WebGPU, a smaller backup AI will be used instead.
        </p>
      </div>
    </div>
  )

  return null
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('englishspark_welcomed')
    if (!seen) setShowWelcome(true)
  }, [])

  const handleStart = () => {
    localStorage.setItem('englishspark_welcomed', '1')
    setShowWelcome(false)
  }

  return (
    <div className="app-shell">
      {showWelcome && <WelcomeModal onStart={handleStart} />}

      <header className="app-header">
        <div>
          <h1>{TITLES[screen]}</h1>
          <div className="sub">Offline AI English tutor</div>
        </div>
        <button onClick={() => setScreen('grammar')}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'white', cursor: 'pointer', fontSize: '.75rem', fontFamily: 'var(--font-sans)' }}>
          pI🧧 Grammar
        </button>
      </header>

      <main className="app-content">
        {screen === 'home' && <Home onNavigate={setScreen} onShowWelcome={() => setShowWelcome(true)} />}
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
