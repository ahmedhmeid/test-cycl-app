// [CYCL:cb95563a-41fa-49af-9e7a-14fefce07e1a] Leaderboard computation utilities — perfect day streak, weekly score, badge awards, rank overtake
import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateStreak, getTodayInTimezone } from '@/lib/streak'

/**
 * Computes a user's perfect-day streak for a given group.
 * A perfect day = all scheduled group habits logged on that day.
 */
export async function computePerfectDayStreak(
  userId: string,
  groupId: string,
  timezone: string,
  supabase: SupabaseClient
): Promise<number> {
  const { data: habits } = await supabase
    .from('habits')
    .select('id, schedule')
    .eq('group_id', groupId)
    .eq('archived', false)

  if (!habits || habits.length === 0) return 0

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('habit_id, completed_date')
    .eq('user_id', userId)
    .in('habit_id', habits.map(h => h.id))
    .order('completed_date', { ascending: false })

  if (!logs) return 0

  // Build map: date -> set of habit_ids logged
  const dateHabitMap = new Map<string, Set<string>>()
  for (const log of logs) {
    if (!dateHabitMap.has(log.completed_date)) {
      dateHabitMap.set(log.completed_date, new Set())
    }
    dateHabitMap.get(log.completed_date)!.add(log.habit_id)
  }

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cursor = new Date(today)

  for (let i = 0; i < 400; i++) {
    const dayOfWeek = cursor.getDay()
    const dateStr = cursor.toISOString().slice(0, 10)

    // Find habits scheduled for this day
    const scheduledHabits = habits.filter(h => (h.schedule as number[]).includes(dayOfWeek))

    if (scheduledHabits.length > 0) {
      const loggedSet = dateHabitMap.get(dateStr)
      const allLogged = scheduledHabits.every(h => loggedSet?.has(h.id))

      if (allLogged) {
        streak++
      } else {
        // Allow today to not be complete yet
        if (dateStr !== today.toISOString().slice(0, 10)) break
      }
    }

    cursor.setDate(cursor.getDate() - 1)
    if (i > 365) break
  }

  return streak
}

/**
 * Counts calendar weeks where user had a perfect day on every scheduled day.
 */
export async function computeWeeklyPerfectScore(
  userId: string,
  groupId: string,
  supabase: SupabaseClient
): Promise<number> {
  const { data: habits } = await supabase
    .from('habits')
    .select('id, schedule')
    .eq('group_id', groupId)
    .eq('archived', false)

  if (!habits || habits.length === 0) return 0

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('habit_id, completed_date')
    .eq('user_id', userId)
    .in('habit_id', habits.map(h => h.id))

  if (!logs || logs.length === 0) return 0

  // Group logs by ISO week
  const weekMap = new Map<string, Map<string, Set<string>>>()
  for (const log of logs) {
    const date = new Date(log.completed_date)
    const year = date.getFullYear()
    const week = getISOWeek(date)
    const weekKey = `${year}-W${week}`
    if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Map())
    const dayKey = log.completed_date
    if (!weekMap.get(weekKey)!.has(dayKey)) weekMap.get(weekKey)!.set(dayKey, new Set())
    weekMap.get(weekKey)!.get(dayKey)!.add(log.habit_id)
  }

  let perfectWeeks = 0
  for (const [, dayMap] of weekMap) {
    let weekPerfect = true
    for (const [dateStr, loggedSet] of dayMap) {
      const date = new Date(dateStr)
      const dayOfWeek = date.getDay()
      const scheduledHabits = habits.filter(h => (h.schedule as number[]).includes(dayOfWeek))
      if (scheduledHabits.length > 0 && !scheduledHabits.every(h => loggedSet.has(h.id))) {
        weekPerfect = false
        break
      }
    }
    if (weekPerfect) perfectWeeks++
  }

  return perfectWeeks
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * Awards badges for streak milestones (7/30/60/100 days).
 * Called after a successful check-in.
 */
export async function checkAndAwardBadges(
  userId: string,
  habitId: string,
  groupId: string | null,
  schedule: number[],
  supabase: SupabaseClient
): Promise<void> {
  if (!groupId) return // No badges for private habits

  const habitStreak = await calculateStreak(habitId, userId, schedule, supabase)
  const thresholds = [7, 30, 60, 100] as const
  const typeMap: Record<number, string> = { 7: 'streak_7', 30: 'streak_30', 60: 'streak_60', 100: 'streak_100' }

  for (const threshold of thresholds) {
    if (habitStreak >= threshold) {
      await supabase
        .from('badges')
        .upsert(
          { user_id: userId, group_id: groupId, habit_id: habitId, type: typeMap[threshold] },
          { onConflict: 'user_id,group_id,habit_id,type', ignoreDuplicates: true }
        )
    }
  }

  // Also check perfect-day streak
  const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', userId).single()
  const timezone = profile?.timezone ?? 'UTC'
  const perfectStreak = await computePerfectDayStreak(userId, groupId, timezone, supabase)

  for (const threshold of thresholds) {
    if (perfectStreak >= threshold) {
      await supabase
        .from('badges')
        .upsert(
          { user_id: userId, group_id: groupId, habit_id: null, type: typeMap[threshold] },
          { onConflict: 'user_id,group_id,habit_id,type', ignoreDuplicates: true }
        )
    }
  }
}

/**
 * Detects if user moved up in the leaderboard after a check-in and notifies displaced users.
 */
export async function detectRankOvertake(
  userId: string,
  groupId: string,
  supabase: SupabaseClient
): Promise<void> {
  // Simple approach: get top 2 members by perfect-day streak
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  if (!members || members.length < 2) return

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, timezone')
    .in('id', members.map(m => m.user_id))

  if (!profiles) return

  // Compute streaks for all members
  const streaks = await Promise.all(
    profiles.map(async p => ({
      userId: p.id,
      streak: await computePerfectDayStreak(p.id, groupId, p.timezone ?? 'UTC', supabase),
    }))
  )
  streaks.sort((a, b) => b.streak - a.streak)

  const userRankIdx = streaks.findIndex(s => s.userId === userId)
  if (userRankIdx <= 0) return // Already #1 or not found

  // Notify the displaced user (the one just above current user's new rank)
  const displacedUserId = streaks[userRankIdx - 1].userId

  const { data: pref } = await supabase
    .from('notification_preferences')
    .select('rank_overtake')
    .eq('user_id', displacedUserId)
    .eq('group_id', groupId)
    .single()

  if (pref?.rank_overtake !== false) {
    await supabase.from('notifications').insert({
      user_id: displacedUserId,
      type: 'rank_overtake',
      payload: { by_user_id: userId, group_id: groupId },
    })
  }
}
