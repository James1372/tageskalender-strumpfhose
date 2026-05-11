'use client'
import { useState } from 'react'
import { apiUrl } from '@/lib/api'
import type { Database } from '@/types/database'

type Plan = Database['public']['Tables']['subscription_plans']['Row']

export function PlanCard({ plan }: { plan: Plan }) {
  const [loading, setLoading] = useState(false)
  const [hover, setHover] = useState(false)

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
    <div style={{
      position: 'relative',
      borderRadius: '12px',
      border: plan.is_featured ? '1px solid #c9a96e' : '1px solid #2a2a2a',
      backgroundColor: '#1a1a1a',
      padding: '24px',
      marginTop: plan.is_featured ? '12px' : '0',
    }}>

      {/* Beliebt Badge */}
      {plan.is_featured && (
        <div style={{
          position: 'absolute',
          top: '-14px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#c9a96e',
          color: '#000000',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '1px',
          padding: '3px 14px',
          borderRadius: '20px',
          whiteSpace: 'nowrap',
          fontFamily: 'sans-serif',
        }}>
          Beliebt
        </div>
      )}

      {/* Titel */}
      <p style={{
        margin: '0 0 16px',
        fontSize: '16px',
        fontWeight: '600',
        color: plan.is_featured ? '#c9a96e' : '#ffffff',
      }}>
        {plan.label}
      </p>

      {/* Preis */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
          {monthlyPrice.toFixed(2).replace('.', ',')} €
        </span>
        <span style={{ fontSize: '13px', color: '#888' }}>/Monat</span>
        {plan.discount_pct > 0 && (
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#888',
            backgroundColor: '#2a2a2a',
            padding: '2px 8px',
            borderRadius: '4px',
            marginLeft: '4px',
          }}>
            −{plan.discount_pct}%
          </span>
        )}
      </div>

      {/* Gesamtpreis */}
      {plan.duration_months > 1 && (
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#666' }}>
          Gesamt: {plan.price_eur.toFixed(2).replace('.', ',')} € für {plan.duration_months} Monate
        </p>
      )}

      {/* Button */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'opacity 0.15s',
          opacity: loading ? 0.6 : hover ? 0.85 : 1,
          backgroundColor: plan.is_featured ? '#c9a96e' : '#2a2a2a',
          color: plan.is_featured ? '#000000' : '#ffffff',
          marginTop: plan.duration_months > 1 ? '0' : '20px',
        }}
      >
        {loading ? 'Weiterleitung...' : 'Jetzt abonnieren'}
      </button>
    </div>
  )
}
