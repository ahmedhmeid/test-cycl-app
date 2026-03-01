// [CYCL:d998318f-b910-43d1-818c-6d6f42ee8710] Per-habit mini leaderboard card
import Image from 'next/image'

interface HabitLeaderboardEntry {
  user_id: string
  display_name: string
  avatar_url: string | null
  streak: number
  is_current_user: boolean
}

interface PerHabitBoardProps {
  habitId: string
  habitName: string
  habitEmoji: string
  schedule: number[]
  entries: HabitLeaderboardEntry[]
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatSchedule(schedule: number[]) {
  if (schedule.length === 7) return 'Every day'
  if (schedule.join(',') === '1,2,3,4,5') return 'Mon – Fri'
  return schedule.map(d => DAY_NAMES[d]).join(', ')
}

export default function PerHabitBoard({ habitName, habitEmoji, schedule, entries }: PerHabitBoardProps) {
  return (
    <div className="bg-[#13112b] border-2 border-[#2e2a5e] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[#1e1a42]">
        <span className="text-xl">{habitEmoji}</span>
        <div>
          <div className="text-sm font-black text-[#e8e6f0]">{habitName}</div>
          <div className="text-xs text-[#5c5880]">{formatSchedule(schedule)}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {entries.map((entry, idx) => {
          const initial = entry.display_name[0]?.toUpperCase() ?? '?'
          return (
            <div key={entry.user_id} className="flex items-center gap-2 py-1 border-b border-[#1a1040] last:border-0">
              <span className={`w-4 text-xs font-black ${idx === 0 ? 'text-[#f59e0b]' : 'text-[#4a4570]'}`}>{idx + 1}</span>
              <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden bg-[#4c3d9e] flex-shrink-0">
                {entry.avatar_url ? (
                  <Image src={entry.avatar_url} alt={entry.display_name} width={24} height={24} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-xs font-black text-white">{initial}</span>
                )}
              </div>
              <span className={`text-xs font-bold flex-1 truncate ${entry.is_current_user ? 'text-[#a78bfa]' : 'text-[#c4bfe8]'}`}>
                {entry.display_name}
              </span>
              <span className="text-sm font-black text-[#a78bfa]">🔥 {entry.streak}</span>
            </div>
          )
        })}
        {entries.length === 0 && <p className="text-xs text-[#5c5880] py-2">No data yet</p>}
      </div>
    </div>
  )
}
