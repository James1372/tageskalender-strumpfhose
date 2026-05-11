'use client'
import { useState } from 'react'
import { apiUrl } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Plan = {
  id: string
  label: string
  duration_months: number
  price_eur: number
  discount_pct: number
  is_featured: boolean
  stripe_price_id: string | null
}

export function PlanEditorClient({ plans: initial }: { plans: Plan[] }) {
  const [plans, setPlans] = useState(initial)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  function update<K extends keyof Plan>(id: string, field: K, value: Plan[K]) {
    setPlans(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  async function save(plan: Plan) {
    setSaving(plan.id)
    const res = await fetch(apiUrl('/api/admin/plans'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plan.id,
        priceEur: plan.price_eur,
        discountPct: plan.discount_pct,
        isFeatured: plan.is_featured,
      }),
    })
    setSaving(null)
    if (res.ok) {
      setSaved(plan.id)
      setTimeout(() => setSaved(null), 2000)
    } else {
      const { error } = await res.json()
      alert(`Fehler: ${error}`)
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <p className="text-sm text-muted-foreground mb-6">
        Preisänderungen werden automatisch mit Stripe synchronisiert.
        Bestehende Abos laufen zum alten Preis weiter.
      </p>
      {plans.map(plan => (
        <div key={plan.id} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">{plan.label}</h3>
              <span className="text-xs text-muted-foreground">
                {plan.duration_months} Monat{plan.duration_months > 1 ? 'e' : ''}
              </span>
            </div>
            {plan.is_featured && <Badge className="bg-gold text-black">Beliebt</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Preis/Monat (€)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={plan.price_eur}
                onChange={e => update(plan.id, 'price_eur', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Rabatt (%)
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                max="100"
                value={plan.discount_pct}
                onChange={e => update(plan.id, 'discount_pct', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={plan.is_featured}
                onChange={e => update(plan.id, 'is_featured', e.target.checked)}
                className="accent-gold"
              />
              Als &quot;Beliebt&quot; markieren
            </label>
            <Button
              size="sm"
              onClick={() => save(plan)}
              disabled={saving === plan.id}
              className="bg-gold text-black hover:bg-gold/90"
            >
              {saving === plan.id
                ? 'Speichert...'
                : saved === plan.id
                  ? '✓ Gespeichert'
                  : 'Speichern'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
