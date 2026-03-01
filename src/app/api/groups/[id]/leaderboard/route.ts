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

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, role, profiles:user_id(display_name, avatar_url, timezone)')
    .eq('group_id', groupId)

  if (!members) return NextResponse.json([])

  const results = await Promise.all(
    members.map(async m => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      const timezone = (profile as { timezone?: string } | null)?.timezone ?? 'UTC'

      const [streak, weeklyScore] = await Promise.all([
        computePerfectDayStreak(m.user_id, groupId, timezone, supabase),
        computeWeeklyPerfectScore(m.user_id, groupId, supabase),
      ])

      // Fetch badges
      const { data: badges } = await supabase
        .from('badges')
        .select('type, habit_id')
        .eq('user_id', m.user_id)
        .eq('group_id', groupId)

      // Fetch kudos counts
      const { data: kudos } = await supabase
        .from('kudos')
        .select('emoji, id')
        .eq('to_user_id', m.user_id)
        .eq('group_id', groupId)
        .is('habit_id', null)

      const kudosCount: Record<string, number> = {}
      for (const k of kudos ?? []) {
        kudosCount[k.emoji] = (kudosCount[k.emoji] ?? 0) + 1
      }

      return {
        user_id: m.user_id,
        display_name: (profile as { display_name?: string | null } | null)?.display_name ?? 'Unknown',
        avatar_url: (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null,
        role: m.role,
        streak,
        weekly_score: weeklyScore,
        badges: badges ?? [],
        kudos_counts: kudosCount,
        is_current_user: m.user_id === user.id,
      }
    })
  )

  results.sort((a, b) => b.streak - a.streak || b.weekly_score - a.weekly_score)
  return NextResponse.json(results)
}
