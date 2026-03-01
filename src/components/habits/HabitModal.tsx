'use client'
// [CYCL:744d9176-3187-4de0-adc5-53d9436dffa2] Modal wrapper around HabitForm for inline editing
import { useState } from 'react'
import HabitForm from './HabitForm'

interface Habit {
  id: string
  name: string
  emoji: string
  description: string | null
  schedule: number[]
}

interface HabitModalProps {
  habit: Habit
  onSave: (updated: Habit) => void
  onClose: () => void
}

export default function HabitModal({ habit, onSave, onClose }: HabitModalProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(values: { name: string; emoji: string; description: string; schedule: number[] }) {
    setLoading(true)
    const res = await fetch(`/api/habits/${habit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) onSave(data)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#13112b] border border-[#2e2a5e] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Edit habit</h3>
          <button onClick={onClose} className="text-[#5c5880] hover:text-white transition text-xl">×</button>
        </div>
        <HabitForm
          initialValues={{ ...habit, description: habit.description ?? undefined }}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Save changes"
        />
      </div>
    </div>
  )
}
