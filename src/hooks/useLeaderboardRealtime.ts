'use client'
// [CYCL:d998318f-b910-43d1-818c-6d6f42ee8710] Custom hook to subscribe to leaderboard real-time updates
import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useLeaderboardRealtime(groupId: string, onUpdate: () => void) {
  const refresh = useCallback(() => onUpdate(), [onUpdate])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`leaderboard-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'habit_logs' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kudos' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'badges' }, refresh)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, refresh])
}
