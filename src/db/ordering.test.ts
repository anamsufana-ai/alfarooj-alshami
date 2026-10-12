import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { openMemoryDatabase, rows } from "./client";
import { allocateNumber } from "./numbering";
import { seedIfEmpty } from "./seed";
import { applyProviderEvent, confirmPaid } from "@/server/payments";
import { placeOrder } from "@/server/orders";

const dbPromise = openMemoryDatabase();

afterAll(async () => {
  const db = await dbPromise;
  await db.close();
});

describe("database ordering", () => {
  it("seeds real branches, allocates unique numbers, and issues one invoice", async () => {
    const db = await dbPromise;
    await seedIfEmpty(db);
    const branch = await rows<{ id: string }>(await db.execute(sql`SELECT id FROM branches WHERE slug = 'ajman'`));
    const item = await rows<{ id: string }>(await db.execute(sql`
      SELECT id FROM menu_items WHERE branch_id = ${branch[0].id} AND name_en = 'Homus' AND is_available = true LIMIT 1
    `));
    expect(item[0]).toBeTruthy();
    const placed = await placeOrder(db, {
      branchId: branch[0].id,
      clientRequestId: crypto.randomUUID(),
      locale: "en",
      fulfillmentType: "delivery",
      contactName: "Test Guest",
      contactPhone: "0500000000",
      contactEmail: "",
      addressEmirate: "ajman",
      addressLine1: "Test building",
      lines: [{ itemId: item[0].id, quantity: 1, choiceIds: [] }],
    }, null);
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    const second = await placeOrder(db, {
      branchId: branch[0].id,
      clientRequestId: crypto.randomUUID(),
      locale: "ar",
      fulfillmentType: "delivery",
      contactName: "ضيف",
      contactPhone: "0500000001",
      addressEmirate: "ajman",
      addressLine1: "مبنى",
      lines: [{ itemId: item[0].id, quantity: 2, choiceIds: [] }],
    }, null);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.publicNumber).toBe(placed.publicNumber + 1);
    const invoice = await confirmPaid(db, placed.orderId, "pi_test");
    const again = await confirmPaid(db, placed.orderId, "pi_test");
    expect(invoice).toBe(again);
    const count = await rows<{ count: number | string }>(await db.execute(sql`SELECT count(*) AS count FROM invoices WHERE order_id = ${placed.orderId}`));
    expect(Number(count[0].count)).toBe(1);
    const event = {
      id: "evt_test_1",
      type: "checkout.session.completed",
      data: { object: { payment_status: "paid", metadata: { orderId: second.orderId }, payment_intent: "pi_second" } },
    };
    expect(await applyProviderEvent(db, event)).toBe("processed");
    expect(await applyProviderEvent(db, event)).toBe("duplicate");
    const invoices = await rows<{ count: number | string }>(await db.execute(sql`SELECT count(*) AS count FROM invoices WHERE order_id = ${second.orderId}`));
    expect(Number(invoices[0].count)).toBe(1);
    const rigga = await rows<{ id: string }>(await db.execute(sql`SELECT id FROM branches WHERE slug = 'dubai-al-rigga'`));
    const riggaItem = await rows<{ id: string }>(await db.execute(sql`
      SELECT id FROM menu_items WHERE branch_id = ${rigga[0].id} AND name_en = 'Orange' LIMIT 1
    `));
    const blocked = await placeOrder(db, {
      branchId: rigga[0].id,
      clientRequestId: crypto.randomUUID(),
      locale: "en",
      fulfillmentType: "delivery",
      contactName: "No Delivery",
      contactPhone: "0500000002",
      addressEmirate: "dubai",
      addressLine1: "Street",
      lines: [{ itemId: riggaItem[0].id, quantity: 1, choiceIds: [] }],
    }, null);
    expect(blocked).toMatchObject({ ok: false, error: "delivery_not_configured" });
  }, 120000);

  it("keeps concurrent counter updates distinct", async () => {
    const db = await dbPromise;
    const numbers = await Promise.all([
      db.transaction(async (tx) => allocateNumber(tx, "order")),
      db.transaction(async (tx) => allocateNumber(tx, "order")),
    ]);
    expect(new Set(numbers).size).toBe(2);
  });
});
