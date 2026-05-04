import { useState, useCallback } from 'react'
import { PASSAGES } from '../data/passages'
import { useAI, PROMPTS } from '../hooks/useAI'
import { useProgress } from '../hooks/useProgress'

const ALL = [...PASSAGES.level1, ...PASSAGES.level2, ...PASSAGES.level3]

function PassageList({ onSelect, progress }) {
  const [level, setLevel] = useState('all')
  const levels = [
    { id: 'all', label: 'All' },
    { id: 'level1', label: 'Class 6–7' },
    { id: 'level2', label: 'Class 8–9' },
    { id: 'level3', label: 'SSC' },
  ]
  const filtered = level === 'all' ? ALL : PASSAGES[level]

  return (
    <div>
      <div className="level-tabs">
        {levels.map(l => (
          <button key={l.id} className={`level-tab ${level === l.id ? 'active' : ''}`} onClick={() => setLevel(l.id)}>{l.label}</button>
        ))}
      </div>
      <div className="section-body" style={{ paddingTop: 4 }}>
        {filtered.map(p => {
          const done = (progress.passagesRead || []).includes(p.id)
          return (
            <button key={p.id} className="domain-tile" style={{ opacity: done ? .7 : 1 }} onClick={() => onSelect(p)}>
              <div className="domain-icon" style={{ background: done ? 'var(--forest-pale)' : 'var(--purple-pale)', fontSize: '1.1rem' }}>
                {done ? '✅' : '📄'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '.95rem' }}>{p.title}</h3>
                <p style={{ fontSize: '.75rem' }}>{p.level} {done ? '· Completed' : ''}</p>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--ink-light)', fontSize: '1.2rem' }}>›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PassageReader({ passage, onBack }) {
  const [phase, setPhase] = useState('reading') // reading | questions | feedback
  const [questions, setQuestions] = useState(null)
  const [answers, setAnswers] = useState({})
  const [mcqAnswers, setMcqAnswers] = useState({})
  const [feedback, setFeedback] = useState('')
  const [generating, setGenerating] = useState(false)
  const { markPassageRead, recordError } = useProgress()

  const systemPrompt = PROMPTS.readingFeedback(passage.text)
  const { sendMessage, isLoading, loadProgress, engineTier } = useAI(systemPrompt)

  const generateQuestions = useCallback(async () => {
    setGenerating(true)
    const prompt = `Generate reading comprehension questions for this passage. Return ONLY JSON in this format:
{
  "fitg": [{"q":"sentence with ___ blank","answer":"word","options":["word","wrong1","wrong2"]}],
  "mcq": [{"q":"question?","options":["a","b","c"],"answer":"correct option text"}],
  "short": [{"q":"short answer question?"}]
}
Include 3 fill-in-the-gap, 3 MCQ, 2 short answer questions. Base everything on the passage.
Passage: ${passage.text.substring(0, 800)}`

    try {
      const raw = await sendMessage(prompt)
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        const q = JSON.parse(match[0])
        setQuestions(q)
        setPhase('questions')
      } else {
        // Fallback static questions
        setQuestions({
          fitg: [{ q: "Read the passage carefully and answer the short questions below.", answer: "", options: [] }],
          mcq: [],
          short: [
            { q: "What is the main topic of this passage?" },
            { q: "Mention two important facts from the passage." },
          ]
        })
        setPhase('questions')
      }
    } catch {
      setPhase('questions')
      setQuestions({ fitg: [], mcq: [], short: [{ q: "What is the main idea of this passage?" }, { q: "What did you find most interesting and why?" }] })
    }
    setGenerating(false)
    markPassageRead(passage.id)
  }, [passage, sendMessage, markPassageRead])

  const submitAnswers = useCallback(async () => {
    setPhase('feedback')
    setGenerating(true)
    const answersText = [
      ...Object.entries(answers).map(([k, v]) => `Q: ${k}\nA: ${v}`),
      ...Object.entries(mcqAnswers).map(([k, v]) => `MCQ ${k}: ${v}`),
    ].join('\n\n')

    const fb = await sendMessage(`The student answered these questions about the passage:\n\n${answersText}\n\nGive feedback on their answers.`)
    setFeedback(fb)
    setGenerating(false)
  }, [answers, mcqAnswers, sendMessage])

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-icon">📖</div>
        <h3>Loading AI tutor</h3>
        <p className="text-muted text-small">{loadProgress.text}</p>
        <div className="progress-bar" style={{ width: '80%' }}>
          <div className="progress-fill" style={{ width: `${loadProgress.progress}%` }} />
        </div>
        <p className="text-small text-muted">Downloads once, works offline forever</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '16px 16px 0' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <div style={{ marginTop: 12 }}>
          <h2 style={{ marginBottom: 4 }}>{passage.title}</h2>
          <span className="badge badge-purple">{passage.level}</span>
          {engineTier && <span className="badge badge-forest" style={{ marginLeft: 6 }}>AI {engineTier}</span>}
        </div>
      </div>

      {phase === 'reading' && (
        <div className="section-body" style={{ paddingTop: 12 }}>
          <div className="passage-text">
            {passage.text.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
          </div>
          <button className="btn btn-primary btn-full mt-16" onClick={generateQuestions} disabled={generating}>
            {generating ? <><span className="spinner" />&nbsp;Generating questions...</> : 'Answer questions →'}
          </button>
        </div>
      )}

      {phase === 'questions' && questions && (
        <div className="section-body" style={{ paddingTop: 12 }}>
          {/* Fill in the gap */}
          {questions.fitg?.length > 0 && (
            <>
              <p className="bold text-small" style={{ marginBottom: 8, color: 'var(--purple)' }}>FILL IN THE GAPS</p>
              {questions.fitg.map((q, i) => (
                <div key={i} className="card" style={{ marginBottom: 10 }}>
                  <p className="text-small" style={{ marginBottom: 8 }}>{q.q}</p>
                  {q.options?.length > 0
                    ? q.options.map(o => (
                      <button key={o} className={`option-btn ${mcqAnswers[`fitg_${i}`] === o ? 'selected' : ''}`}
                        onClick={() => setMcqAnswers(a => ({ ...a, [`fitg_${i}`]: o }))}>
                        {o}
                      </button>
                    ))
                    : <textarea rows={2} placeholder="Type your answer..." value={answers[`fitg_${i}`] || ''}
                      onChange={e => setAnswers(a => ({ ...a, [`fitg_${i}`]: e.target.value }))} />
                  }
                </div>
              ))}
            </>
          )}

          {/* MCQ */}
          {questions.mcq?.length > 0 && (
            <>
              <p className="bold text-small" style={{ margin: '12px 0 8px', color: 'var(--purple)' }}>MULTIPLE CHOICE</p>
              {questions.mcq.map((q, i) => (
                <div key={i} className="card" style={{ marginBottom: 10 }}>
                  <p className="text-small" style={{ marginBottom: 8 }}>{q.q}</p>
                  {q.options?.map(o => (
                    <button key={o} className={`option-btn ${mcqAnswers[`mcq_${i}`] === o ? 'selected' : ''}`}
                      onClick={() => setMcqAnswers(a => ({ ...a, [`mcq_${i}`]: o }))}>
                      {o}
                    </button>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* Short answer */}
          {questions.short?.length > 0 && (
            <>
              <p className="bold text-small" style={{ margin: '12px 0 8px', color: 'var(--purple)' }}>SHORT ANSWER</p>
              {questions.short.map((q, i) => (
                <div key={i} className="card" style={{ marginBottom: 10 }}>
                  <p className="text-small" style={{ marginBottom: 8 }}>{q.q}</p>
                  <textarea rows={3} placeholder="Write your answer in English..." value={answers[`short_${i}`] || ''}
                    onChange={e => setAnswers(a => ({ ...a, [`short_${i}`]: e.target.value }))} />
                </div>
              ))}
            </>
          )}

          <button className="btn btn-primary btn-full mt-16" onClick={submitAnswers}>
            Submit answers for feedback →
          </button>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="section-body" style={{ paddingTop: 12 }}>
          <h3 style={{ marginBottom: 12 }}>AI Feedback</h3>
          {generating
            ? <div className="ai-thinking"><span className="spinner" /> Reading your answers...</div>
            : <div className="ai-feedback">{feedback || 'Loading feedback...'}</div>
          }
          {!generating && (
            <div className="mt-16 flex-col gap-8">
              <button className="btn btn-secondary btn-full" onClick={() => setPhase('reading')}>Read again</button>
              <button className="btn btn-ghost btn-full" onClick={onBack}>← Choose another passage</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Reading() {
  const [selected, setSelected] = useState(null)
  const { progress } = useProgress()

  return (
    <div>
      {!selected && (
        <>
          <div className="section-header">
            <h2>📖 Reading</h2>
            <p className="text-muted text-small">Read a passage and answer comprehension questions. AI checks your answers.</p>
          </div>
          <PassageList onSelect={setSelected} progress={progress} />
        </>
      )}
      {selected && <PassageReader passage={selected} onBack={() => setSelected(null)} />}
    </div>
  )
}
