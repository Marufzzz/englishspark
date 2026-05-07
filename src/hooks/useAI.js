// useAI.js — Gemma 4 E2B via WebLLM (WebGPU), Qwen2.5 WASM fallback

import { useState, useEffect, useRef, useCallback } from 'react'

const WEBLLM_MODEL = 'gemma-4-E2B-it-q4f16_1-MLC'
const FALLBACK_MODEL = 'Xenova/Qwen2.5-0.5B-Instruct'
const ENGLISH_INSTRUCTION = 'IMPORTANT: You must ALWAYS reply in English only. Do not use any other language under any circumstances.'

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
    initProgressCallback: (p) => onProgress({ progress: Math.round(p.progress * 100), text: p.text || 'Loading Gemma 4...' })
  })
}

async function loadTransformers(onProgress) {
  const { pipeline } = await import('@huggingface/transformers')
  onProgress({ progress: 10, text: 'Loading fallback AI model...' })
  return pipeline('text-generation', FALLBACK_MODEL, {
    dtype: 'q4',
    progress_callback: (p) => { if (p.progress) onProgress({ progress: Math.round(p.progress), text: 'Downloading AI model...' }) }
  })
}

async function chatWebLLM(engine, messages) {
  const out = await engine.chat.completions.create({ messages, max_tokens: 300, temperature: 0.7 })
  return out.choices[0]?.message?.content?.trim() || ''
}

async function chatTransformers(gen, messages) {
  const sys = messages.find(m => m.role === 'system')?.content || ''
  const hist = messages.filter(m => m.role !== 'system').map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n')
  const r = await gen(`${sys}\n\n${hist}\nTutor:`, { max_new_tokens: 150, temperature: 0.7, do_sample: true, return_full_text: false })
  return (r[0]?.generated_text || '').split('Student:')[0].trim()
}

const RULE_REPLIES = ["Good try! Can you say that again in a full sentence?","Nice effort! Tell me more about that topic.","Great! Can you give me an example from your own life?","Well done for trying! Can you use that word in another sentence?"]

function ruleReply(msg) {
  const m = msg.toLowerCase()
  if (m.includes('hello') || m.includes('hi')) return "Hello! I am happy to help you practise English. How are you today?"
  if (m.includes('help')) return "Of course! What would you like to practise — speaking or Writing?"
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
    historyRef.current = [{ role: 'system', content: `${ENGLISH_INSTRUCTION}\n\n${systemPrompt}` }]
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
            if (!cancelled) { engineRef.current = engine; tierRef.current = 'webllm'; setEngineTier('Gemma 4') }
          } catch (e) {
            console.warn('WebLLM failed:', e)
            try {
              const gen = await loadTransformers(setLoadProgress)
              if (!cancelled) { engineRef.current = gen; tierRef.current = 'transformers'; setEngineTier('Qwen2.5') }
            } catch { tierRef.current = 'fallback'; setEngineTier('Basic') }
          }
        } else {
          try {
            const gen = await loadTransformers(setLoadProgress)
            if (!cancelled) { engineRef.current = gen; tierRef.current = 'transformers'; setEngineTier('Qwen2.5') }
          } catch { tierRef.current = 'fallback'; setEngineTier('Basic') }
        }
      } catch { tierRef.current = 'fallback'; setEngineTier('Basic') }
      finally { if (!cancelled) { setIsLoading(false); setLoadProgress({ progress: 100, text: 'AI ready!' }) } }
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
      if (historyRef.current.length > 22) historyRef.current = [historyRef.current[0], ...historyRef.current.slice(-20)]
      return reply
    } catch { return 'Sorry, I had a problem. Please try again.' }
    finally { setIsThinking(false) }
  }, [])
  const reset = useCallback(() => {
    historyRef.current = [{ role: 'system', content: `${ENGLISH_INSTRUCTION}\n\n${systemPrompt}` }]
  }, [systemPrompt])
  return { sendMessage, reset, isLoading, isThinking, loadProgress, engineTier, error }
}

export const PROMPTS = {
  writingFeedback: `IMPORTANT: You must ALWAYS reply in English only. Do not use any other language.
You are an English writing tutor for Bangladesh secondary students. Always respond in English only.
When given a student's writing:
1. Start with "Good job! I liked how you..." (be specific)
2. Point out ONE grammar error with the correct form and a simple explanation
3. Suggest ONE better vocabulary word with an example sentence
4. End with encouragement
Keep total response under 100 words. Never rewrite their paragraph for them. Always write in English.`,
  speakingAnalysis: (topic) => `IMPORTANT: You must ALWAYS reply in English only. Do not use any other language.
You are analysing a student's spoken English on the topic: "${topic}". Always respond in English only.
Provide feedback in this exact format:
CONTENT (0-4): [score] — [did they address the topic?]
GRAMMAR (0-3): [score] — [name up to 2 error types]
FLUENCY (0-2): [score] — [any issues?]
VOCABULARY (0-1): [score] — [any good words or suggest one upgrade]
OVERALL: [one encouraging sentence + one thing to practise]
Keep under 150 words. Always write in English.`,
  conversationTutor: `IMPORTANT: You must ALWAYS reply in English only. Do not use any other language.
You are Aisha, a warm English tutor for Bangladesh secondary students aged 11-16. ALWAYS speak in English only.
Rules:
- Reply in simple English, maximum 2 short sentences
- Ask ONE follow-up question each turn
- If the student makes a grammar error, say it correctly once: "Nice! You can also say: [correction]"
- Never correct more than 1 error per reply
- Use familiar topics: school, family, food, village, weather
- Always end with a question or encouragement
- ALWAYS write in English, never in any other language`,
  readingFeedback: (passage) => `IMPORTANT: You must ALWAYS reply in English only. Do not use any other language.
You are a reading comprehension helper for Bangladesh secondary students. Always respond in English only.
The student has read this passage:
---
${passage.substring(0, 500)}...
---
When the student submits answers:
- Check each answer for meaning (not exact words)
- Say which answers are correct and which need improvement
- For wrong answers, give a hint without revealing the full answer
- Keep total response under 120 words. Always write in English.`
}
