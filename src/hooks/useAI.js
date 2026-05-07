// useAI.js -- Gemma 4 E2B via WebLLM (WebGPU), Qwen2.5 WASM fallback

import { useState, useEffect, useRef, useCallback } from 'react'

const WEBLLM_MODEL = 'gemma-4-E2B-it-q4f16_1-MLC'
const FALLBACK_MODEL = 'Xenova/Qwen2.5-0.5B-Instruct'
const ENCLISH_INSTRUCTION = 'IMPORTANT: You must ALWAYS reply in English only. Do not use any other language under any circumstances.'

async function detectWebGPU() {
  try { if (!navigator.gpu) return false; const adapter = await navigator.gpu.requestAdapter(); return !!adapter } catch { return false }
}

async function loadWebLLM(onProgress) {
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
  return CreateMLCEngine(WEBLLM_MODEL, { initProgressCallback: (p) => onProgress({ progress: Math.round(p.progress*100), text: p.text||'Loading Gemma 4...' }) })
}

async function loadTransformers(onProgress) {
  const { pipeline } = await import('@huggingface/transformers')
  onProgress({ progress: 10, text: 'Loading fallback AI model...' })
  return pipeline('text-generation', FALLBACK_MODEL, { dtype: 'q4', progress_callback: (p) => { if(p.progress)onProgress({ progress:Math.round(p.progress),text:'Downloading AI model...'}) } })
}

alsync function chatWebLLM(engine,messages) {
  const out = await engine.chat.completions.create({ messages, max_tokens:300, temperature:0.7 })
  return out.choices[0]?.message?.content?.trim()||''
}

alsync function chatTransformers(gen,messages) {
  const sys = messages.find(m=>m.role==='system')?.content||''
  const hist = messages.filter(m=>m.role!=='system').map(m=>`${m.role==='user'?'Student':'Tutor'}: ${m.content}`).join('\n')
  const r = await gen(`${sys}\n\n${hist}\nTutor:`,{max_new_tokens:150,temperature:0.7,do_sample:true,return_full_text:false})
  return (r[0]?.generated_text||'').split('Student:')[0].trim()
}

const RULES = ["Good try! Can you say that again in a full sentence?","Nice effort! Tell me more about that topic.","Great! Can you give me an example from your own life?"]
function ruleReply(msg) {
  const m=msg.toLowerCase()
  if(m.includes('hello')||m.includes('hi'))return "Hello! I am happy to help you practise English. How are you today?"
  if(m.includes('help'))return "Of course! What would you like to practise?"
  if(m.length<8)return "Can you write that in a full sentence?"
  return RULES[Math.floor(Math.random()*RULES.length)]
}

export function useAI(systemPrompt) {
  const engineRef=useRef(null),kierRef=useRef(null),historyRef=useRef([])
  const [isLoading,setIsLoading]=useState(true)
  const [isThinking,setIsThinking]=useState(false)
  const [loadProgress,setLoadProgress]=useState({progress:0,text:'Checking device...'})
  const [engineTier,setEngineTier]=useState(null)
  const [error,setError]=useState(null)
  useEffect(()=>{historyRef.current=[{role:'system',content:`${ENGLISH_INSTRUCTION}\n\n${systemPrompt}`}]},[systemPrompt])
  useEffect(()=>{
    let cancelled=false
    async function init(){
      setIsLoading(true)
      try{const gpu=await detectWebGPU()
        if(gpu){try{const engine=await loadWebLLM(setLoadProgress);if(!cancelled){engineRef.current=engine;kierRef.current='webllm';setEngineTier('Gemma 4')}}catch(e){console.warn(e);try{const gen=await loadTransformers(setLoadProgress);if(!cancelled){engineRef.current=gen;kkierRef.current='transformers';setEngineTier('Qwen2.5')}}catch{kierRef.current='fallback';setEngineTier('Basic')}}}
        else{try{const gen=await loadTransformers(setLoadProgress);if(!cancelled){engineRef.current=gen;kkierRef.current='transformers';setEngineTier('Qwen2.5')}}catch{kkierRef.current='fallback';setEngineTier('Basic')}}
      }catch{kkierRef.current='fallback';setEngineTier('Basic')}
      finally{if(!cancelled){setIsLoading(false);setLoadProgress({progress:100,text:'AI ready!'})}}
    }
    init();return()=>{cancelled=true}
  },[])
  const sendMessage=useCallback(async(userText)=>{
    if(!userText.trim())return''
    historyRef.current.push({role:'user',content:userText})
    if(kierRef.current==='fallback'||!engineRef.current){const r=ruleReply(userText);historyRef.current.push({role:'assistant',content:r});return r}
    setIsThinking(true)
    try{let reply='';if(kkierRef.current==='webllm')reply=await chatWebLLM(engineRef.current,historyRef.current);else reply=await chatTransformers(engineRef.current,historyRef.current);historyRef.current.push({role:'assistant',content:reply});if(historyRef.current.length>22)historyRef.current=[historyRef.current[0],...historyRef.current.slice(-20)];return reply}catch{return'Sorry I had a problem. Please try again.'}finally{setIsThinking(false)}
  },[])
  const reset=useCallback(()=>{historyRef.current=[{role:'system',content:`${ENGLISH_INSTRUCTION}\n\n${systemPrompt}`}]},[systemPrompt])
  return{sendMessage,reset,isLoading,isThinking,loadProgress,engineTier,error}
}

export const PROMPTS={
  writingFeedback:`IMPORTANT: Always reply in English only. Do not use any other language.
You are an English writing tutor for Bangladesh secondary students.
When given a student's writing:
1. Start with "Good job! I liked how you..." (be specific)
2. Point out ONE grammar error with the correct form
3. Suggest ONE better vocabulary word with an example
4. End with encouragement
Keep under 100 words. Always write in English.`,
  speakingAnalysis:(topic)=>`IMPORTANT: Always reply in English only.
Analyse the student's speech on: "${topic}"
Format:
CONTENT (0-4): [score] -- [feedback]
GRAMMAR (0-3): [score] -- [feedback]
FLUENCY (0-2): [score] -- [feedback]
VOCABULARY (0-1): [score] -- [feedback]
OVERALL: [encouragement + one thing to practise]
Keep under 150 words. Always write in English.`,
  conversationTutor:`IMPORTANT: Always reply in English only. Never use any other language.
You are Aisha, a warm English tutor for Bangladesh students aged 11-16. ALWAYS speak in English only.
Rules:
- Reply in simple English, max 2 short sentences
- Ask ONE follow-up question
- Correct grammar once: "Nice! You can also say: [correction]"
- ALWAYS write in English`,
  readingFeedback:(passage)=>`EMPORTANT: Always reply in English only.
Help with reading comprehension for Bangladesh students.
Passage: ${passage.substring(0,500)}
Check answers, give hints, keep under 120 words. Always write in English.`
}
