// [CYCL:cb95563a-41fa-49af-9e7a-14fefce07e1a] GET per-habit leaderboard — members sorted by streak for specific habit
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateStreak } from '@/lib/streak'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; habitId: string }> }
) {
  const { id: groupId, habitId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify habit belongs to this group (defense-in-depth)
  const { data: habit } = await supabase
    .from('habits')
    .select('id, schedule, group_id')
    .eq('id', habitId)
    .eq('group_id', groupId)
    .single()

  if (!habit) return NextResponse.json({ error: 'Habit not found or not a group habit' }, { status: 404 })

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profiles:user_id(display_name, avatar_url)')
    .eq('group_id', groupId)

  if (!members) return NextResponse.json([])

  const results = await Promise.all(
    members.map(async m => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      const streak = await calculateStreak(habitId, m.user_id, habit.schedule as number[], supabase)
      return {
        user_id: m.user_id,
        display_name: (profile as { display_name?: string | null } | null)?.display_name ?? 'Unknown',
        avatar_url: (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null,
        streak,
        is_current_user: m.user_id === user.id,
      }
    })
  )

  results.sort((a, b) => b.streak - a.streak)
  return NextResponse.json(results)
}
