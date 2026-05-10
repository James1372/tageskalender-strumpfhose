import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, planId, creditId } = session.metadata ?? {}
    if (!userId || !planId) return NextResponse.json({ received: true })

    const sub = await stripe.subscriptions.retrieve(session.subscription as string) as Stripe.Subscription
    const periodEnd = sub.items.data[0]?.current_period_end
    await admin.from('subscriptions').upsert({
      user_id: userId,
      plan_id: planId,
      stripe_sub_id: sub.id,
      status: 'active',
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    }, { onConflict: 'stripe_sub_id' })

    if (creditId) {
      await admin.from('credits').update({ used: true }).eq('id', creditId)
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const statusMap: Record<string, string> = {
      active: 'active', past_due: 'past_due', canceled: 'canceled',
    }
    const periodEnd = sub.items.data[0]?.current_period_end
    await admin.from('subscriptions')
      .update({
        status: statusMap[sub.status] ?? 'canceled',
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      })
      .eq('stripe_sub_id', sub.id)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await admin.from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_sub_id', sub.id)
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subId = invoice.parent?.subscription_details?.subscription
    if (subId) {
      await admin.from('subscriptions')
        .update({ status: 'grace' })
        .eq('stripe_sub_id', typeof subId === 'string' ? subId : subId.id)
    }
  }

  return NextResponse.json({ received: true })
}
