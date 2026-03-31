import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: process.env.STRIPE_API_VERSION as any,
  typescript: true,
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  customerId: string,
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/billing?success=1`,
    cancel_url: `${APP_URL}/billing?canceled=1`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId },
    },
    metadata: { userId },
    allow_promotion_codes: true,
  })

  if (!session.url) throw new Error('Stripe did not return a checkout URL')
  return session.url
}

export async function createCustomerPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/billing`,
  })
  return session.url
}

export async function createStripeCustomer(email: string, name?: string): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { source: 'gappilot_signup' },
  })
  return customer.id
}

export async function createCreditCheckoutSession(
  userId: string,
  priceId: string,
  credits: number,
  packageKey: string,
  customerId: string,
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/billing?credits_added=1`,
    cancel_url: `${APP_URL}/billing`,
    metadata: { userId, credits: String(credits), packageKey, type: 'credit_purchase' },
  })

  if (!session.url) throw new Error('Stripe did not return a checkout URL')
  return session.url
}
