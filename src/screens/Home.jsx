import { useProgress } from '../hooks/useProgress'

export default function Home({ onNavigate }) {
  const { progress } = useProgress()
  const gaps = Object.entries(progress.grammarErrors || {}).filter(([,v]) => v >= 3)

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 100%)', padding: '24px 20px 32px', color: 'white' }}>
        <p style={{ fontSize: '.75rem', opacity: .7, marginBottom: 4, fontFamily: 'var(--font-sans)' }}>ENGLISHSPARK</p>
        <h2 style={{ color: 'white', fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 8 }}>Good day, student! 👋</h2>
        <p style={{ fontSize: '.85rem', opacity: .85, margin: 0 }}>Ready to practise your English today?</p>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ marginTop: -16, position: 'relative', zIndex: 1 }}>
        {[
          { num: progress.tasksCompleted || 0, label: 'Tasks done' },
          { num: progress.streakDays || 0, label: 'Day streak' },
          { num: (progress.grammarMastered || []).length, label: 'Grammar steps' },
        ].map(s => (
          <div key={s.label} className="stat-box" style={{ background: 'white', boxShadow: 'var(--shadow)' }}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="section-body" style={{ paddingTop: 8 }}>

        {/* Gap alert */}
        {gaps.length > 0 && (
          <div className="card card-accent-amber" style={{ marginBottom: 16, background: 'var(--amber-pale)' }}>
            <div className="flex-between">
              <div>
                <p className="bold text-small" style={{ color: 'var(--amber)', marginBottom: 2 }}>⚡ Practice recommended</p>
                <p className="text-small text-muted" style={{ margin: 0 }}>Your AI tutor spotted a grammar pattern to work on.</p>
              </div>
              <button className="btn btn-sm btn-amber" onClick={() => onNavigate('grammar')}>Fix it</button>
            </div>
          </div>
        )}

        {/* Three domains */}
        <p className="text-small bold text-muted" style={{ marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Choose a domain</p>

        <button className="domain-tile" onClick={() => onNavigate('reading')}>
          <div className="domain-icon" style={{ background: 'var(--purple-pale)' }}>📖</div>
          <div>
            <h3>Reading</h3>
            <p>Passages + comprehension questions</p>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-light)', fontSize: '1.2rem' }}>›</span>
        </button>

        <button className="domain-tile" onClick={() => onNavigate('writing')}>
          <div className="domain-icon" style={{ background: 'var(--amber-pale)' }}>✏️</div>
          <div>
            <h3>Writing</h3>
            <p>Write and get AI feedback</p>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-light)', fontSize: '1.2rem' }}>›</span>
        </button>

        <button className="domain-tile" onClick={() => onNavigate('speaking')}>
          <div className="domain-icon" style={{ background: 'var(--forest-pale)' }}>🗣️</div>
          <div>
            <h3>Speaking</h3>
            <p>Record and get speech analysis</p>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-light)', fontSize: '1.2rem' }}>›</span>
        </button>

        <button className="domain-tile" onClick={() => onNavigate('grammar')}>
          <div className="domain-icon" style={{ background: '#E6F1FB' }}>🧱</div>
          <div>
            <h3>Grammar Ladder</h3>
            <p>Step-by-step grammar practice</p>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-light)', fontSize: '1.2rem' }}>›</span>
        </button>

        {/* Recent passages */}
        <p className="text-small bold text-muted" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 8 }}>
          Passages read: {(progress.passagesRead || []).length} / 34
        </p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((progress.passagesRead || []).length / 34) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
