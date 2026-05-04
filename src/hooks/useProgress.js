// useProgress.js — All student progress stored in localStorage

import { useState, useEffect, useCallback } from 'react'

const KEY = 'englishspark_progress'

const defaultProgress = {
  grammarErrors: {},      // { errorTag: count }
  grammarMastered: [],    // [rung ids mastered]
  grammarUnlocked: [1],   // [rung ids unlocked]
  passagesRead: [],       // [passage ids]
  tasksCompleted: 0,
  streakDays: 0,
  lastActive: null,
  writingSubmissions: 0,
  speakingSubmissions: 0,
}

export function useProgress() {
  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY)
      return saved ? { ...defaultProgress, ...JSON.parse(saved) } : defaultProgress
    } catch { return defaultProgress }
  })

  const save = useCallback((updates) => {
    setProgress(prev => {
      const next = { ...prev, ...updates }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  // Update streak on load
  useEffect(() => {
    const today = new Date().toDateString()
    if (progress.lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      save({
        lastActive: today,
        streakDays: progress.lastActive === yesterday ? progress.streakDays + 1 : 1
      })
    }
  }, [])

  const recordError = useCallback((errorTag) => {
    setProgress(prev => {
      const errors = { ...prev.grammarErrors }
      errors[errorTag] = (errors[errorTag] || 0) + 1
      const next = { ...prev, grammarErrors: errors }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const getGapsToAddress = useCallback(() => {
    // Tags with 3+ errors that are in unlocked rungs but not mastered
    const { grammarErrors, grammarMastered, grammarUnlocked } = progress
    return Object.entries(grammarErrors)
      .filter(([tag, count]) => count >= 3)
      .map(([tag]) => tag)
  }, [progress])

  const markPassageRead = useCallback((id) => {
    if (!progress.passagesRead.includes(id)) {
      save({ passagesRead: [...progress.passagesRead, id], tasksCompleted: progress.tasksCompleted + 1 })
    }
  }, [progress, save])

  const markRungMastered = useCallback((rungId) => {
    const mastered = [...(progress.grammarMastered || []), rungId]
    const unlocked = [...(progress.grammarUnlocked || [1])]
    if (!unlocked.includes(rungId + 1) && rungId < 14) unlocked.push(rungId + 1)
    save({ grammarMastered: mastered, grammarUnlocked: unlocked })
  }, [progress, save])

  const recordWriting = useCallback(() => {
    save({ writingSubmissions: (progress.writingSubmissions || 0) + 1, tasksCompleted: progress.tasksCompleted + 1 })
  }, [progress, save])

  const recordSpeaking = useCallback(() => {
    save({ speakingSubmissions: (progress.speakingSubmissions || 0) + 1, tasksCompleted: progress.tasksCompleted + 1 })
  }, [progress, save])

  const reset = useCallback(() => {
    save(defaultProgress)
  }, [save])

  return {
    progress,
    recordError,
    getGapsToAddress,
    markPassageRead,
    markRungMastered,
    recordWriting,
    recordSpeaking,
    reset
  }
}
