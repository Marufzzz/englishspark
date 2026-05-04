import { useState } from 'react'
import { GRAMMAR_RUNGS } from '../data/grammar'
import { useProgress } from '../hooks/useProgress'

function RungExercise({ rung, onComplete, onBack }) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const q = rung.exercises[current]
  const total = rung.exercises.length

  const handleSelect = (opt) => {
    if (revealed) return
    setSelected(opt)
  }

  const handleReveal = () => {
    if (!selected) return
    setRevealed(true)
    if (selected === q.answer) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (current + 1 >= total) {
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  if (done) {
    const passed = score >= Math.ceil(total * 0.8)
    return (
      <div className="section-body" style={{ paddingTop: 24, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>{passed ? '🎉' : '💪'}</div>
        <h2 style={{ marginBottom: 8 }}>{passed ? 'Well done!' : 'Keep practising!'}</h2>
        <div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: passed ? 'var(--forest)' : 'var(--amber)', marginBottom: 8 }}>
          {score} / {total}
        </div>
        <p className="text-muted text-small" style={{ marginBottom: 24 }}>
          {passed ? `You passed Step ${rung.id}! The next step is now unlocked.` : `You need ${Math.ceil(total * 0.8)}/${total} to pass. Try again!`}
        </p>
        {passed && <button className="btn btn-primary btn-full" style={{ marginBottom: 10 }} onClick={() => onComplete(rung.id)}>✓ Mark as mastered</button>}
        <button className="btn btn-secondary btn-full" style={{ marginBottom: 10 }} onClick={() => { setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setDone(false) }}>Try again</button>
        <button className="btn btn-ghost btn-full" onClick={onBack}>← Back to ladder</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '16px 16px 0' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <div style={{ marginTop: 12 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 4 }}>Step {rung.id}: {rung.title}</h2>
          <span className="badge badge-forest">{rung.level}</span>
        </div>
        <div className="flex-between mt-12" style={{ marginBottom: 8 }}>
          <span className="text-small text-muted">Question {current + 1} of {total}</span>
          <span className="text-small bold text-forest">Score: {score}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((current) / total) * 100}%` }} />
        </div>
      </div>

      <div className="section-body" style={{ paddingTop: 16 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="serif" style={{ fontSize: '1.05rem', lineHeight: 1.7, marginBottom: 0 }}>{q.q}</p>
        </div>

        {q.options.map(opt => {
          let cls = 'option-btn'
          if (revealed) {
            if (opt === q.answer) cls += ' correct'
            else if (opt === selected) cls += ' wrong'
          } else if (opt === selected) {
            cls += ' selected'
          }
          return (
            <button key={opt} className={cls} onClick={() => handleSelect(opt)}>{opt}</button>
          )
        })}

        {!revealed
          ? <button className="btn btn-primary btn-full mt-8" onClick={handleReveal} disabled={!selected}>Check answer</button>
          : (
            <div>
              <div className={`card mt-8`} style={{ background: selected === q.answer ? 'var(--success-pale)' : 'var(--danger-pale)', border: `1px solid ${selected === q.answer ? 'var(--success)' : 'var(--danger)'}`, marginBottom: 12 }}>
                <p className="text-small bold" style={{ color: selected === q.answer ? 'var(--success)' : 'var(--danger)', marginBottom: 2 }}>
                  {selected === q.answer ? '✓ Correct!' : '✗ Not quite'}
                </p>
                {selected !== q.answer && <p className="text-small" style={{ color: 'var(--ink-mid)', margin: 0 }}>The answer is: <strong>{q.answer}</strong></p>}
              </div>
              <button className="btn btn-primary btn-full" onClick={handleNext}>
                {current + 1 >= total ? 'See results' : 'Next question →'}
              </button>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default function Grammar() {
  const { progress, markRungMastered } = useProgress()
  const [activeRung, setActiveRung] = useState(null)
  const unlocked = progress.grammarUnlocked || [1]
  const mastered = progress.grammarMastered || []

  const handleComplete = (rungId) => {
    markRungMastered(rungId)
    setActiveRung(null)
  }

  if (activeRung) {
    return <RungExercise rung={activeRung} onComplete={handleComplete} onBack={() => setActiveRung(null)} />
  }

  return (
    <div>
      <div className="section-header">
        <h2>🧱 Grammar Ladder</h2>
        <p className="text-muted text-small">Work through 14 grammar steps. Each step must be mastered before the next unlocks.</p>
      </div>

      <div style={{ padding: '0 16px 4px' }}>
        <div className="flex-between">
          <span className="text-small text-muted">{mastered.length} / 14 steps mastered</span>
          <span className="text-small bold text-forest">{Math.round((mastered.length / 14) * 100)}%</span>
        </div>
        <div className="progress-bar mt-8">
          <div className="progress-fill" style={{ width: `${(mastered.length / 14) * 100}%` }} />
        </div>
      </div>

      <div className="section-body" style={{ paddingTop: 12 }}>
        {GRAMMAR_RUNGS.map(rung => {
          const isUnlocked = unlocked.includes(rung.id)
          const isMastered = mastered.includes(rung.id)
          const hasError = (progress.grammarErrors || {})[rung.errorTag] >= 3

          return (
            <div key={rung.id} className={`rung-item ${!isUnlocked ? 'locked' : ''} ${isMastered ? 'mastered' : ''}`}
              onClick={() => isUnlocked && setActiveRung(rung)}>
              <div className="rung-num" style={{
                background: isMastered ? 'var(--forest)' : isUnlocked ? rung.color + '22' : 'var(--border)',
                color: isMastered ? 'white' : isUnlocked ? rung.color : 'var(--ink-light)'
              }}>
                {isMastered ? '✓' : rung.id}
              </div>
              <div style={{ flex: 1 }}>
                <p className="bold text-small" style={{ marginBottom: 2 }}>{rung.title}</p>
                <p className="text-small text-muted" style={{ margin: 0 }}>{rung.description}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span className="badge" style={{
                  background: rung.level === 'Beginner' ? 'var(--forest-pale)'
                    : rung.level.includes('Advanced') ? 'var(--danger-pale)'
                    : 'var(--amber-pale)',
                  color: rung.level === 'Beginner' ? 'var(--forest)'
                    : rung.level.includes('Advanced') ? 'var(--danger)'
                    : 'var(--amber)',
                  fontSize: '.65rem'
                }}>{rung.level}</span>
                {hasError && !isMastered && isUnlocked && (
                  <span className="badge badge-danger" style={{ fontSize: '.65rem' }}>⚡ Practise</span>
                )}
                {!isUnlocked && <span style={{ color: 'var(--ink-light)', fontSize: '1rem' }}>🔒</span>}
                {isUnlocked && !isMastered && <span style={{ color: 'var(--ink-light)', fontSize: '1rem' }}>›</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
