'use client'
// [CYCL:870ccf50-4c1b-46cf-9a4c-35c3651e4819] 90-day heatmap of completed_date entries using react-activity-calendar
import { useMemo, useState } from 'react'

interface HabitHeatmapProps {
  logs: { completed_date: string }[]
}

export default function HabitHeatmap({ logs }: HabitHeatmapProps) {
  const [expanded, setExpanded] = useState(false)

  const data = useMemo(() => {
    const today = new Date()
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
    const logSet = new Set(logs.map(l => l.completed_date))

    const result: { date: string; count: number; level: number }[] = []
    const cursor = new Date(ninetyDaysAgo)
    while (cursor <= today) {
      const dateStr = cursor.toISOString().slice(0, 10)
      result.push({ date: dateStr, count: logSet.has(dateStr) ? 1 : 0, level: logSet.has(dateStr) ? 4 : 0 as 0 | 1 | 2 | 3 | 4 })
      cursor.setDate(cursor.getDate() + 1)
    }
    return result
  }, [logs])

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(p => !p)}
        className="text-xs text-[#5c5880] hover:text-[#a09cc0] transition mb-2"
      >
        {expanded ? '▲ Hide history' : '▼ Show 90-day history'}
      </button>
      {expanded && (
        <div className="overflow-x-auto">
          <HeatmapCalendar data={data} />
        </div>
      )}
    </div>
  )
}

// Lazy-loaded calendar to avoid SSR/type issues
function HeatmapCalendar({ data }: { data: { date: string; count: number; level: number }[] }) {
  const filled = data.filter(d => d.count > 0)
  const total = filled.length
  const weeks: { date: string; count: number }[][] = []
  let week: { date: string; count: number }[] = []

  data.forEach((d, i) => {
    week.push(d)
    if (week.length === 7 || i === data.length - 1) {
      weeks.push(week)
      week = []
    }
  })

  return (
    <div>
      <div className="flex gap-0.5 flex-wrap">
        {data.map(d => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count > 0 ? 'completed' : 'not completed'}`}
            className={`w-3 h-3 rounded-sm ${d.count > 0 ? 'bg-[#7c6df0]' : 'bg-[#1e1a42]'}`}
          />
        ))}
      </div>
      <p className="text-xs text-[#4a4570] mt-1">{total} completions in the last 90 days</p>
    </div>
  )
}
