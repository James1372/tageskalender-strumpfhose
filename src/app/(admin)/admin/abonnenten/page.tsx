import { createAdminClient } from '@/lib/supabase/admin'
import { SubscriptionsTableClient } from '@/components/admin/SubscriptionsTableClient'

export default async function AbonnentenPage() {
  const admin = createAdminClient()

  const { data: subscriptions } = await admin
    .from('subscriptions')
    .select(`
      id, status, created_at, current_period_end,
      profiles!subscriptions_user_id_fkey(email),
      subscription_plans(label, duration_months, price_eur)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Abonnenten</h1>
      <SubscriptionsTableClient subscriptions={subscriptions ?? []} />
    </div>
  )
}
