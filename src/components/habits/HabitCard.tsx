'use client'
// [CYCL:744d9176-3187-4de0-adc5-53d9436dffa2] Habit card showing emoji, name, schedule, streak, check-in button, and edit controls
import { useState } from 'react'
import CheckInButton from './CheckInButton'
import HabitModal from './HabitModal'
import HabitHeatmap from './HabitHeatmap'

const SHORT_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface HabitCardProps {
  id: string
  name: string
  emoji: string
  description: string | null
  schedule: number[]
  streak: number
  isGroupHabit: boolean
  isAdmin: boolean
  alreadyCheckedIn: boolean
  logs: { completed_date: string }[]
  onArchive?: (id: string) => void
  onUpdate?: (updated: { id: string; name: string; emoji: string; description: string | null; schedule: number[] }) => void
}

function formatSchedule(schedule: number[]) {
  if (schedule.length === 7) return 'Every day'
  if (schedule.length === 0) return 'No schedule'
  const sorted = [...schedule].sort((a, b) => a - b)
  if (sorted.join(',') === '1,2,3,4,5') return 'Mon – Fri'
  if (sorted.join(',') === '0,6') return 'Weekends'
  return sorted.map(d => SHORT_DAYS[d]).join(' ')
}

export default function HabitCard({
  id, name, emoji, description, schedule, streak, isGroupHabit, isAdmin,
  alreadyCheckedIn, logs, onArchive, onUpdate,
}: HabitCardProps) {
  const [checkedIn, setCheckedIn] = useState(alreadyCheckedIn)
  const [editing, setEditing] = useState(false)
  const [currentName, setCurrentName] = useState(name)
  const [currentEmoji, setCurrentEmoji] = useState(emoji)

  function handleCheckIn() {
    setCheckedIn(true)
  }

  function handleSave(updated: { id: string; name: string; emoji: string; description: string | null; schedule: number[] }) {
    setCurrentName(updated.name)
    setCurrentEmoji(updated.emoji)
    setEditing(false)
    onUpdate?.(updated)
  }

  const canEdit = !isGroupHabit || isAdmin

  return (
    <>
      <div className={`bg-[#13112b] border rounded-xl p-4 transition ${checkedIn ? 'border-green-500/40 shadow-[0_0_16px_rgba(52,211,153,0.1)]' : 'border-[#2e2a5e]'}`}>
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0 mt-0.5">{currentEmoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white">{currentName}</h3>
              {isGroupHabit && (
                <span className="text-xs text-[#a78bfa] border border-[#a78bfa]/40 px-1.5 rounded">group</span>
              )}
            </div>
            {description && <p className="text-xs text-[#5c5880] mt-0.5">{description}</p>}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-xs text-[#4a4570]">{formatSchedule(schedule)}</span>
              {streak > 0 && (
                <span className="text-sm font-bold text-orange-400">🔥 {streak} day{streak !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <CheckInButton habitId={id} alreadyCheckedIn={checkedIn} onCheckIn={handleCheckIn} />
            {canEdit && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-[#5c5880] hover:text-[#a09cc0] transition px-2 py-1 rounded"
                title="Edit"
              >
                ✏️
              </button>
            )}
            {canEdit && onArchive && (
              <button
                onClick={() => onArchive(id)}
                className="text-xs text-[#5c5880] hover:text-red-400 transition px-1 py-1 rounded"
                title="Archive"
              >
                🗄
              </button>
            )}
          </div>
        </div>

        <HabitHeatmap logs={logs} />
      </div>

      {editing && (
        <HabitModal
          habit={{ id, name: currentName, emoji: currentEmoji, description, schedule }}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}
