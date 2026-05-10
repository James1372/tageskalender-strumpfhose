'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isToday
} from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function CalendarWidget({ postedDates }: { postedDates: string[] }) {
  const [current, setCurrent] = useState(new Date())
  const router = useRouter()

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  // Pad to start on Monday (0=Sun, 1=Mon ... 6=Sat → shift so Mon=0)
  const startPad = (getDay(monthStart) + 6) % 7
  const paddedDays: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...days,
  ]

  function handleDayClick(day: Date) {
    const dateStr = format(day, 'yyyy-MM-dd')
    if (!postedDates.includes(dateStr)) return
    const now = new Date()
    if (format(day, 'yyyy-MM') === format(now, 'yyyy-MM')) {
      // Scroll to post in current feed
      document.getElementById(`post-${dateStr}`)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push(`/archiv/${format(day, 'yyyy')}/${format(day, 'MM')}#${dateStr}`)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1))}
          className="p-1 hover:text-gold transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {format(current, 'MMMM yyyy', { locale: de })}
        </span>
        <button
          onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1))}
          className="p-1 hover:text-gold transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => (
          <div key={d} className="text-xs text-muted-foreground pb-1">{d}</div>
        ))}
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />
          const dateStr = format(day, 'yyyy-MM-dd')
          const hasPost = postedDates.includes(dateStr)
          const today = isToday(day)
          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(day)}
              disabled={!hasPost}
              className={`text-xs rounded p-1 transition-colors
                ${today ? 'border border-gold text-gold' : ''}
                ${hasPost && !today ? 'hover:bg-gold/20 cursor-pointer font-medium text-foreground' : ''}
                ${!hasPost ? 'text-muted-foreground/40 cursor-default' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
