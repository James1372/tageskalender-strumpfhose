'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()
    router.push(profile?.role === 'admin' ? '/admin/bilder' : '/feed')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader><CardTitle>Einloggen</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>E-Mail</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div><Label>Passwort</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full bg-gold text-black hover:bg-gold/90" disabled={loading}>
            {loading ? 'Einen Moment...' : 'Einloggen'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-gold underline">Registrieren</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
