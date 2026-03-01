'use client'
// [CYCL:d998318f-b910-43d1-818c-6d6f42ee8710] Notification preferences page — per-group toggles for rank overtake and milestones
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Group {
  id: string
  name: string
}

interface Prefs {
  rank_overtake: boolean
  milestone_celebrations: boolean
}

export default function NotificationPreferencesPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [prefs, setPrefs] = useState<Record<string, Prefs>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/groups')
      if (res.ok) {
        const gs: Group[] = await res.json()
        setGroups(gs)
        const prefsMap: Record<string, Prefs> = {}
        await Promise.all(gs.map(async g => {
          const r = await fetch(`/api/notifications/preferences?groupId=${g.id}`)
          if (r.ok) prefsMap[g.id] = await r.json()
          else prefsMap[g.id] = { rank_overtake: true, milestone_celebrations: true }
        }))
        setPrefs(prefsMap)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function toggle(groupId: string, field: keyof Prefs) {
    const current = prefs[groupId]
    const updated = { ...current, [field]: !current[field] }
    setPrefs(p => ({ ...p, [groupId]: updated }))
    await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: groupId, ...updated }),
    })
  }

  if (loading) {
    return <div className="max-w-lg mx-auto animate-pulse"><div className="h-8 bg-[#13112b] rounded w-48 mb-4" /></div>
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-black text-white">Notification Preferences</h1>
      {groups.length === 0 && <p className="text-[#5c5880]">Join a group to manage notification preferences.</p>}
      {groups.map(group => {
        const p = prefs[group.id] ?? { rank_overtake: true, milestone_celebrations: true }
        return (
          <div key={group.id} className="bg-[#13112b] border border-[#2e2a5e] rounded-xl p-5">
            <h2 className="font-bold text-white mb-4">{group.name}</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-white">Rank overtake alerts</p>
                  <p className="text-xs text-[#5c5880]">Notify me when someone overtakes my position</p>
                </div>
                <button
                  onClick={() => toggle(group.id, 'rank_overtake')}
                  className={`w-11 h-6 rounded-full transition relative ${p.rank_overtake ? 'bg-[#7c6df0]' : 'bg-[#2e2a5e]'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${p.rank_overtake ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-white">Milestone celebrations</p>
                  <p className="text-xs text-[#5c5880]">Notify me when I earn a streak badge</p>
                </div>
                <button
                  onClick={() => toggle(group.id, 'milestone_celebrations')}
                  className={`w-11 h-6 rounded-full transition relative ${p.milestone_celebrations ? 'bg-[#7c6df0]' : 'bg-[#2e2a5e]'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${p.milestone_celebrations ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </label>
            </div>
          </div>
        )
      })}
    </div>
  )
}
