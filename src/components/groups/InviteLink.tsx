'use client'
// [CYCL:318067db-8780-4290-aff7-89d509f8edc9] Generates an invite link via API and provides copy-to-clipboard
import { useState } from 'react'

export default function InviteLink({ groupId }: { groupId: string }) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/groups/${groupId}/invites`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to generate invite')
    } else {
      setInviteUrl(data.url)
    }
    setLoading(false)
  }

  async function copy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      {!inviteUrl ? (
        <button
          onClick={generate}
          disabled={loading}
          className="bg-[#4c3d9e] hover:bg-[#5c4dae] disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {loading ? 'Generating…' : '🔗 Generate invite link'}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteUrl}
            className="flex-1 bg-[#0f0e1a] border border-[#2e2a5e] rounded-lg px-3 py-2 text-sm text-[#a09cc0] truncate"
          />
          <button
            onClick={copy}
            className="bg-[#7c6df0] hover:bg-[#6a5dd8] text-white text-sm font-medium px-3 py-2 rounded-lg transition whitespace-nowrap"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
