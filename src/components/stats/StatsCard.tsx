// [CYCL:d998318f-b910-43d1-818c-6d6f42ee8710] Stat display card for personal stats page
interface StatsCardProps {
  label: string
  value: number | string
  icon: string
  sub?: string
}

export default function StatsCard({ label, value, icon, sub }: StatsCardProps) {
  return (
    <div className="bg-[#13112b] border border-[#2e2a5e] rounded-xl p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-black text-[#a78bfa]">{value}</div>
      <div className="text-sm font-medium text-white mt-1">{label}</div>
      {sub && <div className="text-xs text-[#5c5880] mt-0.5">{sub}</div>}
    </div>
  )
}
