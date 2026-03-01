// [CYCL:cb95563a-41fa-49af-9e7a-14fefce07e1a] POST kudos — inserts a kudos row and returns updated counts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to_user_id, group_id, habit_id, emoji } = await request.json()
  if (!to_user_id || !group_id || !emoji) {
    return NextResponse.json({ error: 'to_user_id, group_id, emoji required' }, { status: 400 })
  }

  if (to_user_id === user.id) {
    return NextResponse.json({ error: 'Cannot give kudos to yourself' }, { status: 400 })
  }

  const { error } = await supabase.from('kudos').insert({
    from_user_id: user.id,
    to_user_id,
    group_id,
    habit_id: habit_id ?? null,
    emoji,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return updated counts for this target
  const { data: counts } = await supabase
    .from('kudos')
    .select('emoji, id')
    .eq('to_user_id', to_user_id)
    .eq('group_id', group_id)
    .is('habit_id', habit_id ?? null)

  const kudosCount: Record<string, number> = {}
  for (const k of counts ?? []) {
    kudosCount[k.emoji] = (kudosCount[k.emoji] ?? 0) + 1
  }

  return NextResponse.json({ kudos_counts: kudosCount }, { status: 201 })
}
