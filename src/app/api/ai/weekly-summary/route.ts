// [CYCL:625421ab-4d0b-4318-b76a-e7e561ad3a77] POST handler — checks cache, fetches habit data, calls GPT-4o-mini, persists and returns summary
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getISOWeekAndYear(date: Date): { iso_week: number; iso_year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const iso_week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { iso_week, iso_year: d.getUTCFullYear() }
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { iso_week, iso_year } = getISOWeekAndYear(new Date())

  // Check cache
  const { data: cached } = await supabase
    .from('weekly_summaries')
    .select('summary_text, tip_text, generated_at')
    .eq('user_id', user.id)
    .eq('iso_week', iso_week)
    .eq('iso_year', iso_year)
    .single()

  if (cached) {
    // Rate limit: 1 per day
    const generatedAt = new Date(cached.generated_at ?? 0)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (generatedAt > oneDayAgo) {
      return NextResponse.json({ summary_text: cached.summary_text, tip_text: cached.tip_text })
    }
    return NextResponse.json({ summary_text: cached.summary_text, tip_text: cached.tip_text })
  }

  // Fetch habits and last 30 days of logs
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase.from('habits').select('id, name, emoji, schedule').eq('created_by', user.id).eq('archived', false),
    supabase.from('habit_logs')
      .select('habit_id, completed_date')
      .eq('user_id', user.id)
      .gte('completed_date', thirtyDaysAgo)
      .order('completed_date'),
  ])

  if (!habits || habits.length === 0) {
    const fallback = {
      summary_text: "You haven't created any habits yet! Start by creating a habit and checking in daily.",
      tip_text: "Start small — pick one habit you can do every day for the next week.",
    }
    await supabase.from('weekly_summaries').upsert(
      { user_id: user.id, iso_week, iso_year, ...fallback },
      { onConflict: 'user_id,iso_week,iso_year' }
    )
    return NextResponse.json(fallback)
  }

  // Build habit summary for prompt (no PII)
  const habitSummary = habits.map(h => {
    const habitLogs = (logs ?? []).filter(l => l.habit_id === h.id)
    const completedDates = habitLogs.map(l => l.completed_date)
    return {
      name: h.name,
      emoji: h.emoji,
      schedule_days: h.schedule,
      check_in_count_last_30d: completedDates.length,
      recent_dates: completedDates.slice(-10),
    }
  })

  // Call OpenAI
  let summary_text = "Keep up the great work on your habits this week!"
  let tip_text = "Consistency is key — even small daily actions add up to big changes."

  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
    try {
      const { openai } = await import('@/lib/openai')
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: 'You are a supportive habit coach. Return JSON with fields "summary_text" (1-2 encouraging sentences about their week) and "tip_text" (1 actionable tip). Be warm, positive, and specific. Do not mention user IDs.',
          },
          {
            role: 'user',
            content: `Here are my habits for the past 30 days: ${JSON.stringify(habitSummary)}. Give me a weekly summary and a tip.`,
          },
        ],
      })
      const parsed = JSON.parse(response.choices[0].message.content ?? '{}')
      if (parsed.summary_text) summary_text = parsed.summary_text
      if (parsed.tip_text) tip_text = parsed.tip_text
    } catch {
      // Fall through to defaults
    }
  }

  await supabase.from('weekly_summaries').upsert(
    { user_id: user.id, iso_week, iso_year, summary_text, tip_text },
    { onConflict: 'user_id,iso_week,iso_year' }
  )

  return NextResponse.json({ summary_text, tip_text }, { status: 201 })
}
