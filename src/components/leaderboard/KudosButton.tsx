'use client'
// [CYCL:d998318f-b910-43d1-818c-6d6f42ee8710] Kudos emoji button — optimistic count, POSTs to /api/kudos
import { useState } from 'react'

interface KudosButtonProps {
  emoji: string
  count: number
  toUserId: string
  groupId: string
  habitId?: string | null
  disabled?: boolean
}

export default function KudosButton({ emoji, count, toUserId, groupId, habitId, disabled }: KudosButtonProps) {
  const [currentCount, setCurrentCount] = useState(count)
  const [sending, setSending] = useState(false)

  async function handleKudos() {
    if (sending || disabled) return
    setSending(true)
    setCurrentCount(c => c + 1) // Optimistic

    const res = await fetch('/api/kudos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_user_id: toUserId, group_id: groupId, habit_id: habitId ?? null, emoji }),
    })

    if (!res.ok) {
      setCurrentCount(c => c - 1) // Revert
    } else {
      const data = await res.json()
      setCurrentCount(data.kudos_counts?.[emoji] ?? currentCount + 1)
    }
    setSending(false)
  }

  return (
    <button
      onClick={handleKudos}
      disabled={disabled || sending}
      className="flex items-center gap-1 bg-[#4c3d9e]/20 border border-[#2e2a5e] hover:border-[#7c6df0] rounded-full px-2.5 py-1 text-sm text-[#a09cc0] font-bold transition disabled:opacity-50"
    >
      {emoji} <span className="text-xs text-[#5c5880]">{currentCount}</span>
    </button>
  )
}
