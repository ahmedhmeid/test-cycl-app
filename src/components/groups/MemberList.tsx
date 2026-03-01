'use client'
// [CYCL:318067db-8780-4290-aff7-89d509f8edc9] Member list with avatar, name, and admin remove button
import Image from 'next/image'
import { useState } from 'react'

interface Member {
  id: string
  user_id: string
  role: string
  profiles: { display_name: string | null; avatar_url: string | null } | null
}

interface MemberListProps {
  members: Member[]
  groupId: string
  isAdmin: boolean
  currentUserId: string
}

export default function MemberList({ members, groupId, isAdmin, currentUserId }: MemberListProps) {
  const [list, setList] = useState(members)

  async function handleRemove(memberId: string) {
    if (!confirm('Remove this member?')) return
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    if (res.ok) {
      setList(prev => prev.filter(m => m.id !== memberId))
    }
  }

  return (
    <ul className="space-y-2">
      {list.map(member => {
        const profile = member.profiles
        const name = profile?.display_name ?? 'Unknown'
        const initial = name[0]?.toUpperCase() ?? '?'
        const isYou = member.user_id === currentUserId

        return (
          <li key={member.id} className="flex items-center gap-3 bg-[#0f0e1a] rounded-lg px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-[#4c3d9e] flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt={name} width={36} height={36} className="object-cover w-full h-full" />
              ) : (
                <span className="text-sm font-bold text-white">{initial}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-white">{name}</span>
              {isYou && <span className="ml-1 text-xs text-[#5c5880]">(you)</span>}
              {member.role === 'admin' && (
                <span className="ml-2 text-xs text-[#a78bfa] border border-[#a78bfa] px-1.5 py-0.5 rounded">admin</span>
              )}
            </div>
            {isAdmin && !isYou && (
              <button
                onClick={() => handleRemove(member.id)}
                className="text-xs text-red-400 hover:text-red-300 transition"
              >
                Remove
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
