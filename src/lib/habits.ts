// [CYCL:f40345c7-736b-484d-88bc-93deca6c6528] Server-side habit query helpers and streak calculation
import { createClient } from '@/lib/supabase/server'
import { calculateStreak } from '@/lib/streak'

export async function getGroupHabits(groupId: string, includeArchived = false) {
  const supabase = await createClient()
  let query = supabase
    .from('habits')
    .select('id, name, emoji, description, schedule, archived, created_by, group_id, created_at')
    .eq('group_id', groupId)

  if (!includeArchived) query = query.eq('archived', false)
  const { data } = await query.order('created_at')
  return data ?? []
}

export async function getPrivateHabits(userId: string, includeArchived = false) {
  const supabase = await createClient()
  let query = supabase
    .from('habits')
    .select('id, name, emoji, description, schedule, archived, created_by, group_id, created_at')
    .eq('created_by', userId)
    .is('group_id', null)

  if (!includeArchived) query = query.eq('archived', false)
  const { data } = await query.order('created_at')
  return data ?? []
}

export async function getHabitWithStreak(habitId: string, userId: string, schedule: number[]) {
  const supabase = await createClient()
  return calculateStreak(habitId, userId, schedule, supabase)
}

export async function checkGroupAdmin(groupId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  return data?.role === 'admin'
}
