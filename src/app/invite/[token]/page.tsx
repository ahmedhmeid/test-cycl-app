'use client'
// [CYCL:318067db-8780-4290-aff7-89d509f8edc9] Invite join confirmation page — shows group name and join button
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/invite/${token}`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to join group')
      setLoading(false)
      return
    }
    router.push(`/groups/${data.groupId}`)
  }

  return (
    <div className="min-h-screen bg-[#0f0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#13112b] border border-[#2e2a5e] rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">👥</div>
        <h1 className="text-xl font-black text-white mb-2">You&apos;ve been invited!</h1>
        <p className="text-sm text-[#5c5880] mb-6">Click below to join this HabitPack group.</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full bg-[#7c6df0] hover:bg-[#6a5dd8] disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition"
        >
          {loading ? 'Joining…' : 'Join Group'}
        </button>
      </div>
    </div>
  )
}
