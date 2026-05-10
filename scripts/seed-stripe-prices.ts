// scripts/seed-stripe-prices.ts
// Run once to create Stripe prices for each subscription plan.
// Usage: npx ts-node --project tsconfig.json scripts/seed-stripe-prices.ts
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: plans } = await supabase.from('subscription_plans').select('*')
  for (const plan of plans ?? []) {
    const price = await stripe.prices.create({
      currency: 'eur',
      unit_amount: Math.round(plan.price_eur * 100),
      recurring: { interval: 'month', interval_count: plan.duration_months },
      product_data: { name: `Bella Bianca — ${plan.label}` },
    })
    await supabase.from('subscription_plans')
      .update({ stripe_price_id: price.id })
      .eq('id', plan.id)
    console.log(`Created price for ${plan.label}: ${price.id}`)
  }
  console.log('Done!')
}

main().catch(console.error)
