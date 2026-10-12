import "server-only";

import { sql } from "drizzle-orm";
import { z } from "zod";
import { rows, type Database } from "@/db/client";
import { allocateNumber } from "@/db/numbering";
import { canTransition, type FulfillmentStatus, type FulfillmentType } from "@/domain/transitions";
import { orderTotal, quoteLines, type PricedGroup, type PricedItem } from "@/domain/pricing";
import { includedVatForMenu } from "./payments";

const lineSchema = z.object({
  itemId: z.string().min(1).max(160),
  quantity: z.number().int().min(1).max(20),
  choiceIds: z.array(z.string().max(160)).max(8),
});

export const checkoutSchema = z.object({
  branchId: z.string().min(1).max(80),
  clientRequestId: z.string().uuid(),
  locale: z.enum(["en", "ar"]),
  fulfillmentType: z.enum(["delivery", "pickup"]),
  contactName: z.string().trim().min(2).max(80),
  contactPhone: z.string().trim().regex(/^[0-9+\s()-]{8,20}$/),
  contactEmail: z.string().trim().email().or(z.literal("")).optional(),
  addressEmirate: z.string().trim().max(40).optional(),
  addressLine1: z.string().trim().max(160).optional(),
  addressLine2: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(400).optional(),
  lines: z.array(lineSchema).min(1).max(40),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

type BranchRow = {
  id: string;
  delivery_mode: string;
  delivery_fee_minor: number | null;
  pickup_mode: string;
  is_active: boolean;
};

type ItemRow = {
  id: string;
  branch_id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  price_minor: number | null;
  is_available: boolean;
  review_status: string;
  category_en: string;
  category_ar: string;
  category_sort: number;
  sort_order: number;
  source_page: number | null;
};

type ChoiceRow = {
  group_id: string;
  item_id: string;
  group_en: string;
  group_ar: string;
  required: boolean;
  min_select: number;
  max_select: number;
  group_sort: number;
  choice_id: string;
  choice_en: string;
  choice_ar: string;
  price_delta_minor: number;
  absolute_price_minor: number | null;
  choice_sort: number;
};

export async function showUnreviewed(db: Database): Promise<boolean> {
  const rowsFound = await rows<{ value: unknown }>(
    await db.execute(sql`SELECT value FROM business_settings WHERE key = 'show_unreviewed_menu'`),
  );
  const value = rowsFound[0]?.value;
  return value === true || value === "true";
}

export async function loadSellableItems(db: Database, branchId: string, includePending: boolean): Promise<PricedItem[]> {
  const items = await rows<ItemRow>(await db.execute(sql`
    SELECT i.id, i.branch_id, i.category_id, i.name_en, i.name_ar, i.description_en, i.description_ar,
           i.price_minor, i.is_available, i.review_status, c.name_en AS category_en, c.name_ar AS category_ar,
           c.sort_order AS category_sort, i.sort_order, i.source_page
    FROM menu_items i
    JOIN menu_categories c ON c.id = i.category_id
    WHERE i.branch_id = ${branchId}
    ORDER BY c.sort_order, i.sort_order
  `));
  const choices = await rows<ChoiceRow>(await db.execute(sql`
    SELECT g.id AS group_id, g.item_id, g.name_en AS group_en, g.name_ar AS group_ar, g.required,
           g.min_select, g.max_select, g.sort_order AS group_sort, ch.id AS choice_id, ch.name_en AS choice_en,
           ch.name_ar AS choice_ar, ch.price_delta_minor, ch.absolute_price_minor, ch.sort_order AS choice_sort
    FROM modifier_groups g
    JOIN modifier_choices ch ON ch.group_id = g.id
    JOIN menu_items i ON i.id = g.item_id
    WHERE i.branch_id = ${branchId}
    ORDER BY g.sort_order, ch.sort_order
  `));
  return items
    .filter((item) => includePending || item.review_status === "approved")
    .map((item) => {
      const groups = new Map<string, PricedGroup>();
      for (const choice of choices.filter((row) => row.item_id === item.id)) {
        const group = groups.get(choice.group_id) ?? {
          id: choice.group_id,
          nameEn: choice.group_en,
          nameAr: choice.group_ar,
          required: choice.required,
          minSelect: choice.min_select,
          maxSelect: choice.max_select,
          choices: [],
        };
        group.choices.push({
          id: choice.choice_id,
          nameEn: choice.choice_en,
          nameAr: choice.choice_ar,
          priceDeltaMinor: choice.price_delta_minor,
          absolutePriceMinor: choice.absolute_price_minor,
        });
        groups.set(choice.group_id, group);
      }
      return {
        id: item.id,
        branchId: item.branch_id,
        nameEn: item.name_en,
        nameAr: item.name_ar,
        priceMinor: item.price_minor,
        isAvailable: item.is_available,
        reviewStatus: item.review_status,
        groups: [...groups.values()],
      };
    });
}

export function deliveryOffer(branch: BranchRow, type: FulfillmentType): { ok: boolean; feeMinor: number; policy: string; error?: string } {
  if (!branch.is_active) return { ok: false, feeMinor: 0, policy: "inactive", error: "branch_inactive" };
  if (type === "pickup") {
    if (branch.pickup_mode !== "enabled") return { ok: false, feeMinor: 0, policy: branch.pickup_mode, error: "pickup_not_configured" };
    return { ok: true, feeMinor: 0, policy: "enabled" };
  }
  if (branch.delivery_mode === "printed_free_unconfirmed") {
    return { ok: true, feeMinor: 0, policy: "printed_free_unconfirmed" };
  }
  if (branch.delivery_mode === "enabled") {
    if (branch.delivery_fee_minor == null) return { ok: false, feeMinor: 0, policy: "enabled", error: "delivery_fee_missing" };
    return { ok: true, feeMinor: branch.delivery_fee_minor, policy: "enabled" };
  }
  return { ok: false, feeMinor: 0, policy: branch.delivery_mode, error: "delivery_not_configured" };
}

export async function placeOrder(db: Database, input: CheckoutInput, customerUserId: string | null) {
  const parsed = checkoutSchema.parse(input);
  const branchRows = await rows<BranchRow>(await db.execute(sql`
    SELECT id, delivery_mode, delivery_fee_minor, pickup_mode, is_active FROM branches WHERE id = ${parsed.branchId}
  `));
  const branch = branchRows[0];
  if (!branch) return { ok: false as const, error: "branch_missing" };
  const offer = deliveryOffer(branch, parsed.fulfillmentType);
  if (!offer.ok) return { ok: false as const, error: offer.error ?? "fulfillment_unavailable" };
  if (parsed.fulfillmentType === "delivery" && (!parsed.addressLine1 || !parsed.addressEmirate)) {
    return { ok: false as const, error: "address_required" };
  }
  const visible = await showUnreviewed(db);
  const items = await loadSellableItems(db, branch.id, visible);
  const quote = quoteLines(items, parsed.lines);
  if (quote.errors.length > 0 || quote.lines.length !== parsed.lines.length) {
    return { ok: false as const, error: "cart_invalid", details: quote.errors };
  }
  const menu = await rows<{ vat_note_en: string | null }>(
    await db.execute(sql`SELECT vat_note_en FROM menus WHERE branch_id = ${branch.id} LIMIT 1`),
  );
  const subtotalMinor = quote.subtotalMinor;
  const totalMinor = orderTotal({ subtotalMinor, discountMinor: 0, deliveryFeeMinor: offer.feeMinor });
  const vat = includedVatForMenu(totalMinor, menu[0]?.vat_note_en ?? null);
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  const tokenHash = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))).toString("hex");
  const address = parsed.fulfillmentType === "delivery"
    ? { emirateId: parsed.addressEmirate, line1: parsed.addressLine1, line2: parsed.addressLine2 || null }
    : null;
  try {
    const created = await db.transaction(async (tx) => {
      const publicNumber = await allocateNumber(tx, "order");
      const orderId = crypto.randomUUID();
      await tx.execute(sql`
        INSERT INTO orders (
          id, public_number, client_request_id, branch_id, customer_user_id, contact_name, contact_phone,
          contact_email, locale, fulfillment_type, fulfillment_policy_status, address_snapshot, delivery_notes,
          currency, subtotal_minor, discount_minor, delivery_fee_minor, included_vat_minor, vat_note, total_minor,
          payment_status, fulfillment_status, access_token_hash
        ) VALUES (
          ${orderId}, ${publicNumber}, ${parsed.clientRequestId}, ${branch.id}, ${customerUserId}, ${parsed.contactName},
          ${parsed.contactPhone}, ${parsed.contactEmail || null}, ${parsed.locale}, ${parsed.fulfillmentType},
          ${offer.policy}, ${address ? JSON.stringify(address) : null}::jsonb, ${parsed.notes || null}, 'AED',
          ${subtotalMinor}, 0, ${offer.feeMinor}, ${vat.minor}, ${vat.note}, ${totalMinor}, 'unpaid', 'pending_payment', ${tokenHash}
        )
      `);
      for (const line of quote.lines) {
        await tx.execute(sql`
          INSERT INTO order_lines (id, order_id, item_id, name_en, name_ar, quantity, unit_price_minor, modifiers_snapshot, line_total_minor)
          VALUES (${crypto.randomUUID()}, ${orderId}, ${line.itemId}, ${line.nameEn}, ${line.nameAr}, ${line.quantity},
                  ${line.unitPriceMinor}, ${JSON.stringify(line.modifiers)}::jsonb, ${line.lineTotalMinor})
        `);
      }
      await tx.execute(sql`
        INSERT INTO payments (id, order_id, provider, amount_minor, currency, status, idempotency_key)
        VALUES (${crypto.randomUUID()}, ${orderId}, 'stripe', ${totalMinor}, 'AED', 'unpaid', ${parsed.clientRequestId})
      `);
      await tx.execute(sql`
        INSERT INTO order_status_history (id, order_id, actor_user_id, actor_role, from_status, to_status, kind)
        VALUES (${crypto.randomUUID()}, ${orderId}, ${customerUserId}, ${customerUserId ? "customer" : "guest"}, NULL, 'pending_payment', 'fulfillment')
      `);
      return { orderId, publicNumber, totalMinor };
    });
    return { ok: true as const, token, ...created, policy: offer.policy };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("client_request_id") || message.includes("23505")) {
      return { ok: false as const, error: "duplicate_request" };
    }
    throw error;
  }
}

