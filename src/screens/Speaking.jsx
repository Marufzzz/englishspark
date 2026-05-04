import { useState, useRef, useCallback } from 'react'
import { useAI, PROMPTS } from '../hooks/useAI'
import { useProgress } from '../hooks/useProgress'

const TOPICS = {
  level1: [
    { topic: "Talk about your family", prep: 20, duration: 30, prompts: ["How many people are in your family?", "What do they do?", "Who are you closest to?"] },
    { topic: "Describe your school", prep: 20, duration: 45, prompts: ["Where is your school?", "What does it look like?", "What do you like about it?"] },
    { topic: "Your favourite subject", prep: 15, duration: 30, prompts: ["What is your favourite subject?", "Why do you like it?", "Who teaches you?"] },
    { topic: "What you want to be", prep: 20, duration: 45, prompts: ["What job do you want in the future?", "Why do you want this job?", "What do you need to study?"] },
    { topic: "Describe your village or town", prep: 20, duration: 45, prompts: ["Where do you live?", "What is special about your area?", "What do people do there?"] },
  ],
  level2: [
    { topic: "Should mobile phones be allowed in school?", prep: 30, duration: 60, prompts: ["What is your opinion?", "Give two reasons.", "What problems could phones cause?"] },
    { topic: "Why is education important for girls?", prep: 30, duration: 75, prompts: ["Why do some girls not go to school?", "How does education help them?", "What should be done?"] },
    { topic: "The effects of climate change in Bangladesh", prep: 30, duration: 75, prompts: ["What changes do you see around you?", "How does it affect ordinary people?", "What can we do?"] },
    { topic: "Talk about a person you admire", prep: 25, duration: 60, prompts: ["Who is this person?", "What have they done?", "What can you learn from them?"] },
    { topic: "Why do young people leave villages for cities?", prep: 30, duration: 75, prompts: ["What reasons push people out of villages?", "Is this good or bad?", "What could keep people in villages?"] },
  ],
  level3: [
    { topic: "Is social media good or bad for students?", prep: 60, duration: 90, prompts: ["State your position clearly.", "Give two strong reasons with examples.", "Acknowledge the other side and respond to it.", "Conclude."] },
    { topic: "What is the biggest challenge facing Bangladesh today?", prep: 60, duration: 90, prompts: ["Name the challenge.", "Explain why it is serious.", "Who is most affected?", "What should be done?"] },
    { topic: "Should English be a compulsory subject in schools?", prep: 60, duration: 90, prompts: ["What is your argument?", "Why does English matter in Bangladesh?", "What are the challenges of teaching it?", "What is your conclusion?"] },
    { topic: "Describe and evaluate the education system in Bangladesh", prep: 60, duration: 90, prompts: ["What are its strengths?", "What are its weaknesses?", "Who benefits least from it?", "What changes would you make?"] },
  ]
}

const LEVEL_META = {
  level1: { label: 'Class 6–7', color: 'var(--forest)' },
  level2: { label: 'Class 8–9', color: 'var(--amber)' },
  level3: { label: 'Class 10 / SSC', color: 'var(--purple)' },
}

function TopicCard({ item, level, onStart }) {
  return (
    <button className="domain-tile" onClick={() => onStart({ ...item, level })}>
      <div className="domain-icon" style={{ background: 'var(--forest-pale)', fontSize: '1.1rem' }}>🗣️</div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '.9rem', fontFamily: 'var(--font-sans)' }}>{item.topic}</h3>
        <p style={{ fontSize: '.75rem' }}>{LEVEL_META[level].label} · {item.duration}s target</p>
      </div>
      <span style={{ marginLeft: 'auto', color: 'var(--ink-light)', fontSize: '1.2rem' }}>›</span>
    </button>
  )
}

