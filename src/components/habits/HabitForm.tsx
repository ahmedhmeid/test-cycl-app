'use client'
// [CYCL:744d9176-3187-4de0-adc5-53d9436dffa2] Habit creation/editing form with emoji picker and day-of-week selector
import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface HabitFormProps {
  initialValues?: {
    name?: string
    emoji?: string
    description?: string
    schedule?: number[]
  }
  onSubmit: (values: { name: string; emoji: string; description: string; schedule: number[] }) => Promise<void>
  loading?: boolean
  submitLabel?: string
}

export default function HabitForm({ initialValues, onSubmit, loading, submitLabel = 'Save' }: HabitFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [emoji, setEmoji] = useState(initialValues?.emoji ?? '✅')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [schedule, setSchedule] = useState<number[]>(initialValues?.schedule ?? [0, 1, 2, 3, 4, 5, 6])
  const [showPicker, setShowPicker] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleDay(day: number) {
    setSchedule(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name required'); return }
    if (schedule.length === 0) { setError('Select at least one day'); return }
    setError(null)
    await onSubmit({ name: name.trim(), emoji, description: description.trim(), schedule })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3 items-start">
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setShowPicker(p => !p)}
            className="w-12 h-12 rounded-xl bg-[#0f0e1a] border border-[#2e2a5e] flex items-center justify-center text-2xl hover:border-[#7c6df0] transition"
          >
            {emoji}
          </button>
          {showPicker && (
            <div className="absolute z-50 top-14 left-0">
              <EmojiPicker
                onEmojiClick={e => { setEmoji(e.emoji); setShowPicker(false) }}
                width={300}
                height={400}
              />
            </div>
          )}
        </div>
        <div className="flex-1">
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[#0f0e1a] border border-[#2e2a5e] rounded-lg px-4 py-2.5 text-white placeholder-[#4a4570] focus:outline-none focus:border-[#7c6df0] transition"
            placeholder="Habit name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#a09cc0] mb-1">Description <span className="text-[#4a4570]">(optional)</span></label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-[#0f0e1a] border border-[#2e2a5e] rounded-lg px-4 py-2.5 text-white placeholder-[#4a4570] focus:outline-none focus:border-[#7c6df0] transition resize-none"
          placeholder="Brief description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#a09cc0] mb-2">Schedule</label>
        <div className="flex gap-2">
          {DAYS.map((label, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => toggleDay(idx)}
              className={`w-9 h-9 rounded-full text-xs font-bold transition ${
                schedule.includes(idx)
                  ? 'bg-[#7c6df0] text-white'
                  : 'bg-[#0f0e1a] border border-[#2e2a5e] text-[#5c5880] hover:border-[#7c6df0]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#7c6df0] hover:bg-[#6a5dd8] disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition"
      >
        {loading ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
