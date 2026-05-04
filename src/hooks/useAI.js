// useAI.js — WebLLM (Gemma 4 E2B) with Transformers.js WASM fallback

import { useState, useEffect, useRef, useCallback } from 'react'

const WEBLLM_MODEL = 'gemma-4-E2B-it-q4f16_1-MLC'
const FALLBACK_MODEL = 'Xenova/Qwen2.5-0.5B-Instruct'

async function detectWebGPU() {
  try {
    if (!navigator.gpu) return false
    const adapter = await navigator.gpu.requestAdapter()
    return !!adapter
  } catch { return false }
}

async function loadWebLLM(onProgress) {
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
  return CreateMLCEngine(WEBLLM_MODEL, {
    initProgressCallback: (p) => onProgress({ progress: Math.round(p.progress * 100), text: p.text })
  })
}

async function loadTransformers(onProgress) {
  const { pipeline } = await import('@huggingface/transformers')
  onProgress({ progress: 10, text: 'Loading fallback AI model...' })
  const gen = await pipeline('text-generation', FALLBACK_MODEL, {
    dtype: 'q4',
    progress_callback: (p) => {
      if (p.progress) onProgress({ progress: Math.round(p.progress), text: 'Downloading AI model...' })
    }
  })
  return gen
}

async function chatWebLLM(engine, messages) {
  const out = await engine.chat.completions.create({ messages, max_tokens: 300, temperature: 0.7 })
  return out.choices[0]?.message?.content?.trim() || ''
}

async function chatTransformers(gen, messages) {
  const sys = messages.find(m => m.role === 'system')?.content || ''
  const hist = messages.filter(m => m.role !== 'system')
    .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n')
  const prompt = `${sys}\n\n${hist}\nTutor:`
  const r = await gen(prompt, { max_new_tokens: 150, temperature: 0.7, do_sample: true, return_full_text: false })
  return (r[0]?.generated_text || '').split('Student:')[0].trim()
}

const RULE_REPLIES = [
  "Good try! Can you say that again in a full sentence?",
  "Nice effort! Tell me more about that topic.",
  "I understand. What do you think about this?",
  "Great! Can you give me an example from your own life?",
  "Well done for trying! Can you use that word in another sentence?",
]

function ruleReply(msg) {
  const m = msg.toLowerCase()
  if (m.includes('hello') || m.includes('hi')) return "Hello! I am happy to help you practise English. How are you today?"
  if (m.includes('help')) return "Of course! What would you like to practise — speaking or writing?"
  if (m.length < 8) return "Can you write that in a full sentence? It helps you practise more!"
  return RULE_REPLIES[Math.floor(Math.random() * RULE_REPLIES.length)]
}

export function useAI(systemPrompt) {
  const engineRef = useRef(null)
  const tierRef = useRef(null)
  const historyRef = useRef([])
  const [isLoading, setIsLoading] = useState(true)
  const [isThinking, setIsThinking] = useState(false)
  const [loadProgress, setLoadProgress] = useState({ progress: 0, text: 'Checking device...' })
  const [engineTier, setEngineTier] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    historyRef.current = [{ role: 'system', content: systemPrompt }]
  }, [systemPrompt])

  useEffect(() => {
    let cancelled = false
    async function init() {
      setIsLoading(true)
      try {
        const gpu = await detectWebGPU()
        if (gpu) {
          try {
            const engine = await loadWebLLM(setLoadProgress)
            if (!cancelled) { engineRef.current = engine; tierRef.current = 'webllm'; setEngineTier('webllm') }
          } catch (e) {
            console.warn('WebLLM failed, trying WASM:', e)
            try {
              const gen = await loadTransformers(setLoadProgress)
              if (!cancelled) { engineRef.current = gen; tierRef.current = 'transformers'; setEngineTier('transformers') }
            } catch { tierRef.current = 'fallback'; setEngineTier('fallback') }
          }
        } else {
          try {
            const gen = await loadTransformers(setLoadProgress)
            if (!cancelled) { engineRef.current = gen; tierRef.current = 'transformers'; setEngineTier('transformers') }
          } catch { tierRef.current = 'fallback'; setEngineTier('fallback') }
        }
      } catch { tierRef.current = 'fallback'; setEngineTier('fallback') }
      finally { if (!cancelled) { setIsLoading(false); setLoadProgress({ progress: 100, text: 'AI tutor ready!' }) } }
    }
    init()
    return () => { cancelled = true }
  }, [])

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim()) return ''
    historyRef.current.push({ role: 'user', content: userText })
    if (tierRef.current === 'fallback' || !engineRef.current) {
      const r = ruleReply(userText)
      historyRef.current.push({ role: 'assistant', content: r })
      return r
    }
    setIsThinking(true)
    try {
      let reply = ''
      if (tierRef.current === 'webllm') reply = await chatWebLLM(engineRef.current, historyRef.current)
      else reply = await chatTransformers(engineRef.current, historyRef.current)
      historyRef.current.push({ role: 'assistant', content: reply })
      if (historyRef.current.length > 22) {
        historyRef.current = [historyRef.current[0], ...historyRef.current.slice(-20)]
      }
      return reply
    } catch (e) {
      setError('AI had a problem. Please try again.')
      return 'Sorry, I had a problem. Please try again.'
    } finally { setIsThinking(false) }
  }, [])

  const reset = useCallback(() => {
    historyRef.current = [{ role: 'system', content: systemPrompt }]
  }, [systemPrompt])

  return { sendMessage, reset, isLoading, isThinking, loadProgress, engineTier, error }
}

export const PROMPTS = {
  writingFeedback: `You are an English writing tutor for Bangladesh secondary students.
When given a student's writing:
1. Start with "Good job! I liked how you..." (be specific)
2. Point out ONE grammar error with the correct form and a simple explanation
3. Suggest ONE better vocabulary word with an example sentence
4. End with encouragement
Keep total response under 100 words. Never rewrite their paragraph for them.`,

  speakingAnalysis: (topic) => `You are analysing a student's spoken English on the topic: "${topic}".
The student's speech transcript is given below.
Provide feedback in this exact format:
CONTENT (0-4): [score] — [did they address the topic? what was missing?]
GRAMMAR (0-3): [score] — [name up to 2 error types with one example each]
FLUENCY (0-2): [score] — [any repeated words, very short response, or missing ideas?]
VOCABULARY (0-1): [score] — [any good words used, or suggest one upgrade]
OVERALL: [one encouraging sentence + one specific thing to practise next]
Keep total response under 150 words.`,

  conversationTutor: `You are Aisha, a warm English tutor for Bangladesh secondary students aged 11-16.
Rules:
- Reply in simple English, maximum 2 short sentences
- Ask ONE follow-up question each turn
- If the student makes a grammar error, say it correctly once: "Nice! You can also say: [correction]"
- Never correct more than 1 error per reply
- Use familiar topics: school, family, food, village, weather
- Always end with a question or encouragement`,

  readingFeedback: (passage) => `You are a reading comprehension helper for Bangladesh secondary students.
The student has read this passage:
---
${passage.substring(0, 500)}...
---
When the student submits answers to questions:
- Check each answer for meaning (not exact words)
- Say which answers are correct and which need improvement
- For wrong answers, give a hint without revealing the full answer
- Keep total response under 120 words
- Be encouraging`
}
