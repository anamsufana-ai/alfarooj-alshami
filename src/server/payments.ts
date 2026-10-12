import "server-only";

import { sql } from "drizzle-orm";
import type Stripe from "stripe";
import { rows, type Database } from "@/db/client";
import { allocateNumber } from "@/db/numbering";
import { includedVatMinor } from "@/domain/money";

type OrderRow = {
  id: string;
  public_number: number | string;
  branch_id: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  fulfillment_type: string;
  fulfillment_policy_status: string;
  address_snapshot: unknown;
  delivery_notes: string | null;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  delivery_fee_minor: number;
  included_vat_minor: number | null;
  vat_note: string | null;
  total_minor: number;
  payment_status: string;
  fulfillment_status: string;
  paid_at: string | null;
  created_at: string;
};

async function history(
  db: Database,
  orderId: string,
  actorUserId: string | null,
  actorRole: string,
  fromStatus: string | null,
  toStatus: string,
  kind: string,
) {
  await db.execute(sql`
    INSERT INTO order_status_history (id, order_id, actor_user_id, actor_role, from_status, to_status, kind)
    VALUES (${crypto.randomUUID()}, ${orderId}, ${actorUserId}, ${actorRole}, ${fromStatus}, ${toStatus}, ${kind})
  `);
}

async function audit(db: Database, action: string, entityType: string, entityId: string, branchId: string | null, metadata: Record<string, unknown>) {
  await db.execute(sql`
    INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, branch_id, metadata)
    VALUES (${crypto.randomUUID()}, ${null}, ${action}, ${entityType}, ${entityId}, ${branchId}, ${JSON.stringify(metadata)}::jsonb)
  `);
}

export async function confirmPaid(db: Database, orderId: string, providerRef: string | null): Promise<number | null> {
  return db.transaction(async (tx) => {
    const locked = await rows<OrderRow>(await tx.execute(sql`SELECT * FROM orders WHERE id = ${orderId} FOR UPDATE`));
    const order = locked[0];
    if (!order) return null;
    const existing = await rows<{ invoice_number: number | string }>(
      await tx.execute(sql`SELECT invoice_number FROM invoices WHERE order_id = ${orderId}`),
    );
    if (order.payment_status === "paid" || order.payment_status === "refunded") {
      return existing[0] ? Number(existing[0].invoice_number) : null;
    }
    if (order.payment_status !== "unpaid" && order.payment_status !== "pending" && order.payment_status !== "failed") {
      return null;
    }
    if (order.fulfillment_status !== "pending_payment") return null;
    await tx.execute(sql`
      UPDATE orders
      SET payment_status = 'paid', fulfillment_status = 'confirmed', paid_at = now(), updated_at = now()
      WHERE id = ${orderId}
    `);
    await tx.execute(sql`
      UPDATE payments
      SET status = 'paid', provider_ref = COALESCE(${providerRef}, provider_ref), updated_at = now()
      WHERE order_id = ${orderId}
    `);
    await history(tx, orderId, null, "payment", order.fulfillment_status, "confirmed", "fulfillment");
    const invoiceNumber = await allocateNumber(tx, "invoice");
    const lines = await rows<Record<string, unknown>>(await tx.execute(sql`SELECT * FROM order_lines WHERE order_id = ${orderId}`));
    const branch = await rows<{ name_en: string; name_ar: string; phones: unknown }>(
      await tx.execute(sql`SELECT name_en, name_ar, phones FROM branches WHERE id = ${order.branch_id}`),
    );
    const snapshot = {
      invoiceNumber,
      orderNumber: Number(order.public_number),
      currency: order.currency,
      branch: branch[0] ?? null,
      contact: { name: order.contact_name, phone: order.contact_phone, email: order.contact_email },
      fulfillmentType: order.fulfillment_type,
      address: order.address_snapshot,
      lines,
      subtotalMinor: order.subtotal_minor,
      discountMinor: order.discount_minor,
      deliveryFeeMinor: order.delivery_fee_minor,
      totalMinor: order.total_minor,
      includedVatMinor: order.included_vat_minor,
      vatNote: order.vat_note,
      taxRegistrationNumber: null,
      disclaimer: "This document repeats the order at the time of payment. It is not a UAE tax invoice and no tax registration number is on file.",
    };
    await tx.execute(sql`
      INSERT INTO invoices (id, invoice_number, order_id, snapshot, currency, total_minor)
      VALUES (${crypto.randomUUID()}, ${invoiceNumber}, ${orderId}, ${JSON.stringify(snapshot)}::jsonb, ${order.currency}, ${order.total_minor})
    `);
    await audit(tx, "invoice.issued", "invoice", String(invoiceNumber), order.branch_id, { orderId });
    return invoiceNumber;
  });
}

