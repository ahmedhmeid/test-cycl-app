// [CYCL:c7207409-30f0-41ec-bab5-24b0689f7beb] POST handler — validates date is today in user timezone, inserts log, triggers badge check
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTodayInTimezone } from '@/lib/streak'
import { checkAndAwardBadges, detectRankOvertake } from '@/lib/leaderboard'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { habit_id, completed_date } = await request.json()
  if (!habit_id || !completed_date) {
    return NextResponse.json({ error: 'habit_id and completed_date required' }, { status: 400 })
  }

  // Validate date is today in user's timezone
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single()

  const timezone = profile?.timezone ?? 'UTC'
  const today = getTodayInTimezone(timezone)

  if (completed_date !== today) {
    return NextResponse.json({ error: `Date must be today (${today}) in your timezone` }, { status: 400 })
  }

  // Fetch habit to verify user can log it
  const { data: habit } = await supabase
    .from('habits')
    .select('id, group_id, schedule, created_by')
    .eq('id', habit_id)
    .single()

  if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 })

  // For private habits, verify ownership
  if (!habit.group_id && habit.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Insert log
  const { data: log, error } = await supabase
    .from('habit_logs')
    .insert({ habit_id, user_id: user.id, completed_date })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Post-insert: award badges and detect rank overtakes (non-blocking)
  try {
    await Promise.all([
      checkAndAwardBadges(user.id, habit_id, habit.group_id, habit.schedule as number[], supabase),
      habit.group_id ? detectRankOvertake(user.id, habit.group_id, supabase) : Promise.resolve(),
    ])
  } catch {
    // Non-critical — don't fail the check-in
  }

  return NextResponse.json(log, { status: 201 })
}
