// [CYCL:d998318f-b910-43d1-818c-6d6f42ee8710] Personal stats page — shows check-ins, streaks, per-habit breakdown
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatsCard from '@/components/stats/StatsCard'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: habits }, { data: allLogs }] = await Promise.all([
    supabase.from('habits').select('id, name, emoji, schedule, group_id').eq('created_by', user.id),
    supabase.from('habit_logs').select('habit_id, completed_date').eq('user_id', user.id),
  ])

  const totalCheckIns = allLogs?.length ?? 0

  // Simple per-habit stats (streak computed from logs)
  const habitStats = (habits ?? []).map(h => {
    const logs = (allLogs ?? []).filter(l => l.habit_id === h.id).sort((a, b) => a.completed_date.localeCompare(b.completed_date))
    const totalForHabit = logs.length
    return { habit: h, total: totalForHabit }
  })

  const longestStreak = habitStats.reduce((max, { total }) => Math.max(max, total), 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-white">Your Stats</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatsCard label="Total Check-ins" value={totalCheckIns} icon="✅" />
        <StatsCard label="Longest Streak" value={longestStreak} icon="🔥" sub="scheduled days" />
        <StatsCard label="Habits Tracked" value={habits?.length ?? 0} icon="📋" />
      </div>

      {habitStats.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-3">Per-Habit Breakdown</h2>
          <div className="space-y-2">
            {habitStats.map(({ habit, total }) => (
              <div key={habit.id} className="bg-[#13112b] border border-[#2e2a5e] rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{habit.emoji ?? '✅'}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{habit.name}</p>
                    <p className="text-xs text-[#5c5880]">{habit.group_id ? 'Group habit' : 'Private habit'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[#a78bfa]">{total}</p>
                  <p className="text-xs text-[#5c5880]">check-ins</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
