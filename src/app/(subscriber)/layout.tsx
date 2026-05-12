import { TopNav } from '@/components/nav/TopNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function SubscriberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  let displayName: string | undefined
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role, username').eq('id', user.id).single()
    isAdmin = profile?.role === 'admin'
    displayName = profile?.username || user.email?.split('@')[0]
  }

  return (
    <>
      <TopNav isLoggedIn isAdmin={isAdmin} displayName={displayName} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <main className="flex-1 min-w-0">{children}</main>
          <aside className="w-72 shrink-0 hidden lg:block sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <Sidebar />
          </aside>
        </div>
      </div>
    </>
  )
}
