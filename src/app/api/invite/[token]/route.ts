// [CYCL:318067db-8780-4290-aff7-89d509f8edc9] POST validates invite token and adds user to group
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invite } = await supabase
    .from('group_invites')
    .select('id, group_id, expires_at, used')
    .eq('token', token)
    .single()

  if (!invite) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
  if (invite.used) return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 })
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })
  }

  // Insert member (unique constraint handles duplicates)
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: invite.group_id, user_id: user.id, role: 'member' })

  if (memberError) {
    if (memberError.code === '23505') {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 409 })
    }
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  // Mark invite as used
  await supabase
    .from('group_invites')
    .update({ used: true })
    .eq('id', invite.id)

  return NextResponse.json({ groupId: invite.group_id })
}
