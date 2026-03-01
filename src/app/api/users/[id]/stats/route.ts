// [CYCL:cb95563a-41fa-49af-9e7a-14fefce07e1a] GET user stats — per-habit streaks, longest ever streak, total check-ins, perfect-day streak
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateStreak, getTodayInTimezone } from '@/lib/streak'

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

    // Compute longest streak
    let longestStreak = 0
    let tempStreak = 0
    const logDates = (allLogs ?? []).map(l => l.completed_date).sort()
    const scheduleSet = new Set(h.schedule as number[])

    for (let i = 0; i < logDates.length; i++) {
      const date = new Date(logDates[i])
      const dayOfWeek = date.getDay()
      if (scheduleSet.has(dayOfWeek)) {
        tempStreak++
        if (tempStreak > longestStreak) longestStreak = tempStreak
      } else {
        tempStreak = 0
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

  return NextResponse.json({
    habit_stats: habitStats,
    total_checkins: totalCheckIns,
    longest_ever_streak: longestEverStreak,
  })
}
