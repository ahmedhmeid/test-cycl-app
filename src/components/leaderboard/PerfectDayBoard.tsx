'use client'
// [CYCL:d998318f-b910-43d1-818c-6d6f42ee8710] Perfect Day leaderboard with avatar, name, streak, badges, and kudos buttons
import Image from 'next/image'
import KudosButton from './KudosButton'
import MilestoneBadge from './MilestoneBadge'

interface LeaderboardEntry {
  user_id: string
  display_name: string
  avatar_url: string | null
  streak: number
  weekly_score: number
  badges: { type: string; habit_id: string | null }[]
  kudos_counts: Record<string, number>
  is_current_user: boolean
}

const RANK_LABELS = ['🥇', '🥈', '🥉']

export default function PerfectDayBoard({ entries, groupId }: { entries: LeaderboardEntry[]; groupId: string }) {
  return (
    <div className="bg-gradient-to-br from-[#1a1040] to-[#13112b] border-2 border-[#7c6df0] rounded-2xl p-4 shadow-[0_0_24px_rgba(124,109,240,0.15)]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-black text-[#f0eeff]">🌟 Perfect Day Streak</div>
          <div className="text-xs text-[#5c5880] mt-0.5">Hit every group habit on schedule — no breaks</div>
        </div>
        <div className="flex gap-2 text-xs font-bold text-[#4a4570] uppercase tracking-wide">
          <span className="min-w-[52px] text-center">Streak</span>
          <span className="min-w-[52px] text-center">Weekly ✓</span>
        </div>
      </div>

      <div className="space-y-1">
        {entries.map((entry, idx) => {
          const initial = entry.display_name[0]?.toUpperCase() ?? '?'
          const rankLabel = RANK_LABELS[idx] ?? String(idx + 1)

          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-transparent ${
                entry.is_current_user ? 'bg-[#4c3d9e]/25 border-[#4c3d9e]/40' : 'border-[#1e1a42]'
              }`}
            >
              <div className={`w-7 text-center text-base font-black ${idx === 0 ? 'text-[#f59e0b]' : idx === 1 ? 'text-[#94a3b8]' : idx === 2 ? 'text-[#b45309]' : 'text-[#4a4570]'}`}>
                {rankLabel}
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border-2 border-[#2e2a5e] flex-shrink-0 bg-[#4c3d9e]">
                {entry.avatar_url ? (
                  <Image src={entry.avatar_url} alt={entry.display_name} width={36} height={36} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-sm font-black text-white">{initial}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#e8e6f0]">
                  {entry.display_name}
                  {entry.is_current_user && <span className="ml-1 text-[#5c5880] font-normal text-xs">(you)</span>}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <MilestoneBadge badges={entry.badges} />
                </div>
              </div>
              <div className="flex gap-1">
                {['🔥', '👏', '💪'].map(emoji => (
                  <KudosButton
                    key={emoji}
                    emoji={emoji}
                    count={entry.kudos_counts[emoji] ?? 0}
                    toUserId={entry.user_id}
                    groupId={groupId}
                    habitId={null}
                    disabled={entry.is_current_user}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <div className="min-w-[52px] text-center">
                  <div className="text-lg font-black text-[#f59e0b]">{entry.streak}</div>
                  <div className="text-xs text-[#4a4570]">days</div>
                </div>
                <div className="min-w-[52px] text-center">
                  <div className="text-lg font-black text-[#a78bfa]">{entry.weekly_score}</div>
                  <div className="text-xs text-[#4a4570]">weeks</div>
                </div>
              </div>
            </div>
          )
        })}
        {entries.length === 0 && (
          <p className="text-sm text-[#5c5880] text-center py-4">No data yet — start checking in!</p>
        )}
      </div>
    </div>
  )
}
