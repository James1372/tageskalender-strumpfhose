'use client'
import { useState } from 'react'
import { apiUrl } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

type Plan = Database['public']['Tables']['subscription_plans']['Row']

export function PlanCard({ plan }: { plan: Plan }) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    const res = await fetch(apiUrl('/api/stripe/checkout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plan.id }),
    })
    const { url, error } = await res.json()
    if (error) { alert(error); setLoading(false); return }
    window.location.href = url
  }

  const monthlyPrice = plan.price_eur / plan.duration_months

  return (
    <Card className={`relative ${plan.is_featured ? 'border-gold' : ''}`}>
      {plan.is_featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap"
          style={{ background: '#c9a96e', color: '#000000' }}>
          Beliebt
        </span>
      )}
      <CardHeader>
        <CardTitle className={`text-lg ${plan.is_featured ? 'text-gold' : ''}`}>
          {plan.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-3xl font-bold">
            {monthlyPrice.toFixed(2).replace('.', ',')} €
          </span>
          <span className="text-muted-foreground text-sm"> /Monat</span>
          {plan.discount_pct > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-muted text-muted-foreground">−{plan.discount_pct}%</span>
          )}
        </div>
        {plan.duration_months > 1 && (
          <p className="text-sm text-muted-foreground">
            Gesamt: {plan.price_eur.toFixed(2).replace('.', ',')} € für {plan.duration_months} Monate
          </p>
        )}
        <Button
          onClick={handleCheckout}
          disabled={loading}
          className={`w-full ${plan.is_featured ? 'bg-gold text-black hover:bg-gold/90' : ''}`}
        >
          {loading ? 'Weiterleitung...' : 'Jetzt abonnieren'}
        </Button>
      </CardContent>
    </Card>
  )
}
