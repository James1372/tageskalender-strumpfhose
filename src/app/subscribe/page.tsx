export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { PlanCard } from '@/components/subscription/PlanCard'
import { TopNav } from '@/components/nav/TopNav'

export default async function SubscribePage() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('active', true)
    .order('duration_months')

  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-serif text-4xl text-center mb-2">Abo wählen</h1>
        <p className="text-center text-muted-foreground mb-12">
          Wähle dein Abo und erhalte sofortigen Zugang zu allen Beiträgen.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans?.map(plan => <PlanCard key={plan.id} plan={plan} />)}
        </div>
      </main>
    </>
  )
}
