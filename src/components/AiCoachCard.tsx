'use client'
// [CYCL:627a0e79-701b-45ef-b7af-3c2e9900b46b] AI coach card — fetches weekly summary, shows loading skeleton, supports dismissal
import { useState, useEffect } from 'react'

function getISOWeekKey() {
  const date = new Date()
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${week}`
}

interface Summary {
  summary_text: string
  tip_text: string
}

export default function AiCoachCard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const weekKey = getISOWeekKey()
    const dismissedKey = localStorage.getItem('dismissed_week')
    if (dismissedKey === weekKey) {
      setDismissed(true)
      setLoading(false)
      return
    }

    async function fetchSummary() {
      try {
        const res = await fetch('/api/ai/weekly-summary', { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          setSummary(data)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      }
      setLoading(false)
    }

    fetchSummary()
  }, [])

  function handleDismiss() {
    const weekKey = getISOWeekKey()
    localStorage.setItem('dismissed_week', weekKey)
    setDismissed(true)
  }

  if (dismissed || error) return null

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#2d1f5e] to-[#1a1040] border border-[#7c6df0]/40 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-[#4c3d9e]/50 rounded w-32 mb-3" />
        <div className="h-3 bg-[#4c3d9e]/30 rounded w-full mb-2" />
        <div className="h-3 bg-[#4c3d9e]/30 rounded w-3/4" />
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="bg-gradient-to-br from-[#2d1f5e] to-[#1a1040] border border-[#7c6df0]/60 rounded-xl p-5 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-[#5c5880] hover:text-[#a09cc0] transition text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🤖</span>
        <span className="text-sm font-bold text-[#a78bfa]">AI Coach — Weekly Summary</span>
      </div>
      <p className="text-sm text-[#e8e6f0] mb-3 leading-relaxed">{summary.summary_text}</p>
      <div className="bg-[#4c3d9e]/30 rounded-lg px-4 py-3">
        <p className="text-xs font-bold text-[#f59e0b] mb-1">💡 Tip of the week</p>
        <p className="text-sm text-[#c4bfe8] leading-relaxed">{summary.tip_text}</p>
      </div>
    </div>
  )
}
