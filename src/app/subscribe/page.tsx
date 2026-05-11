export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { PlanCard } from '@/components/subscription/PlanCard'
import { TopNav } from '@/components/nav/TopNav'
import { MailCheck } from 'lucide-react'

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const [{ data: { user } }, { data: plans }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('subscription_plans').select('*').eq('active', true).order('duration_months'),
  ])

  const emailUnconfirmed = params.confirm === '1'

  let displayName: string | undefined
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('username').eq('id', user.id).single()
    displayName = profile?.username || user.email?.split('@')[0]
  }

  return (
    <>
      <TopNav isLoggedIn={!!user} displayName={displayName} />
      <main className="max-w-3xl mx-auto px-4 py-16">

        {emailUnconfirmed && (
          <div className="flex items-start gap-3 bg-amber-950/60 border border-amber-700
            text-amber-300 rounded-lg px-5 py-4 mb-10">
            <MailCheck className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Bitte bestätige deine E-Mail-Adresse</p>
              <p className="text-sm opacity-80 mt-0.5">
                Wir haben eine Bestätigungs-Mail an <strong>{user.email}</strong> gesendet.
                Bitte klicke auf den Link in der Mail bevor du ein Abo abschließt.
              </p>
            </div>
          </div>
        )}

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
