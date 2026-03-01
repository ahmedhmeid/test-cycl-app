// [CYCL:318067db-8780-4290-aff7-89d509f8edc9] Card component showing group name, description, member count
import Link from 'next/link'

interface GroupCardProps {
  id: string
  name: string
  description: string | null
  memberCount: number
}

export default function GroupCard({ id, name, description, memberCount }: GroupCardProps) {
  return (
    <Link href={`/groups/${id}`} className="block bg-[#13112b] border border-[#2e2a5e] hover:border-[#7c6df0] rounded-xl p-5 transition group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#4c3d9e] flex items-center justify-center text-xl flex-shrink-0">
          👥
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white group-hover:text-[#a78bfa] transition truncate">{name}</h3>
          {description && <p className="text-sm text-[#5c5880] mt-0.5 truncate">{description}</p>}
          <p className="text-xs text-[#4a4570] mt-2">{memberCount} {memberCount === 1 ? 'member' : 'members'}</p>
        </div>
      </div>
    </Link>
  )
}
