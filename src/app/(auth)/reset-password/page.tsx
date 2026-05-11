'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/feed')
  }

  return (
    <Card>
      <CardHeader><CardTitle>Neues Passwort</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Neues Passwort</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
              minLength={8} required />
          </div>
          <div><Label>Passwort bestätigen</Label>
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              minLength={8} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full bg-gold text-black hover:bg-gold/90" disabled={loading}>
            {loading ? 'Einen Moment...' : 'Passwort speichern'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
