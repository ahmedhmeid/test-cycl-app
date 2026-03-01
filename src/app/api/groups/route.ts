// [CYCL:318067db-8780-4290-aff7-89d509f8edc9] GET all user groups; POST creates a new group + inserts creator as admin
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  if (!memberRows?.length) return NextResponse.json([])

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, description, created_at')
    .in('id', memberRows.map(r => r.group_id))

  return NextResponse.json(groups ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  // Insert group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name: name.trim(), description: description?.trim() ?? null, created_by: user.id })
    .select()
    .single()

  if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 })

  // Insert creator as admin
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' })

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  return NextResponse.json(group, { status: 201 })
}
