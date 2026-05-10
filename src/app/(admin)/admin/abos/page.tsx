import { createAdminClient } from '@/lib/supabase/admin'
import { PlanEditorClient } from '@/components/admin/PlanEditorClient'

export default async function AbosPage() {
  const admin = createAdminClient()
  const { data: plans } = await admin
    .from('subscription_plans')
    .select('*')
    .order('duration_months')

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Abo-Preise</h1>
      <PlanEditorClient plans={plans ?? []} />
    </div>
  )
}
