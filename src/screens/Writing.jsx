import { useState } from 'react'
import { useAI, PROMPTS } from '../hooks/useAI'
import { useProgress } from '../hooks/useProgress'

const TOPICS = {
  level1: [
    { title: "My Best Friend", prompts: ["Who is your best friend?", "What do you like to do together?", "Why are they special to you?"] },
    { title: "Describe Your Home", prompts: ["Where do you live?", "What does your home look like?", "What is your favourite part of your home?"] },
    { title: "A Market Near My Village", prompts: ["What is the market like?", "What do people sell and buy there?", "Do you enjoy going to the market?"] },
    { title: "My School Routine", prompts: ["What time do you go to school?", "What subjects do you study?", "What do you enjoy most about school?"] },
    { title: "My Favourite Food", prompts: ["What is your favourite food?", "How is it cooked?", "When do you usually eat it?"] },
    { title: "How I Celebrate Eid", prompts: ["What do you do on Eid morning?", "Who do you celebrate with?", "What makes Eid special for you?"] },
  ],
  level2: [
    { title: "The Importance of Trees", prompts: ["Why are trees important?", "How do trees help the environment?", "What happens when we cut too many trees?"] },
    { title: "Uses and Abuses of Mobile Phones", prompts: ["How are mobile phones useful?", "What are the negative effects?", "How should students use mobile phones responsibly?"] },
    { title: "Early Rising is a Good Habit", prompts: ["What are the benefits of waking up early?", "How does it help students?", "What do you do in the early morning?"] },
    { title: "A Village Fair", prompts: ["Describe what happens at a village fair.", "What can you see, eat, and do there?", "What do you enjoy most about it?"] },
    { title: "Letter to Your Headmaster Requesting Leave", prompts: ["What is the reason for your leave?", "How long will you be absent?", "What will you do to catch up on missed work?"] },
    { title: "Dialogue at a Doctor's Clinic", prompts: ["What is the patient's problem?", "What does the doctor say?", "What advice does the doctor give?"] },
  ],
  level3: [
    { title: "Female Education in Bangladesh", prompts: ["Why is education important for girls?", "What challenges do girls face?", "How can society help?"] },
    { title: "Advantages and Disadvantages of Internet", prompts: ["What are the main benefits of the internet?", "What are the dangers or problems?", "How can students use the internet wisely?"] },
    { title: "Climate Change and Bangladesh", prompts: ["How is climate change affecting Bangladesh?", "What problems does it cause for ordinary people?", "What should be done to address it?"] },
    { title: "Application for a School Scholarship", prompts: ["Why do you deserve the scholarship?", "What are your academic achievements?", "How will the scholarship help you?"] },
    { title: "Traffic Jam in Dhaka", prompts: ["What causes traffic jams in Dhaka?", "How does it affect daily life?", "What solutions would you suggest?"] },
    { title: "Role of Youth in Development", prompts: ["How can young people contribute to national development?", "What skills and qualities do they need?", "Give an example of youth-led change."] },
  ]
}

const LEVEL_META = {
  level1: { label: 'Class 6–7', words: '60–80 words', color: 'var(--purple)' },
  level2: { label: 'Class 8–9', words: '120–150 words', color: 'var(--amber)' },
  level3: { label: 'Class 10 / SSC', words: '200–250 words', color: 'var(--forest)' },
}

