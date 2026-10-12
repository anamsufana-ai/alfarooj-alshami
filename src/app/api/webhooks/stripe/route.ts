import { getDb } from "@/db/client";
import { applyProviderEvent } from "@/server/payments";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!secret || (!key.startsWith("sk_test_") && !key.startsWith("sk_live_"))) {
    return Response.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });
  const payload = await request.text();
  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key);
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    const db = await getDb();
    const result = await applyProviderEvent(db, {
      id: event.id,
      type: event.type,
      data: { object: event.data.object as unknown as Record<string, unknown> },
    });
    return Response.json({ received: true, result });
  } catch {
    return Response.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
