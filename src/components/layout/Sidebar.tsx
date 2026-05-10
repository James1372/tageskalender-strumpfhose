import { createClient } from '@/lib/supabase/server'
import { CalendarWidget } from '@/components/sidebar/CalendarWidget'
import { ArchiveList } from '@/components/sidebar/ArchiveList'
import { format } from 'date-fns'

export async function Sidebar() {
  const supabase = await createClient()
  const now = new Date()

  const { data: posts } = await supabase
    .from('daily_posts').select('date')

  const postedDates = (posts ?? []).map(p => p.date)
  const currentYearMonth = format(now, 'yyyy-MM')

  // Archive: unique year-month combinations before current month, sorted descending
  const archiveMonths = [
    ...new Set(
      postedDates
        .filter(d => d.slice(0, 7) < currentYearMonth)
        .map(d => d.slice(0, 7))
    )
  ]
    .sort((a, b) => b.localeCompare(a))
    .map(ym => ({ year: ym.slice(0, 4), month: ym.slice(5, 7) }))

  return (
    <>
      <CalendarWidget postedDates={postedDates} />
      <ArchiveList months={archiveMonths} />
    </>
  )
}
