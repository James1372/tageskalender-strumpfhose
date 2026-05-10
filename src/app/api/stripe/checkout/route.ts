import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { planId } = await request.json()
  const admin = createAdminClient()

  const { data: plan } = await admin
    .from('subscription_plans').select('*').eq('id', planId).single()
  if (!plan || !plan.stripe_price_id)
    return NextResponse.json({ error: 'Plan nicht gefunden' }, { status: 404 })

  const { data: profile } = await admin
    .from('profiles').select('stripe_customer_id').eq('id', user.id).single()

  // Check for unused EUR credit
  const { data: credit } = await admin
    .from('credits')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'eur')
    .eq('used', false)
    .maybeSingle()

  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email! })
    customerId = customer.id
    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    ...(credit ? {
      discounts: [{
        coupon: (await stripe.coupons.create({
          amount_off: Math.round(credit.value * 100),
          currency: 'eur',
          duration: 'once',
          name: 'Guthaben',
        })).id,
      }],
    } : {}),
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/feed?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
    metadata: { userId: user.id, planId, creditId: credit?.id ?? '' },
  })

  return NextResponse.json({ url: session.url })
}
