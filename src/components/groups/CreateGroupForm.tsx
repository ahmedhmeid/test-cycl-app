'use client'
// [CYCL:318067db-8780-4290-aff7-89d509f8edc9] Group creation form with name + description
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateGroupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create group')
      setLoading(false)
      return
    }

    router.push(`/groups/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#a09cc0] mb-1">Group name</label>
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-[#0f0e1a] border border-[#2e2a5e] rounded-lg px-4 py-2.5 text-white placeholder-[#4a4570] focus:outline-none focus:border-[#7c6df0] transition"
          placeholder="e.g. Family Fitness"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#a09cc0] mb-1">Description <span className="text-[#4a4570]">(optional)</span></label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-[#0f0e1a] border border-[#2e2a5e] rounded-lg px-4 py-2.5 text-white placeholder-[#4a4570] focus:outline-none focus:border-[#7c6df0] transition resize-none"
          placeholder="What are you building together?"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#7c6df0] hover:bg-[#6a5dd8] disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition"
      >
        {loading ? 'Creating…' : 'Create group'}
      </button>
    </form>
  )
}
