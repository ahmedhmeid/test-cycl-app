'use client'
// [CYCL:870ccf50-4c1b-46cf-9a4c-35c3651e4819] Check-in button — calls POST /api/habit-logs, handles optimistic UI and duplicate
import { useState } from 'react'

interface CheckInButtonProps {
  habitId: string
  alreadyCheckedIn: boolean
  onCheckIn: () => void
}

export default function CheckInButton({ habitId, alreadyCheckedIn, onCheckIn }: CheckInButtonProps) {
  const [done, setDone] = useState(alreadyCheckedIn)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleCheckIn() {
    if (done || loading) return
    setLoading(true)
    setMessage(null)

    const today = new Date().toISOString().slice(0, 10)
    const res = await fetch('/api/habit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit_id: habitId, completed_date: today }),
    })

    if (res.status === 409) {
      setDone(true)
      setMessage('Already checked in today!')
    } else if (res.ok) {
      setDone(true)
      onCheckIn()
    } else {
      const data = await res.json()
      setMessage(data.error ?? 'Check-in failed')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-green-400 font-bold text-sm">✓ Done!</span>
        {message && <span className="text-xs text-[#5c5880]">{message}</span>}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="bg-[#7c6df0] hover:bg-[#6a5dd8] disabled:opacity-50 text-white text-sm font-bold px-4 py-1.5 rounded-full transition"
      >
        {loading ? '…' : 'Check in'}
      </button>
      {message && <p className="text-red-400 text-xs mt-1">{message}</p>}
    </div>
  )
}
