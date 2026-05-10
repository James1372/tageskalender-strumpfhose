import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/feed')

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card px-6 h-14 flex items-center gap-6">
        <span className="font-serif text-gold tracking-wider text-lg">Admin</span>
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <Link href="/admin/bilder" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Bilder
        </Link>
        <Link href="/admin/user" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          User
        </Link>
        <Link href="/admin/abos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Abo-Preise
        </Link>
        <Link href="/feed" className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
          → Feed
        </Link>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
