import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export function ArchiveList({ months }: { months: { year: string; month: string }[] }) {
  if (months.length === 0) return null
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-3">
        Archiv
      </h3>
      <ul className="space-y-1">
        {months.map(({ year, month }) => {
          const date = new Date(parseInt(year), parseInt(month) - 1)
          return (
            <li key={`${year}-${month}`}>
              <Link
                href={`/archiv/${year}/${month}`}
                className="text-sm text-muted-foreground hover:text-gold transition-colors block py-0.5"
              >
                {format(date, 'MMMM yyyy', { locale: de })}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
