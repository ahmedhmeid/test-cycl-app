'use client'
// [CYCL:870ccf50-4c1b-46cf-9a4c-35c3651e4819] Realtime group feed — subscribes to habit_logs inserts for the group
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface FeedEntry {
  id: string
  habit_name: string
  habit_emoji: string
  user_name: string
  user_avatar: string | null
  user_initial: string
  created_at: string
}

interface GroupFeedProps {
  groupId: string
  habitIds: string[]
  initialEntries: FeedEntry[]
}

export default function GroupFeed({ groupId, habitIds, initialEntries }: GroupFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>(initialEntries)

  useEffect(() => {
    if (habitIds.length === 0) return
    const supabase = createClient()

    const channel = supabase
      .channel(`group-feed-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'habit_logs',
          filter: `habit_id=in.(${habitIds.join(',')})`,
        },
        async (payload) => {
          const { habit_id, user_id, created_at } = payload.new as { habit_id: string; user_id: string; created_at: string }

          // Fetch habit and profile in parallel
          const supabaseInner = createClient()
          const [{ data: habit }, { data: profile }] = await Promise.all([
            supabaseInner.from('habits').select('name, emoji').eq('id', habit_id).single(),
            supabaseInner.from('profiles').select('display_name, avatar_url').eq('id', user_id).single(),
          ])

          const newEntry: FeedEntry = {
            id: `${habit_id}-${user_id}-${created_at}`,
            habit_name: habit?.name ?? 'Unknown',
            habit_emoji: habit?.emoji ?? '✅',
            user_name: profile?.display_name ?? 'Someone',
            user_avatar: profile?.avatar_url ?? null,
            user_initial: (profile?.display_name ?? 'U')[0].toUpperCase(),
            created_at,
          }
          setEntries(prev => [newEntry, ...prev].slice(0, 20))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, habitIds])

  return (
    <div className="bg-[#13112b] border border-[#2e2a5e] rounded-xl p-4">
      <h3 className="font-bold text-white mb-3 text-sm">🔴 Live feed</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-[#5c5880]">No check-ins yet today. Be the first!</p>
      ) : (
        <ul className="space-y-2">
          {entries.slice(0, 10).map(entry => (
            <li key={entry.id} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#4c3d9e] flex items-center justify-center overflow-hidden flex-shrink-0">
                {entry.user_avatar ? (
                  <Image src={entry.user_avatar} alt={entry.user_name} width={28} height={28} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-xs font-bold text-white">{entry.user_initial}</span>
                )}
              </div>
              <span className="text-sm text-[#a09cc0]">
                <span className="text-white font-medium">{entry.user_name}</span>
                {' '}checked in {entry.habit_emoji} <span className="text-[#e8e6f0]">{entry.habit_name}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
