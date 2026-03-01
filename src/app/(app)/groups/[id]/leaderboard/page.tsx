'use client'
// [CYCL:d998318f-b910-43d1-818c-6d6f42ee8710] Group leaderboard page — Tier 1 (Perfect Day) + Tier 2 (per-habit), real-time updates
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import PerfectDayBoard from '@/components/leaderboard/PerfectDayBoard'
import PerHabitBoard from '@/components/leaderboard/PerHabitBoard'
import { useLeaderboardRealtime } from '@/hooks/useLeaderboardRealtime'

interface PerfectEntry {
  user_id: string
  display_name: string
  avatar_url: string | null
  streak: number
  weekly_score: number
  badges: { type: string; habit_id: string | null }[]
  kudos_counts: Record<string, number>
  is_current_user: boolean
}

interface HabitEntry {
  user_id: string
  display_name: string
  avatar_url: string | null
  streak: number
  is_current_user: boolean
}

interface HabitData {
  id: string
  name: string
  emoji: string
  schedule: number[]
  entries: HabitEntry[]
}

export default function LeaderboardPage() {
  const params = useParams()
  const groupId = params.id as string

  const [perfectEntries, setPerfectEntries] = useState<PerfectEntry[]>([])
  const [habitBoards, setHabitBoards] = useState<HabitData[]>([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [perfectRes, habitsRes] = await Promise.all([
      fetch(`/api/groups/${groupId}/leaderboard`),
      fetch(`/api/habits?groupId=${groupId}`),
    ])

    if (perfectRes.ok) setPerfectEntries(await perfectRes.json())
    if (habitsRes.ok) {
      const habits = await habitsRes.json()
      const habitData = await Promise.all(
        habits.map(async (h: { id: string; name: string; emoji: string; schedule: number[] }) => {
          const res = await fetch(`/api/groups/${groupId}/habits/${h.id}/leaderboard`)
          return {
            id: h.id,
            name: h.name,
            emoji: h.emoji ?? '✅',
            schedule: h.schedule,
            entries: res.ok ? await res.json() : [],
          }
        })
      )
      setHabitBoards(habitData)
    }
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    fetchData()
    // Fetch group name
    fetch(`/api/groups`).then(r => r.json()).then(groups => {
      const group = groups.find((g: { id: string; name: string }) => g.id === groupId)
      if (group) setGroupName(group.name)
    })
  }, [fetchData, groupId])

  useLeaderboardRealtime(groupId, fetchData)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 bg-[#13112b] rounded animate-pulse w-48" />
        <div className="h-48 bg-[#13112b] rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/groups/${groupId}`} className="text-sm text-[#5c5880] hover:text-[#a09cc0] transition">← {groupName || 'Group'}</Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#4c3d9e] border-2 border-[#7c6df0] flex items-center justify-center text-2xl">👥</div>
        <div>
          <h1 className="text-xl font-black text-[#f0eeff]">{groupName}</h1>
          <p className="text-xs text-[#5c5880]">{perfectEntries.length} member{perfectEntries.length !== 1 ? 's' : ''} · {habitBoards.length} shared habit{habitBoards.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Tier 1: Perfect Day */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-[#f59e0b] border border-[#f59e0b] bg-[#f59e0b]/10 px-2.5 py-1 rounded-full">🏆 Ultimate</span>
          <span className="text-xs text-[#5c5880]">Perfect Day Leaderboard — complete ALL habits every day</span>
        </div>
        <PerfectDayBoard entries={perfectEntries} groupId={groupId} />
      </div>

      <hr className="border-dashed border-[#2e2a5e]" />

      {/* Tier 2: Per-Habit */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-[#a78bfa] border border-[#a78bfa] bg-[#a78bfa]/10 px-2.5 py-1 rounded-full">📋 Per Habit</span>
          <span className="text-xs text-[#5c5880]">Individual habit streak leaderboards</span>
        </div>
        {habitBoards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {habitBoards.map(h => (
              <PerHabitBoard
                key={h.id}
                habitId={h.id}
                habitName={h.name}
                habitEmoji={h.emoji}
                schedule={h.schedule}
                entries={h.entries}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5c5880]">No habits created yet.</p>
        )}
      </div>
    </div>
  )
}
