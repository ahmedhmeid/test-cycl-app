// [CYCL:cb95563a-41fa-49af-9e7a-14fefce07e1a] GET perfect-day leaderboard for a group — sorted by streak with weekly score
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computePerfectDayStreak, computeWeeklyPerfectScore } from '@/lib/leaderboard'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify membership
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const [{ data: members }, { data: habits }] = await Promise.all([
    supabase.from('group_members').select('user_id, role, profiles:user_id(display_name, avatar_url, timezone)').eq('group_id', groupId),
    supabase.from('habits').select('id, name, emoji').eq('group_id', groupId).eq('archived', false),
  ])

  if (!members) return NextResponse.json([])

  const results = await Promise.all(
    members.map(async m => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      const timezone = (profile as { timezone?: string } | null)?.timezone ?? 'UTC'

      const [streak, weeklyScore] = await Promise.all([
        computePerfectDayStreak(m.user_id, groupId, timezone, supabase),
        computeWeeklyPerfectScore(m.user_id, groupId, supabase),
      ])

      // Fetch badges, kudos, and top habit in parallel
      const [{ data: badges }, { data: kudos }, { data: topHabitLogs }] = await Promise.all([
        supabase.from('badges').select('type, habit_id').eq('user_id', m.user_id).eq('group_id', groupId),
        supabase.from('kudos').select('emoji, id').eq('to_user_id', m.user_id).eq('group_id', groupId).is('habit_id', null),
        supabase.from('habit_logs').select('habit_id').eq('user_id', m.user_id).in('habit_id', habits?.map(h => h.id) ?? []),
      ])

      const kudosCount: Record<string, number> = {}
      for (const k of kudos ?? []) {
        kudosCount[k.emoji] = (kudosCount[k.emoji] ?? 0) + 1
      }

      // Top habit = habit with most check-ins for this user
      const habitLogCounts: Record<string, number> = {}
      for (const l of topHabitLogs ?? []) {
        habitLogCounts[l.habit_id] = (habitLogCounts[l.habit_id] ?? 0) + 1
      }
      const topHabitId = Object.entries(habitLogCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      const topHabit = topHabitId ? (habits?.find(h => h.id === topHabitId) ?? null) : null

      return {
        user_id: m.user_id,
        display_name: (profile as { display_name?: string | null } | null)?.display_name ?? 'Unknown',
        avatar_url: (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null,
        role: m.role,
        streak,
        weekly_score: weeklyScore,
        badges: badges ?? [],
        kudos_counts: kudosCount,
        top_habit: topHabit ? { id: topHabit.id, name: topHabit.name, emoji: topHabit.emoji } : null,
        is_current_user: m.user_id === user.id,
      }
    })
  )

  results.sort((a, b) => b.streak - a.streak || b.weekly_score - a.weekly_score)
  return NextResponse.json(results)
}
