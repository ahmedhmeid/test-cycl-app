'use client'
// [CYCL:60fb2df9-3c36-4d06-a33b-402e58d8e1ad] Profile setup page — display name, avatar, timezone
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { TIMEZONES } from '@/lib/timezones'

export default function ProfileSetupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        setDisplayName(user.email?.split('@')[0] ?? '')
      }
    })
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (TIMEZONES.includes(tz)) setTimezone(tz)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar must be under 2 MB')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    let avatarUrl: string | null = null

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })
      if (uploadError) {
        setError('Avatar upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      avatarUrl = publicUrl
    }

    const updates: Record<string, string> = { display_name: displayName, timezone }
    if (avatarUrl) updates.avatar_url = avatarUrl

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0f0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">HabitPack</h1>
          <p className="text-sm text-[#5c5880] mt-1">Set up your profile</p>
        </div>
        <div className="bg-[#13112b] border border-[#2e2a5e] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Your profile</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center mb-4">
              <div className="w-20 h-20 rounded-full bg-[#4c3d9e] flex items-center justify-center overflow-hidden border-2 border-[#7c6df0] mb-2">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar preview" width={80} height={80} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-2xl text-white font-bold">{displayName[0]?.toUpperCase() ?? '?'}</span>
                )}
              </div>
              <label className="cursor-pointer text-sm text-[#a78bfa] hover:underline">
                Upload avatar
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a09cc0] mb-1">Display name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-[#0f0e1a] border border-[#2e2a5e] rounded-lg px-4 py-2.5 text-white placeholder-[#4a4570] focus:outline-none focus:border-[#7c6df0] transition"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a09cc0] mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full bg-[#0f0e1a] border border-[#2e2a5e] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#7c6df0] transition"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7c6df0] hover:bg-[#6a5dd8] disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition"
            >
              {loading ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
