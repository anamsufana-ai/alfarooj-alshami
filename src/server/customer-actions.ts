"use server";

import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, rows } from "@/db/client";
import { quoteLines } from "@/domain/pricing";
import { formatMinor } from "@/domain/money";
import { createSession, clearSession, getActor, hashPassword, verifyPassword } from "@/lib/auth";
import { appBaseUrl, stripeReady } from "@/lib/config";
import { rateLimit } from "@/lib/rate-limit";
import type { StoredCart } from "@/lib/cart";
import { checkoutSchema, loadSellableItems, placeOrder, showUnreviewed } from "./orders";

export async function quoteCart(cart: StoredCart, locale: "en" | "ar") {
  const db = await getDb();
  const items = await loadSellableItems(db, cart.branchId, await showUnreviewed(db));
  const quote = quoteLines(items, cart.lines);
  return {
    ...quote,
    lines: quote.lines.map((line) => ({
      ...line,
      unitLabel: formatMinor(line.unitPriceMinor, locale),
      lineLabel: formatMinor(line.lineTotalMinor, locale),
    })),
    subtotalLabel: formatMinor(quote.subtotalMinor, locale),
  };
}

export async function placeCheckout(input: unknown) {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  if (!rateLimit(`checkout:${parsed.data.contactPhone}`, 8, 10 * 60 * 1000)) {
    return { ok: false as const, error: "rate_limited" };
  }
  const db = await getDb();
  const actor = await getActor();
  const customerId = actor?.role === "customer" && !actor.disabled ? actor.id : null;
  const placed = await placeOrder(db, parsed.data, customerId);
  if (!placed.ok) return placed;
  if (!stripeReady()) {
    return { ok: true as const, next: `/${parsed.data.locale}/order/${placed.token}` };
  }
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  const lineRows = await rows<{ name_en: string; quantity: number; unit_price_minor: number }>(
    await db.execute(sql`SELECT name_en, quantity, unit_price_minor FROM order_lines WHERE order_id = ${placed.orderId}`),
  );
  const fee = await rows<{ delivery_fee_minor: number }>(await db.execute(sql`SELECT delivery_fee_minor FROM orders WHERE id = ${placed.orderId}`));
  const lineItems = lineRows.map((line) => ({
    quantity: line.quantity,
    price_data: { currency: "aed", unit_amount: line.unit_price_minor, product_data: { name: line.name_en } },
  }));
  if ((fee[0]?.delivery_fee_minor ?? 0) > 0) {
    lineItems.push({
      quantity: 1,
      price_data: { currency: "aed", unit_amount: fee[0].delivery_fee_minor, product_data: { name: "Delivery" } },
    });
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${appBaseUrl()}/${parsed.data.locale}/order/${placed.token}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appBaseUrl()}/${parsed.data.locale}/order/${placed.token}`,
    client_reference_id: placed.orderId,
    metadata: { orderId: placed.orderId },
    payment_intent_data: { metadata: { orderId: placed.orderId } },
    line_items: lineItems,
  });
  await db.execute(sql`
    UPDATE payments SET status = 'pending', provider_ref = ${session.id}, idempotency_key = ${session.id}, updated_at = now()
    WHERE order_id = ${placed.orderId}
  `);
  await db.execute(sql`UPDATE orders SET payment_status = 'pending', updated_at = now() WHERE id = ${placed.orderId} AND payment_status = 'unpaid'`);
  return { ok: true as const, next: session.url ?? `/${parsed.data.locale}/order/${placed.token}` };
}

const credentials = z.object({
  email: z.string().trim().email(),
  password: z.string().min(10).max(200),
  locale: z.enum(["en", "ar"]),
});

export async function loginAction(_state: { error?: string } | null, formData: FormData) {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { error: "invalid" };
  if (!rateLimit(`login:${parsed.data.email.toLowerCase()}`, 5, 15 * 60 * 1000)) return { error: "rate_limited" };
  const db = await getDb();
  const users = await rows<{ id: string; password_hash: string; disabled_at: string | null }>(
    await db.execute(sql`SELECT id, password_hash, disabled_at FROM users WHERE email = ${parsed.data.email.toLowerCase()}`),
  );
  const user = users[0];
  if (!user || user.disabled_at || !(await verifyPassword(parsed.data.password, user.password_hash))) {
    return { error: "invalid_login" };
  }
  await createSession(db, user.id);
  redirect(`/${parsed.data.locale}/account`);
}

export async function registerAction(_state: { error?: string } | null, formData: FormData) {
  const parsed = credentials.extend({ name: z.string().trim().min(2).max(80), phone: z.string().trim().regex(/^[0-9+\s()-]{8,20}$/) }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale"),
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: "invalid" };
  if (!rateLimit(`register:${parsed.data.email.toLowerCase()}`, 5, 15 * 60 * 1000)) return { error: "rate_limited" };
  const db = await getDb();
  const email = parsed.data.email.toLowerCase();
  const existing = await rows<{ id: string }>(await db.execute(sql`SELECT id FROM users WHERE email = ${email}`));
  if (existing[0]) return { error: "exists" };
  const id = crypto.randomUUID();
  await db.execute(sql`
    INSERT INTO users (id, email, name, phone, password_hash, role, locale)
    VALUES (${id}, ${email}, ${parsed.data.name}, ${parsed.data.phone}, ${await hashPassword(parsed.data.password)}, 'customer', ${parsed.data.locale})
  `);
  await createSession(db, id);
  redirect(`/${parsed.data.locale}/account`);
}

export async function setupAdminAction(_state: { error?: string } | null, formData: FormData) {
  const parsed = credentials.extend({ name: z.string().trim().min(2).max(80) }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: "invalid" };
  const db = await getDb();
  const count = await rows<{ count: number | string }>(await db.execute(sql`SELECT count(*) AS count FROM users`));
  if (Number(count[0]?.count ?? 0) > 0) return { error: "closed" };
  const id = crypto.randomUUID();
  await db.execute(sql`
    INSERT INTO users (id, email, name, password_hash, role, locale)
    VALUES (${id}, ${parsed.data.email.toLowerCase()}, ${parsed.data.name}, ${await hashPassword(parsed.data.password)}, 'business_admin', ${parsed.data.locale})
  `);
  await db.execute(sql`
    INSERT INTO audit_logs (id, action, entity_type, entity_id, metadata)
    VALUES (${crypto.randomUUID()}, 'user.bootstrap_admin', 'user', ${id}, ${JSON.stringify({ email: parsed.data.email.toLowerCase() })}::jsonb)
  `);
  await createSession(db, id);
  redirect(`/${parsed.data.locale}/admin`);
}

export async function logoutAction(locale: "en" | "ar") {
  await clearSession();
  redirect(`/${locale}`);
}
