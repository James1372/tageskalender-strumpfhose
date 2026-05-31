'use client'
import { format } from 'date-fns'

type Subscription = {
  id: string
  status: string
  created_at: string
  current_period_end: string | null
  profiles: { email: string } | null
  subscription_plans: {
    label: string
    duration_months: number
    price_eur: number
  } | null
}

const STATUS_STYLES: Record<string, string> = {
  active: 'text-green-400',
  grace: 'text-orange-400',
  past_due: 'text-yellow-400',
  canceled: 'text-muted-foreground',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  grace: 'Toleranz',
  past_due: 'Ausstehend',
  canceled: 'Gekündigt',
}

export function SubscriptionsTableClient({ subscriptions }: { subscriptions: Subscription[] }) {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Noch keine Abonnements.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-3 pr-6 font-normal">E-Mail</th>
            <th className="pb-3 pr-6 font-normal">Plan</th>
            <th className="pb-3 pr-6 font-normal">Preis</th>
            <th className="pb-3 pr-6 font-normal">Dauer</th>
            <th className="pb-3 pr-6 font-normal">Beginn</th>
            <th className="pb-3 pr-6 font-normal">Läuft bis</th>
            <th className="pb-3 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map(sub => (
            <tr key={sub.id} className="border-b border-border/50">
              <td className="py-3 pr-6">{sub.profiles?.email ?? '—'}</td>
              <td className="py-3 pr-6">{sub.subscription_plans?.label ?? '—'}</td>
              <td className="py-3 pr-6">
                {sub.subscription_plans
                  ? `${sub.subscription_plans.price_eur.toFixed(2).replace('.', ',')} €`
                  : '—'}
              </td>
              <td className="py-3 pr-6">
                {sub.subscription_plans
                  ? `${sub.subscription_plans.duration_months} Monate`
                  : '—'}
              </td>
              <td className="py-3 pr-6">
                {format(new Date(sub.created_at), 'dd.MM.yyyy')}
              </td>
              <td className="py-3 pr-6">
                {sub.current_period_end
                  ? format(new Date(sub.current_period_end), 'dd.MM.yyyy')
                  : '—'}
              </td>
              <td className="py-3">
                <span className={STATUS_STYLES[sub.status] ?? 'text-muted-foreground'}>
                  {STATUS_LABELS[sub.status] ?? sub.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
