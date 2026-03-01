// [CYCL:d998318f-b910-43d1-818c-6d6f42ee8710] Personal stats page — shows check-ins, streaks, per-habit breakdown
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatsCard from '@/components/stats/StatsCard'
import { calculateStreak } from '@/lib/streak'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: habits } = await supabase
    .from('habits')
    .select('id, name, emoji, schedule, group_id')
    .eq('created_by', user.id)

  const { data: allLogs } = await supabase
    .from('habit_logs')
    .select('habit_id, completed_date')
    .eq('user_id', user.id)

  const totalCheckIns = allLogs?.length ?? 0

  // Per-habit stats with real streak calculation
  const habitStats = await Promise.all((habits ?? []).map(async h => {
    const logs = (allLogs ?? []).filter(l => l.habit_id === h.id)
    const logSet = new Set(logs.map(l => l.completed_date))
    const scheduleSet = new Set(h.schedule as number[])
    const sortedDates = [...logSet].sort()

    // Longest streak: walk forward from each log date
    let longestStreak = 0
    for (const startDate of sortedDates) {
      let tempStreak = 0
      const cursor = new Date(startDate + 'T00:00:00Z')
      for (let j = 0; j < 400; j++) {
        const dow = cursor.getUTCDay()
        const ds = cursor.toISOString().slice(0, 10)
        if (scheduleSet.has(dow)) {
          if (logSet.has(ds)) { tempStreak++ } else { break }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1)
        if (tempStreak > longestStreak) longestStreak = tempStreak
      }
    }

    const currentStreak = await calculateStreak(h.id, user.id, h.schedule as number[], supabase)

    return { habit: h, total: logs.length, longestStreak, currentStreak }
  }))

  const longestEverStreak = Math.max(0, ...habitStats.map(h => h.longestStreak))
  const currentStreak = Math.max(0, ...habitStats.map(h => h.currentStreak))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-white">Your Stats</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatsCard label="Total Check-ins" value={totalCheckIns} icon="✅" />
        <StatsCard label="Current Streak" value={currentStreak} icon="🔥" sub="scheduled days" />
        <StatsCard label="Longest Streak" value={longestEverStreak} icon="🏆" sub="ever" />
        <StatsCard label="Habits Tracked" value={habits?.length ?? 0} icon="📋" />
      </div>

      {habitStats.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-3">Per-Habit Breakdown</h2>
          <div className="space-y-2">
            {habitStats.map(({ habit, total, longestStreak, currentStreak: cs }) => (
              <div key={habit.id} className="bg-[#13112b] border border-[#2e2a5e] rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{habit.emoji ?? '✅'}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{habit.name}</p>
                    <p className="text-xs text-[#5c5880]">{habit.group_id ? 'Group habit' : 'Private habit'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[#a78bfa]">{cs > 0 ? `🔥 ${cs}` : total}</p>
                  <p className="text-xs text-[#5c5880]">{cs > 0 ? 'day streak' : 'check-ins'}</p>
                  {longestStreak > cs && <p className="text-xs text-[#4a4570]">best: {longestStreak}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
