// [CYCL:744d9176-3187-4de0-adc5-53d9436dffa2] Group habits page — fetches habits with streaks, renders HabitList
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import HabitList from '@/components/habits/HabitList'
import { calculateStreak, getTodayInTimezone } from '@/lib/streak'
import Link from 'next/link'

export default async function GroupHabitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: membership }, { data: group }, { data: habitRows }, { data: profile }] = await Promise.all([
    supabase.from('group_members').select('role').eq('group_id', groupId).eq('user_id', user.id).single(),
    supabase.from('groups').select('name').eq('id', groupId).single(),
    supabase.from('habits').select('*').eq('group_id', groupId).eq('archived', false).order('created_at'),
    supabase.from('profiles').select('timezone').eq('id', user.id).single(),
  ])

  if (!membership) notFound()

  const isAdmin = membership.role === 'admin'
  const timezone = profile?.timezone ?? 'UTC'
  const today = getTodayInTimezone(timezone)

  // Fetch today's check-ins and all logs for heatmaps
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

  // Compute streaks in parallel
  const habits = await Promise.all((habitRows ?? []).map(async h => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji ?? '✅',
    description: h.description,
    schedule: h.schedule as number[],
    streak: await calculateStreak(h.id, user.id, h.schedule as number[], supabase),
    isGroupHabit: true,
    alreadyCheckedIn: checkedInSet.has(h.id),
    logs: (allLogs ?? []).filter(l => l.habit_id === h.id),
  })))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/groups/${groupId}`} className="text-sm text-[#5c5880] hover:text-[#a09cc0] transition">← {group?.name}</Link>
          <h1 className="text-2xl font-black text-white mt-1">Group Habits</h1>
        </div>
      </div>
      <HabitList habits={habits} isAdmin={isAdmin} groupId={groupId} showNewHabitForm />
    </div>
  )
}
