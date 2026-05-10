'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Subscription = { status: string; current_period_end: string | null }
type Credit = { type: string; value: number; used: boolean; expires_at: string | null }
type User = {
  id: string
  email: string
  created_at: string
  subscriptions: Subscription[]
  credits: Credit[]
}

function getUserStatus(user: User): { label: string; className: string } {
  const activeSub = user.subscriptions.find(s =>
    s.status === 'active' &&
    s.current_period_end !== null &&
    new Date(s.current_period_end) > new Date()
  )
  if (activeSub) return { label: 'Aktives Abo', className: 'text-green-400 bg-green-950 border-green-800' }

  const activeCredit = user.credits.find(c =>
    !c.used && (!c.expires_at || new Date(c.expires_at) > new Date())
  )
  if (activeCredit) return {
    label: `Guthaben: ${activeCredit.type === 'time'
      ? `${activeCredit.value} Tage`
      : `${activeCredit.value.toFixed(2).replace('.', ',')} €`}`,
    className: 'text-blue-300 bg-blue-950 border-blue-800',
  }

  return { label: 'Kein Zugang', className: 'text-muted-foreground bg-muted border-border' }
}

export function UserTableClient({ users }: { users: User[] }) {
  const [search, setSearch] = useState('')
  const [grantingFor, setGrantingFor] = useState<string | null>(null)
  const [creditType, setCreditType] = useState<'time' | 'eur'>('time')
  const [creditValue, setCreditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function grantCredit(userId: string) {
    if (!creditValue || isNaN(parseFloat(creditValue))) return
    setSaving(true)
    const res = await fetch('/api/admin/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: creditType,
        value: parseFloat(creditValue),
      }),
    })
    setSaving(false)
    if (res.ok) {
      setGrantingFor(null)
      setCreditValue('')
      window.location.reload()
    } else {
      const { error } = await res.json()
      alert(error)
    }
  }

  return (
    <>
      <Input
        placeholder="User nach E-Mail suchen..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm mb-6"
      />
      {filtered.length === 0 && (
        <p className="text-muted-foreground text-sm">Keine User gefunden.</p>
      )}
      <div className="space-y-2">
        {filtered.map(user => {
          const status = getUserStatus(user)
          return (
            <div key={user.id} className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <span className={`text-xs px-2 py-0.5 rounded border ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGrantingFor(grantingFor === user.id ? null : user.id)}
                >
                  Guthaben +
                </Button>
              </div>

              {grantingFor === user.id && (
                <div className="mt-3 flex items-center gap-2 flex-wrap border-t border-border pt-3">
                  <select
                    value={creditType}
                    onChange={e => setCreditType(e.target.value as 'time' | 'eur')}
                    className="bg-background border border-border rounded px-2 py-1.5 text-sm"
                  >
                    <option value="time">Tage</option>
                    <option value="eur">Euro</option>
                  </select>
                  <Input
                    type="number"
                    min="1"
                    step={creditType === 'eur' ? '0.01' : '1'}
                    placeholder={creditType === 'time' ? 'z.B. 30' : 'z.B. 9.99'}
                    value={creditValue}
                    onChange={e => setCreditValue(e.target.value)}
                    className="w-32"
                  />
                  <Button
                    size="sm"
                    className="bg-gold text-black hover:bg-gold/90"
                    onClick={() => grantCredit(user.id)}
                    disabled={saving || !creditValue}
                  >
                    {saving ? 'Speichert...' : 'Bestätigen'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setGrantingFor(null); setCreditValue('') }}
                  >
                    Abbrechen
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
