// [CYCL:d998318f-b910-43d1-818c-6d6f42ee8710] Milestone badge chip for streak thresholds (7/30/60/100 days)
interface Badge {
  type: string
  habit_id: string | null
}

const BADGE_CONFIG: Record<string, { label: string; color: string }> = {
  streak_7: { label: '🔥 7d', color: 'badge-green' },
  streak_30: { label: '🔥 30d', color: 'badge-gold' },
  streak_60: { label: '🔥 60d', color: 'badge-purple' },
  streak_100: { label: '💯 100d', color: 'badge-gold' },
}

const COLOR_CLASSES: Record<string, string> = {
  'badge-gold': 'text-[#f59e0b] border-[#f59e0b] bg-[#f59e0b]/10',
  'badge-purple': 'text-[#a78bfa] border-[#a78bfa] bg-[#a78bfa]/10',
  'badge-green': 'text-[#34d399] border-[#34d399] bg-[#34d399]/10',
}

export default function MilestoneBadge({ badges }: { badges: Badge[] }) {
  // Show highest badge for perfect-day (habit_id = null) and each habit
  const perfectBadges = badges.filter(b => b.habit_id === null)
  const highestPerfect = perfectBadges.sort((a, b) => {
    const order = { streak_100: 4, streak_60: 3, streak_30: 2, streak_7: 1 }
    return (order[b.type as keyof typeof order] ?? 0) - (order[a.type as keyof typeof order] ?? 0)
  })[0]

  if (!highestPerfect) return null

  const cfg = BADGE_CONFIG[highestPerfect.type]
  if (!cfg) return null

  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${COLOR_CLASSES[cfg.color]}`}>
      {cfg.label}
    </span>
  )
}
