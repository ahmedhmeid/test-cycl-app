'use client'
// [CYCL:744d9176-3187-4de0-adc5-53d9436dffa2] Renders list of HabitCards with archived toggle and new habit creation
import { useState } from 'react'
import HabitCard from './HabitCard'
import HabitForm from './HabitForm'

interface Habit {
  id: string
  name: string
  emoji: string
  description: string | null
  schedule: number[]
  streak: number
  isGroupHabit: boolean
  alreadyCheckedIn: boolean
  logs: { completed_date: string }[]
}

interface HabitListProps {
  habits: Habit[]
  isAdmin: boolean
  groupId?: string
  showNewHabitForm?: boolean
}

export default function HabitList({ habits: initialHabits, isAdmin, groupId, showNewHabitForm }: HabitListProps) {
  const [habits, setHabits] = useState(initialHabits)
  const [showArchived, setShowArchived] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [archivedHabits, setArchivedHabits] = useState<string[]>([])

  async function handleCreate(values: { name: string; emoji: string; description: string; schedule: number[] }) {
    setFormLoading(true)
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, group_id: groupId ?? null }),
    })
    const data = await res.json()
    if (res.ok) {
      setHabits(prev => [...prev, { ...data, streak: 0, isGroupHabit: !!groupId, alreadyCheckedIn: false, logs: [] }])
      setShowForm(false)
    }
    setFormLoading(false)
  }

  async function handleArchive(id: string) {
    if (!confirm('Archive this habit?')) return
    const res = await fetch(`/api/habits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: true }),
    })
    if (res.ok) {
      setArchivedHabits(prev => [...prev, id])
    }
  }

  function handleUpdate(updated: { id: string; name: string; emoji: string; description: string | null; schedule: number[] }) {
    setHabits(prev => prev.map(h => h.id === updated.id ? { ...h, ...updated } : h))
  }

  const visibleHabits = showArchived ? habits : habits.filter(h => !archivedHabits.includes(h.id))

  return (
    <div className="space-y-3">
      {visibleHabits.length === 0 && !showForm && (
        <div className="bg-[#13112b] border border-[#2e2a5e] rounded-xl p-6 text-center">
          <p className="text-[#5c5880]">No habits yet.</p>
        </div>
      )}

      {visibleHabits.map(habit => (
        <HabitCard
          key={habit.id}
          {...habit}
          isAdmin={isAdmin}
          onArchive={handleArchive}
          onUpdate={handleUpdate}
        />
      ))}

      {archivedHabits.length > 0 && (
        <button
          onClick={() => setShowArchived(p => !p)}
          className="text-xs text-[#5c5880] hover:text-[#a09cc0] transition"
        >
          {showArchived ? 'Hide archived' : `Show ${archivedHabits.length} archived`}
        </button>
      )}

      {showNewHabitForm && (isAdmin || !groupId) && (
        <>
          {showForm ? (
            <div className="bg-[#13112b] border border-[#2e2a5e] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-white text-sm">New habit</h4>
                <button onClick={() => setShowForm(false)} className="text-[#5c5880] hover:text-white transition">×</button>
              </div>
              <HabitForm onSubmit={handleCreate} loading={formLoading} submitLabel="Create habit" />
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full border border-dashed border-[#2e2a5e] hover:border-[#7c6df0] rounded-xl py-3 text-sm text-[#5c5880] hover:text-[#a78bfa] transition"
            >
              + Add habit
            </button>
          )}
        </>
      )}
    </div>
  )
}