export async function changeFulfillment(
  db: Database,
  orderId: string,
  to: FulfillmentStatus,
  actor: { id: string; role: "staff" | "customer" },
) {
  return db.transaction(async (tx) => {
    const locked = await rows<{ fulfillment_status: FulfillmentStatus; fulfillment_type: FulfillmentType; branch_id: string; payment_status: string }>(
      await tx.execute(sql`SELECT fulfillment_status, fulfillment_type, branch_id, payment_status FROM orders WHERE id = ${orderId} FOR UPDATE`),
    );
    const order = locked[0];
    if (!order) return { ok: false as const, error: "missing" };
    if (!canTransition({ from: order.fulfillment_status, to, actor: actor.role === "customer" ? "customer" : "staff", fulfillmentType: order.fulfillment_type })) {
      return { ok: false as const, error: "transition_denied" };
    }
    await tx.execute(sql`UPDATE orders SET fulfillment_status = ${to}, updated_at = now() WHERE id = ${orderId}`);
    await tx.execute(sql`
      INSERT INTO order_status_history (id, order_id, actor_user_id, actor_role, from_status, to_status, kind)
      VALUES (${crypto.randomUUID()}, ${orderId}, ${actor.id}, ${actor.role}, ${order.fulfillment_status}, ${to}, 'fulfillment')
    `);
    await tx.execute(sql`
      INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, branch_id, metadata)
      VALUES (${crypto.randomUUID()}, ${actor.id}, 'order.transition', 'order', ${orderId}, ${order.branch_id}, ${JSON.stringify({ from: order.fulfillment_status, to })}::jsonb)
    `);
    if (to === "delivered" || to === "cancelled" || to === "refunded") {
      await tx.execute(sql`UPDATE driver_assignments SET active = false, unassigned_at = now() WHERE order_id = ${orderId} AND active = true`);
    }
    return { ok: true as const };
  });
}
