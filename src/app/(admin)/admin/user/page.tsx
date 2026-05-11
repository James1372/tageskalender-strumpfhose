import { createAdminClient } from '@/lib/supabase/admin'
import { UserTableClient } from '@/components/admin/UserTableClient'

export default async function UserPage() {
  const admin = createAdminClient()

  const { data: users } = await admin
    .from('profiles')
    .select(`
      id,
      email,
      role,
      created_at,
      subscriptions(status, current_period_end),
      credits!credits_user_id_fkey(type, value, used, expires_at)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">User-Verwaltung</h1>
      <UserTableClient users={users ?? []} />
    </div>
  )
}
