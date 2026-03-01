'use client'
// [CYCL:60fb2df9-3c36-4d06-a33b-402e58d8e1ad] Login page with email/password form
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <h2 className="text-xl font-bold text-white mb-6">Welcome back</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#a09cc0] mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#0f0e1a] border border-[#2e2a5e] rounded-lg px-4 py-2.5 text-white placeholder-[#4a4570] focus:outline-none focus:border-[#7c6df0] transition"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#a09cc0] mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#0f0e1a] border border-[#2e2a5e] rounded-lg px-4 py-2.5 text-white placeholder-[#4a4570] focus:outline-none focus:border-[#7c6df0] transition"
            placeholder="Your password"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#7c6df0] hover:bg-[#6a5dd8] disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-center text-sm text-[#5c5880] mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[#a78bfa] hover:underline">Sign up</Link>
      </p>
    </>
  )
}
