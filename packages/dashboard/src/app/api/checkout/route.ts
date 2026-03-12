import { NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const stripe = getStripe();

    const { tier } = (await req.json()) as { tier?: string };

    const priceIds: Record<string, string | undefined> = {
      pro: process.env.STRIPE_PRO_PRICE_ID,
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    };

    if (!tier || !(tier in priceIds)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const priceId = priceIds[tier];
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://volthq.dev';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
