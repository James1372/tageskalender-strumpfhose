// scripts/seed-stripe-prices.ts
// Run once to create Stripe prices for each subscription plan.
// Usage: set -a && source .env.local && set +a && npx tsx scripts/seed-stripe-prices.ts
import Stripe from 'stripe'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

async function sbFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { ...init, headers: { ...headers, ...init?.headers } })
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${await res.text()}`)
  return res.json()
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function main() {
  const plans: any[] = await sbFetch('/subscription_plans?select=*')
  console.log(`Found ${plans.length} plans`)

  for (const plan of plans) {
    const price = await stripe.prices.create({
      currency: 'eur',
      unit_amount: Math.round(plan.price_eur * 100),
      recurring: { interval: 'month', interval_count: plan.duration_months },
      product_data: { name: `Bella Bianca — ${plan.label}` },
    })
    await sbFetch(`/subscription_plans?id=eq.${plan.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ stripe_price_id: price.id }),
    })
    console.log(`✓ ${plan.label}: ${price.id}`)
  }
  console.log('Done!')
}

main().catch(console.error)
