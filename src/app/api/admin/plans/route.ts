import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { admin } = auth

  const { planId, priceEur, discountPct, isFeatured } = await request.json()

  const { data: plan } = await admin
    .from('subscription_plans').select('*').eq('id', planId).single()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  let newStripePrice: string | undefined = plan.stripe_price_id ?? undefined

  // Only update Stripe if price changed (requires valid Stripe key)
  if (priceEur !== plan.price_eur && process.env.STRIPE_SECRET_KEY !== 'sk_test_...') {
    try {
      // Create new price (old price stays in Stripe but is no longer referenced)
      const newPrice = await stripe.prices.create({
        currency: 'eur',
        unit_amount: Math.round(priceEur * 100),
        recurring: { interval: 'month', interval_count: plan.duration_months },
        product_data: { name: `Bella Bianca — ${plan.label}` },
      })
      newStripePrice = newPrice.id
    } catch (err: any) {
      console.error('Stripe price update failed:', err?.message)
      return NextResponse.json({ error: 'Stripe sync failed' }, { status: 500 })
    }
  }

  const { error } = await admin.from('subscription_plans').update({
    price_eur: priceEur,
    discount_pct: discountPct,
    is_featured: isFeatured,
    ...(newStripePrice ? { stripe_price_id: newStripePrice } : {}),
  }).eq('id', planId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, stripe_price_id: newStripePrice })
}