export async function markPaymentFailed(db: Database, orderId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const locked = await rows<OrderRow>(await tx.execute(sql`SELECT * FROM orders WHERE id = ${orderId} FOR UPDATE`));
    const order = locked[0];
    if (!order || order.payment_status === "paid" || order.payment_status === "refunded") return;
    await tx.execute(sql`
      UPDATE orders SET payment_status = 'failed', updated_at = now() WHERE id = ${orderId}
    `);
    await tx.execute(sql`UPDATE payments SET status = 'failed', updated_at = now() WHERE order_id = ${orderId}`);
    await history(tx, orderId, null, "payment", order.payment_status, "failed", "payment");
  });
}

export async function markRefunded(db: Database, orderId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const locked = await rows<OrderRow>(await tx.execute(sql`SELECT * FROM orders WHERE id = ${orderId} FOR UPDATE`));
    const order = locked[0];
    if (!order || order.payment_status === "refunded") return;
    if (order.payment_status !== "paid") return;
    await tx.execute(sql`
      UPDATE orders
      SET payment_status = 'refunded', fulfillment_status = 'refunded', updated_at = now()
      WHERE id = ${orderId}
    `);
    await tx.execute(sql`UPDATE payments SET status = 'refunded', updated_at = now() WHERE order_id = ${orderId}`);
    await history(tx, orderId, null, "payment", order.fulfillment_status, "refunded", "fulfillment");
    await audit(tx, "payment.refunded", "order", orderId, order.branch_id, {});
  });
}

function orderIdFromObject(object: Record<string, unknown>): string | null {
  const metadata = object.metadata;
  if (metadata && typeof metadata === "object" && "orderId" in metadata) {
    const value = (metadata as { orderId?: unknown }).orderId;
    if (typeof value === "string" && value) return value;
  }
  return null;
}

export async function applyProviderEvent(
  db: Database,
  event: { id: string; type: string; data: { object: Record<string, unknown> } },
): Promise<"duplicate" | "processed" | "ignored"> {
  try {
    await db.execute(sql`
      INSERT INTO payment_events (id, provider, provider_event_id, event_type, payload, processed_at)
      VALUES (${crypto.randomUUID()}, 'stripe', ${event.id}, ${event.type}, ${JSON.stringify(event)}::jsonb, now())
    `);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("unique") || message.includes("23505") || message.includes("payment_events")) {
      return "duplicate";
    }
    throw error;
  }
  const object = event.data.object;
  const orderId = orderIdFromObject(object);
  if (event.type === "checkout.session.completed" && object.payment_status === "paid" && orderId) {
    const paymentIntent = typeof object.payment_intent === "string" ? object.payment_intent : null;
    await confirmPaid(db, orderId, paymentIntent);
    return "processed";
  }
  if ((event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") && orderId) {
    await markPaymentFailed(db, orderId);
    return "processed";
  }
  if (event.type === "charge.refunded" && orderId) {
    await markRefunded(db, orderId);
    return "processed";
  }
  if (event.type === "charge.refunded" && typeof object.payment_intent === "string") {
    const match = await rows<{ order_id: string }>(await db.execute(sql`
      SELECT order_id FROM payments
      WHERE provider_ref = ${object.payment_intent} OR idempotency_key = ${object.payment_intent}
      LIMIT 1
    `));
    if (match[0]) {
      await markRefunded(db, match[0].order_id);
      return "processed";
    }
  }
  return "ignored";
}

export async function syncCheckoutSession(db: Database, sessionId: string): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) return;
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return;
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : null;
  await confirmPaid(db, orderId, paymentIntent);
}

export function includedVatForMenu(totalMinor: number, vatNote: string | null): { minor: number | null; note: string | null } {
  if (!vatNote || !vatNote.includes("5%")) return { minor: null, note: null };
  return {
    minor: includedVatMinor(totalMinor, 500),
    note: `${vatNote}. The included amount is calculated from that printed sentence. This is not a tax invoice.`,
  };
}

export type StripeEvent = Stripe.Event;
