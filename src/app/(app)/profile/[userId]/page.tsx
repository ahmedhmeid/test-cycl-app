// [CYCL:60fb2df9-3c36-4d06-a33b-402e58d8e1ad] Public profile view page — shows user's display name and avatar
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, timezone')
    .eq('id', userId)
    .single()

  if (!profile) notFound()

  const initial = profile.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="max-w-sm mx-auto mt-12 text-center">
      <div className="w-24 h-24 rounded-full bg-[#4c3d9e] flex items-center justify-center overflow-hidden border-2 border-[#7c6df0] mx-auto mb-4">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt="Avatar" width={96} height={96} className="object-cover w-full h-full" />
        ) : (
          <span className="text-3xl text-white font-bold">{initial}</span>
        )}
      </div>
      <h1 className="text-2xl font-bold text-white">{profile.display_name ?? 'Unknown'}</h1>
      <p className="text-sm text-[#5c5880] mt-1">{profile.timezone}</p>
    </div>
  )
}
