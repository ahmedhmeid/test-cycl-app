// [CYCL:f40345c7-736b-484d-88bc-93deca6c6528] GET habits filtered by group_id or private; POST creates group/private habit
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')
  const includeArchived = searchParams.get('includeArchived') === 'true'

  let query = supabase
    .from('habits')
    .select('id, name, emoji, description, schedule, archived, created_by, group_id, created_at')

  if (groupId) {
    query = query.eq('group_id', groupId)
  } else {
    query = query.eq('created_by', user.id).is('group_id', null)
  }

  if (!includeArchived) query = query.eq('archived', false)

  const { data, error } = await query.order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, emoji, description, schedule, group_id } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  if (group_id) {
    // Validate admin
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', group_id)
      .eq('user_id', user.id)
      .single()

    if (membership?.role !== 'admin') {
      return NextResponse.json({ error: 'Only group admins can create group habits' }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from('habits')
    .insert({
      name: name.trim(),
      emoji: emoji ?? '✅',
      description: description?.trim() ?? null,
      schedule: schedule ?? [0, 1, 2, 3, 4, 5, 6],
      group_id: group_id ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
