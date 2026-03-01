// [CYCL:f40345c7-736b-484d-88bc-93deca6c6528] PATCH updates/archives a habit (admin for group, owner for private)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: habit } = await supabase
    .from('habits')
    .select('id, group_id, created_by')
    .eq('id', id)
    .single()

  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (habit.group_id) {
    // Group habit: must be admin
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', habit.group_id)
      .eq('user_id', user.id)
      .single()
    if (membership?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else {
    // Private habit: must be owner
    if (habit.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.emoji !== undefined) updates.emoji = body.emoji
  if (body.description !== undefined) updates.description = body.description
  if (body.schedule !== undefined) updates.schedule = body.schedule
  if (body.archived !== undefined) updates.archived = body.archived

  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