function SpeakingTask({ task, onBack }) {
  const [phase, setPhase] = useState('prep') // prep | record | transcribe | feedback
  const [prepTime, setPrepTime] = useState(task.prep)
  const [recording, setRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState('')
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const recTimerRef = useRef(null)
  const recognitionRef = useRef(null)

  const { sendMessage, isLoading, loadProgress, isThinking, engineTier } = useAI(PROMPTS.speakingAnalysis(task.topic))
  const { recordSpeaking } = useProgress()

  // Start prep countdown
  const startPrep = useCallback(() => {
    setPhase('prep')
    let t = task.prep
    timerRef.current = setInterval(() => {
      t--
      setPrepTime(t)
      if (t <= 0) { clearInterval(timerRef.current); setPhase('record') }
    }, 1000)
  }, [task.prep])

  // Start recording
  const startRecording = useCallback(async () => {
    chunksRef.current = []
    setRecordTime(0)
    setRecording(true)

    // Browser speech recognition for transcript
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SR()
      recognitionRef.current = recognition
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'
      let parts = []
      recognition.onresult = e => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) parts.push(e.results[i][0].transcript)
        }
        setTranscript(parts.join(' '))
      }
      recognition.start()
    }

    // Recording timer
    recTimerRef.current = setInterval(() => {
      setRecordTime(t => {
        if (t >= task.duration + 30) stopRecording()
        return t + 1
      })
    }, 1000)
  }, [task.duration])

  const stopRecording = useCallback(() => {
    clearInterval(recTimerRef.current)
    setRecording(false)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setPhase('transcribe')
  }, [])

  const analyseTranscript = useCallback(async () => {
    if (!transcript.trim()) {
      setTranscript('[No transcript captured — speech recognition may not be available on this device]')
    }
    setPhase('feedback')
    const t = transcript || '[Student spoke but transcript unavailable]'
    const fb = await sendMessage(`Topic: "${task.topic}"\nStudent speech transcript:\n"${t}"\n\nProvide feedback.`)
    setFeedback(fb)
    recordSpeaking()
  }, [transcript, task.topic, sendMessage, recordSpeaking])

  if (isLoading) return (
    <div className="loading-screen">
      <div className="loading-icon">🗣️</div>
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
          <h2 style={{ fontSize: '1.1rem', marginBottom: 4 }}>{task.topic}</h2>
          <span className="badge badge-forest">{LEVEL_META[task.level].label}</span>
          <span className="badge" style={{ background: 'var(--cream-dark)', color: 'var(--ink-light)', marginLeft: 6 }}>Target: {task.duration}s</span>
          {engineTier && <span className="badge badge-forest" style={{ marginLeft: 6 }}>AI {engineTier}</span>}
        </div>
      </div>
      <div className="section-body" style={{ paddingTop: 12 }}>
        {phase === 'prep' && (<div><div className="card card-accent-forest" style={{ background: 'var(--forest-pale)', marginBottom: 14 }}><p className="bold text-small" style={{ color: 'var(--forest)', marginBottom: 8 }}>Speak about these points:</p>{task.prompts.map((p, i) => <p key={i} className="text-small" style={{ marginBottom: 4 }}>• {p}</p>)}</div>{prepTime === task.prep ? (<div style={{ textAlign: 'center', padding: '24px 0' }}><p className="text-muted text-small" style={{ marginBottom: 16 }}>You have {task.prep} seconds to prepare.</p><button className="btn btn-primary" onClick={startPrep}>Start preparation timer</button></div>) : (<div style={{ textAlign: 'center', padding: '24px 0' }}><div style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--forest)' }}>{prepTime}</div><p className="text-muted text-small">seconds to prepare</p>{prepTime <= 5 && <p className="text-small bold text-forest" style={{ marginTop: 8 }}>Get ready to speak!</p>}</div>)]}</div>))}
        {phase === 'record' && (<div style={{ textAlign: 'center', padding: '24px 0' }}><p className="bold" style={{ marginBottom: 8 }}>{task.topic}</p><p className="text-small text-muted" style={{ marginBottom: 24 }}>Speak clearly and confidently.</p><div style={{ marginBottom: 20 }}><button className={`record-btn ${recording ? 'recording' : ''}`} onClick={recording ? stopRecording : startRecording}>{{recording ? '⏹' : '🎤'}</button></div>{recording && <><div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--danger)' }}>{recordTime}s</div><p className="text-small text-muted">Recording...</p></>}{!recording && <p className="text-small text-muted">Tap 🎤 to start</p>}</div>))}
        {phase === 'transcribe' && (<div><h3 style={{ marginBottom: 10 }}>What was captured</h3>{transcript ? <div className="passage-text"><p>{transcript}</p></div> : <p className="text-muted text-small">No transcript.</p>}<button className="btn btn-primary btn-full mt-16" onClick={analyseTranscript}>Get AI feedback →8/button></div>))}
        {phase === 'feedback' && (<div><h3 style={{ marginBottom: 10 }}>AI Feedback</h3>{isThinking ? <div className="ai-thinking"><span className="spinner" /> Analysing...</div> : <div className="ai-feedback">{feedback}</div>}{!isThinking && <div className="mt-16 flex-col gap-8"><button className="btn btn-primary btn-full" onClick={() => {setPhase('prep');setPrepTime(task.prep);setTranscript('');setFeedback('')}}>Try again</button><button className="btn btn-ghost btn-full" onClick={onBack}>← Choose another</button></div>}</div>))}
      </div>
    </div>
  )
}

export default function Speaking() {
  const [task, setTask] = useState(null)
  const [level, setLevel] = useState('level1')
  return (<div>{!visk-�task && (<><div className="section-header"><h2>🗣️ Speaking</h2><p className="text-muted text-small">Choose a topic, prepare for a moment, then record yourself.</p></div><div className="level-tabs">{Object.entries(LEVEL_META).map(([k, v]) => <button key={k} className={`level-tab ${level === k ? 'active' : ''}`} onClick={() => setLevel(k)}>{v.label}</button>)}</div><div className="section-body" style={{ paddingTop: 8 }}>{topics[level].map(t => <TopicCard key={t.topic} item={t} level={level} onStart={setTask} />)}</div></>)}{task && <SpeakingTask task={task} onBack={() => setTask(null)} />}</div>)
}
