// [CYCL:c7207409-30f0-41ec-bab5-24b0689f7beb] Shared streak calculation utility — walks habit_logs backwards from today
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Calculates current streak for a habit/user combo.
 * Walks backwards day-by-day from today; if a scheduled day has no log, streak ends.
 * Non-scheduled days are skipped without breaking the streak.
 */
export async function calculateStreak(
  habitId: string,
  userId: string,
  schedule: number[],
  supabase: SupabaseClient
): Promise<number> {
  if (!schedule || schedule.length === 0) return 0

  // Fetch last 200 log entries (enough for streak calculation)
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('completed_date')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .order('completed_date', { ascending: false })
    .limit(200)

  if (!logs || logs.length === 0) return 0

  const logSet = new Set(logs.map(l => l.completed_date))
  const scheduleSet = new Set(schedule)

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cursor = new Date(today)

  for (let i = 0; i < 400; i++) {
    const dayOfWeek = cursor.getDay() // 0=Sun...6=Sat
    const dateStr = cursor.toISOString().slice(0, 10)

    if (scheduleSet.has(dayOfWeek)) {
      if (logSet.has(dateStr)) {
        streak++
      } else {
        // Allow today to not be checked yet — only break on past missed days
        if (dateStr !== today.toISOString().slice(0, 10)) {
          break
        }
      }
    }

    cursor.setDate(cursor.getDate() - 1)
    if (cursor < new Date(today.getTime() - 400 * 24 * 60 * 60 * 1000)) break
  }

  return streak
}

/**
 * Formats a date as YYYY-MM-DD in a given IANA timezone.
 */
export function getTodayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}
