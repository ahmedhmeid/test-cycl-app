// [CYCL:60fb2df9-3c36-4d06-a33b-402e58d8e1ad] App layout with top navigation bar
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0e1a]">
      <nav className="border-b border-[#2e2a5e] bg-[#13112b] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-black text-white">HabitPack</Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-[#a09cc0] hover:text-white transition">Dashboard</Link>
            <Link href="/habits" className="text-sm text-[#a09cc0] hover:text-white transition">Habits</Link>
            <Link href="/stats" className="text-sm text-[#a09cc0] hover:text-white transition">Stats</Link>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
