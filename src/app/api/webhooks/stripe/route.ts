import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as const,
})

const priceToPlan: Record<string, 'solo' | 'growth' | 'agency'> = {
  [process.env.STRIPE_PRICE_SOLO_MONTHLY!]: 'solo',
  [process.env.STRIPE_PRICE_GROWTH_MONTHLY!]: 'growth',
  [process.env.STRIPE_PRICE_AGENCY_MONTHLY!]: 'agency',
}

function planFromSubscription(subscription: Stripe.Subscription): 'solo' | 'growth' | 'agency' {
  const priceId = subscription.items.data[0]?.price.id ?? ''
  return priceToPlan[priceId] ?? 'solo'
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Fetch full subscription to get price/plan
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const plan = planFromSubscription(subscription)

        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            subscription_status: subscription.status as 'trialing' | 'active',
            subscription_tier: plan,
            stripe_subscription_id: subscriptionId,
          } as Record<string, unknown>)
          .eq('stripe_customer_id', customerId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const plan = planFromSubscription(subscription)

        await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status as 'trialing' | 'active' | 'past_due' | 'canceled',
            subscription_tier: plan,
          })
          .eq('stripe_customer_id', subscription.customer as string)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            subscription_tier: null,
          })
          .eq('stripe_customer_id', subscription.customer as string)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer as string)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
