'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <Card>
      <CardHeader><CardTitle>E-Mail gesendet</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Falls ein Konto mit dieser Adresse existiert, erhältst du in Kürze einen Link zum Zurücksetzen deines Passworts.
        </p>
        <Link href="/login" className="text-sm text-gold underline">Zurück zum Login</Link>
      </CardContent>
    </Card>
  )

  return (
    <Card>
      <CardHeader><CardTitle>Passwort zurücksetzen</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>E-Mail</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-gold text-black hover:bg-gold/90" disabled={loading}>
            {loading ? 'Einen Moment...' : 'Reset-Link senden'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-gold underline">Zurück zum Login</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
