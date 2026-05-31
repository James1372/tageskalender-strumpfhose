import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default async function AdminDashboard() {
  const admin = createAdminClient()

  const [
    { count: available },
    { count: activeSubscriptions },
    { count: totalUsers },
  ] = await Promise.all([
    admin.from('images').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
  ])

  const lowPool = (available ?? 0) < 14

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Dashboard</h1>
      {lowPool && (
        <div className="flex items-center gap-2 bg-yellow-950 border border-yellow-700
          text-yellow-300 rounded-lg px-4 py-3 mb-6">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm">
            Nur noch <strong>{available}</strong> Bilder verfügbar. Bitte Bilder hochladen.
          </p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/admin/bilder">
          <Card className="hover:border-gold/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground font-normal">Bilder verfügbar</CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`text-4xl font-bold ${lowPool ? 'text-yellow-400' : 'text-gold'}`}>
                {available ?? 0}
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/abonnenten">
          <Card className="hover:border-gold/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground font-normal">Aktive Abos</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-4xl font-bold text-gold">{activeSubscriptions ?? 0}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/user">
          <Card className="hover:border-gold/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground font-normal">Registrierte User</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-4xl font-bold text-gold">{totalUsers ?? 0}</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
