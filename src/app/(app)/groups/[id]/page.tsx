// [CYCL:318067db-8780-4290-aff7-89d509f8edc9] Group detail page — members, invite link, habits link
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import MemberList from '@/components/groups/MemberList'
import InviteLink from '@/components/groups/InviteLink'

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: group }, { data: members }] = await Promise.all([
    supabase.from('groups').select('id, name, description, created_by').eq('id', groupId).single(),
    supabase
      .from('group_members')
      .select('id, user_id, role, joined_at, profiles:user_id(display_name, avatar_url)')
      .eq('group_id', groupId),
  ])

  if (!group) notFound()

  const currentMember = members?.find(m => m.user_id === user.id)
  if (!currentMember) notFound()

  const isAdmin = currentMember.role === 'admin'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#4c3d9e] flex items-center justify-center text-2xl border-2 border-[#7c6df0]">
          👥
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{group.name}</h1>
          {group.description && <p className="text-sm text-[#5c5880] mt-0.5">{group.description}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/groups/${groupId}/habits`}
          className="bg-[#7c6df0] hover:bg-[#6a5dd8] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          📋 Habits
        </Link>
        <Link
          href={`/groups/${groupId}/leaderboard`}
          className="bg-[#13112b] border border-[#2e2a5e] hover:border-[#7c6df0] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          🏆 Leaderboard
        </Link>
      </div>

      <section className="bg-[#13112b] border border-[#2e2a5e] rounded-xl p-5">
        <h2 className="font-bold text-white mb-4">
          Members <span className="text-[#5c5880] font-normal text-sm">({members?.length ?? 0})</span>
        </h2>
        <MemberList
          members={(members ?? []).map(m => ({
            ...m,
            profiles: Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles as { display_name: string | null; avatar_url: string | null } | null),
          }))}
          groupId={groupId}
          isAdmin={isAdmin}
          currentUserId={user.id}
        />
      </section>

      {isAdmin && (
        <section className="bg-[#13112b] border border-[#2e2a5e] rounded-xl p-5">
          <h2 className="font-bold text-white mb-3">Invite members</h2>
          <p className="text-sm text-[#5c5880] mb-3">Generate a shareable link valid for 7 days.</p>
          <InviteLink groupId={groupId} />
        </section>
      )}
    </div>
  )
}
