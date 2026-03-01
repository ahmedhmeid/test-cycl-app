// [CYCL:318067db-8780-4290-aff7-89d509f8edc9] Server-side group query helpers
import { createClient } from '@/lib/supabase/server'

export async function getGroupsByUser(userId: string) {
  const supabase = await createClient()
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  if (!memberRows?.length) return []

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, description, created_by, created_at')
    .in('id', memberRows.map(r => r.group_id))

  return groups ?? []
}

export async function getGroupMembers(groupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('group_members')
    .select('id, user_id, role, joined_at, profiles:user_id(display_name, avatar_url)')
    .eq('group_id', groupId)
  return data ?? []
}

export async function validateGroupAdmin(groupId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  return data?.role === 'admin'
}