function TopicPicker({ onSelect }) {
  const [level, setLevel] = useState('level1')
  return (
    <div>
      <div className="level-tabs">
        {Object.entries(LEVEL_META).map(([k, v]) => (
          <button key={k} className={`level-tab ${level === k ? 'active' : ''}`} onClick={() => setLevel(k)}>{v.label}</button>
        ))}
      </div>
      <div className="section-body" style={{ paddingTop: 4 }}>
        <p className="text-small text-muted" style={{ marginBottom: 12 }}>Target: {LEVEL_META[level].words}</p>
        {TOPICS[level].map(t => (
          <button key={t.title} className="domain-tile" onClick={() => onSelect({ ...t, level })}>
            <div className="domain-icon" style={{ background: 'var(--amber-pale)', fontSize: '1.2rem' }}>✏️</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '.95rem' }}>{t.title}</h3>
              <p style={{ fontSize: '.75rem' }}>Guided writing • {LEVEL_META[level].words}</p>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--ink-light)', fontSize: '1.2rem' }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function WritingTask({ topic, onBack }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('write') // write | feedback
  const [feedback, setFeedback] = useState('')
  const { sendMessage, isLoading, loadProgress, isThinking, engineTier } = useAI(PROMPTS.writingFeedback)
  const { recordWriting } = useProgress()

  const meta = LEVEL_META[topic.level]
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  const submitWriting = async () => {
    if (wordCount < 10) return
    setPhase('feedback')
    const fb = await sendMessage(`Please give feedback on this student's writing:\n\n"${text}"`)
    setFeedback(fb)
    recordWriting()
  }

  if (isLoading) return (
    <div className="loading-screen">
      <div className="loading-icon">✏️</div>
      <h3>Loading AI tutor</h3>
      <p className="text-muted text-small">{loadProgress.text}</p>
      <div className="progress-bar" style={{ width: '80%' }}>
        <div className="progress-fill" style={{ width: `${loadProgress.progress}%` }} />
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ padding: '16px 16px 0' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <div style={{ marginTop: 12 }}>
          <h2 style={{ marginBottom: 4 }}>{topic.title}</h2>
          <span className="badge badge-amber">{meta.label}</span>
          <span className="badge" style={{ background: 'var(--cream-dark)', color: 'var(--ink-light)', marginLeft: 6 }}>{meta.words}</span>
          {engineTier && <span className="badge badge-forest" style={{ marginLeft: 6 }}>AI {engineTier}</span>}
        </div>
      </div>

      {phase === 'write' && (
        <div className="section-body" style={{ paddingTop: 12 }}>
          {/* Prompts */}
          <div className="card card-accent-amber" style={{ background: 'var(--amber-pale)', marginBottom: 14 }}>
            <p className="bold text-small" style={{ color: 'var(--amber)', marginBottom: 8 }}>Answer these questions in your paragraph:</p>
            {topic.prompts.map((p, i) => (
              <p key={i} className="text-small" style={{ marginBottom: 4 }}>• {p}</p>
            ))}
          </div>

          <textarea
            rows={10}
            placeholder={`Write your paragraph here in English...\n\nTarget: ${meta.words}`}
            value={text}
            onChange={e => setText(e.target.value)}
          />

          <div className="flex-between mt-8" style={{ marginBottom: 16 }}>
            <span className="text-small text-muted">{wordCount} words</span>
            <span className="text-small" style={{ color: wordCount >= 60 ? 'var(--success)' : 'var(--ink-light)' }}>
              {wordCount >= 60 ? '✓ Good length' : `Aim for at least ${meta.words}`}
            </span>
          </div>

          <button className="btn btn-primary btn-full" onClick={submitWriting} disabled={wordCount < 10 || isThinking}>
            {isThinking ? <><span className="spinner" />&nbsp;Getting feedback...</> : 'Get AI feedback →'}
          </button>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="section-body" style={{ paddingTop: 12 }}>
          <div className="card card-accent-amber" style={{ background: 'var(--amber-pale)', marginBottom: 14 }}>
            <p className="bold text-small" style={{ color: 'var(--amber)', marginBottom: 4 }}>Your writing:</p>
            <p className="text-small">{text}</p>
          </div>
          <h3 style={{ marginBottom: 10 }}>AI Feedback</h3>
          {isThinking
            ? <div className="ai-thinking"><span className="spinner" /> Reading your writing...</div>
            : <div className="ai-feedback">{feedback}</div>
          }
          {!isThinking && (
            <div className="mt-16 flex-col gap-8">
              <button className="btn btn-amber btn-full" onClick={() => { setText(''); setPhase('write'); setFeedback('') }}>Try again with same topic</button>
              <button className="btn btn-ghost btn-full" onClick={onBack}>← Choose another topic</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Writing() {
  const [topic, setTopic] = useState(null)
  return (
    <div>
      {!topic && (
        <>
          <div className="section-header">
            <h2>✏️ Writing</h2>
            <p className="text-muted text-small">Choose a topic, type your paragraph or essay, and get AI feedback on your grammar and content.</p>
          </div>
          <TopicPicker onSelect={setTopic} />
        </>
      )}
      {topic && <WritingTask topic={topic} onBack={() => setTopic(null)} />}
    </div>
  )
}
