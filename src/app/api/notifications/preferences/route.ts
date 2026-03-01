// [CYCL:cb95563a-41fa-49af-9e7a-14fefce07e1a] GET and PATCH notification preferences per user per group
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')
  if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })

  const { data } = await supabase
    .from('notification_preferences')
    .select('rank_overtake, milestone_celebrations')
    .eq('user_id', user.id)
    .eq('group_id', groupId)
    .single()

  return NextResponse.json(data ?? { rank_overtake: true, milestone_celebrations: true })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { group_id, rank_overtake, milestone_celebrations } = await request.json()
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id, group_id, rank_overtake, milestone_celebrations }, { onConflict: 'user_id,group_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
