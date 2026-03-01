// [CYCL:744d9176-3187-4de0-adc5-53d9436dffa2] Private habits page — fetches user's private habits with streaks
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HabitList from '@/components/habits/HabitList'
import { calculateStreak, getTodayInTimezone } from '@/lib/streak'

export default async function PrivateHabitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: habitRows }, { data: profile }] = await Promise.all([
    supabase.from('habits').select('*').eq('created_by', user.id).is('group_id', null).eq('archived', false).order('created_at'),
    supabase.from('profiles').select('timezone').eq('id', user.id).single(),
  ])

  const timezone = profile?.timezone ?? 'UTC'
  const today = getTodayInTimezone(timezone)
  const habitIds = habitRows?.map(h => h.id) ?? []

  const [{ data: todayLogs }, { data: allLogs }] = await Promise.all([
    habitIds.length > 0
      ? supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).eq('completed_date', today).in('habit_id', habitIds)
      : Promise.resolve({ data: [] }),
    habitIds.length > 0
      ? supabase.from('habit_logs').select('habit_id, completed_date').eq('user_id', user.id).in('habit_id', habitIds)
      : Promise.resolve({ data: [] }),
  ])

  const checkedInSet = new Set(todayLogs?.map(l => l.habit_id) ?? [])

  const habits = await Promise.all((habitRows ?? []).map(async h => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji ?? '✅',
    description: h.description,
    schedule: h.schedule as number[],
    streak: await calculateStreak(h.id, user.id, h.schedule as number[], supabase),
    isGroupHabit: false,
    alreadyCheckedIn: checkedInSet.has(h.id),
    logs: (allLogs ?? []).filter(l => l.habit_id === h.id),
  })))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-white">Private Habits</h1>
      <HabitList habits={habits} isAdmin={true} showNewHabitForm />
    </div>
  )
}
