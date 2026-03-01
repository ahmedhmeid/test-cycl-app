// [CYCL:60fb2df9-3c36-4d06-a33b-402e58d8e1ad] Dashboard page — shows groups, habits, and AI coach card
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GroupCard from '@/components/groups/GroupCard'
import AiCoachCard from '@/components/AiCoachCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: memberRows }, { data: profile }] = await Promise.all([
    supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single(),
  ])

  const groupIds = memberRows?.map(r => r.group_id) ?? []

  const { data: groups } = groupIds.length > 0
    ? await supabase
        .from('groups')
        .select('id, name, description')
        .in('id', groupIds)
    : { data: [] }

  // Fetch member counts per group
  const memberCounts: Record<string, number> = {}
  if (groups && groups.length > 0) {
    const { data: counts } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', groups.map(g => g.id))
    counts?.forEach(row => {
      memberCounts[row.group_id] = (memberCounts[row.group_id] ?? 0) + 1
    })
  }

  const name = profile?.display_name?.split('@')[0] ?? 'there'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Hey, {name} 👋</h1>
        <p className="text-sm text-[#5c5880] mt-1">Here&apos;s your habit summary for today.</p>
      </div>

      <AiCoachCard />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Your Groups</h2>
          <Link href="/groups/new" className="text-sm bg-[#7c6df0] hover:bg-[#6a5dd8] text-white px-3 py-1.5 rounded-lg transition font-medium">
            + New Group
          </Link>
        </div>
        {groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map(group => (
              <GroupCard
                key={group.id}
                id={group.id}
                name={group.name}
                description={group.description}
                memberCount={memberCounts[group.id] ?? 0}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#13112b] border border-[#2e2a5e] rounded-xl p-6 text-center">
            <p className="text-[#5c5880] mb-3">You&apos;re not in any groups yet.</p>
            <Link href="/groups/new" className="text-[#a78bfa] hover:underline text-sm">Create your first group</Link>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Private Habits</h2>
          <Link href="/habits" className="text-sm text-[#a78bfa] hover:underline">View all</Link>
        </div>
        <div className="bg-[#13112b] border border-[#2e2a5e] rounded-xl p-6 text-center">
          <p className="text-[#5c5880] mb-3">Track habits just for yourself.</p>
          <Link href="/habits" className="text-[#a78bfa] hover:underline text-sm">Manage private habits</Link>
        </div>
      </section>
    </div>
  )
}
