// [CYCL:cb95563a-41fa-49af-9e7a-14fefce07e1a] GET user stats — per-habit streaks, longest ever streak, total check-ins, perfect-day streak
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateStreak } from '@/lib/streak'
import { computePerfectDayStreak } from '@/lib/leaderboard'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: habits }, { data: profile }] = await Promise.all([
    supabase.from('habits').select('id, name, emoji, schedule, group_id').eq('created_by', userId),
    supabase.from('profiles').select('timezone').eq('id', userId).single(),
  ])

  const timezone = profile?.timezone ?? 'UTC'

  const habitStats = await Promise.all((habits ?? []).map(async h => {
    const [currentStreak, { data: allLogs }] = await Promise.all([
      calculateStreak(h.id, userId, h.schedule as number[], supabase),
      supabase.from('habit_logs').select('completed_date').eq('habit_id', h.id).eq('user_id', userId).order('completed_date'),
    ])

    // Compute longest streak: walk backwards from each log date checking consecutive scheduled days
    const logSet = new Set((allLogs ?? []).map(l => l.completed_date))
    const scheduleSet = new Set(h.schedule as number[])
    const sortedDates = [...logSet].sort()
    let longestStreak = 0

    for (const startDate of sortedDates) {
      // Walk forward from this date counting consecutive scheduled-day logs
      let tempStreak = 0
      const cursor = new Date(startDate + 'T00:00:00Z')
      for (let j = 0; j < 400; j++) {
        const dow = cursor.getUTCDay()
        const ds = cursor.toISOString().slice(0, 10)
        if (scheduleSet.has(dow)) {
          if (logSet.has(ds)) {
            tempStreak++
          } else {
            break
          }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1)
        if (tempStreak > longestStreak) longestStreak = tempStreak
      }
    }

    return {
      habit_id: h.id,
      habit_name: h.name,
      habit_emoji: h.emoji,
      is_group_habit: !!h.group_id,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_checkins: allLogs?.length ?? 0,
    }
  }))

  const totalCheckIns = habitStats.reduce((sum, h) => sum + h.total_checkins, 0)
  const longestEverStreak = Math.max(0, ...habitStats.map(h => h.longest_streak))
  const currentStreak = Math.max(0, ...habitStats.map(h => h.current_streak))

  // Compute perfect-day streak across all user's groups
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  let perfectDayStreak = 0
  for (const m of memberships ?? []) {
    const s = await computePerfectDayStreak(userId, m.group_id, timezone, supabase)
    if (s > perfectDayStreak) perfectDayStreak = s
  }

  return NextResponse.json({
    habit_stats: habitStats,
    total_checkins: totalCheckIns,
    longest_ever_streak: longestEverStreak,
    current_streak: currentStreak,
    perfect_day_streak: perfectDayStreak,
  })
}
