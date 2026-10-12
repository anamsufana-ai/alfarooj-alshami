"use server";

import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, rows } from "@/db/client";
import { canAccessBranch, canManageBusiness, canManageMenu, canManageStaff, canProcessOrders, canDrive } from "@/domain/permissions";
import { canRecordDriverLocation, roundCoordinate } from "@/domain/location-policy";
import { locationRetentionDays } from "@/lib/config";
import { getActor, hashPassword } from "@/lib/auth";
import { changeFulfillment } from "./orders";
import type { FulfillmentStatus } from "@/domain/transitions";

async function actorOrRedirect(locale: string) {
  const actor = await getActor();
  if (!actor || actor.disabled) redirect(`/${locale}/login`);
  return actor;
}

export async function transitionAction(formData: FormData) {
  const locale = String(formData.get("locale") || "en");
  const actor = await actorOrRedirect(locale);
  const orderId = String(formData.get("orderId") || "");
  const to = String(formData.get("to") || "") as FulfillmentStatus;
  const db = await getDb();
  const order = await rows<{ branch_id: string }>(await db.execute(sql`SELECT branch_id FROM orders WHERE id = ${orderId}`));
  if (!order[0] || !canProcessOrders(actor, order[0].branch_id)) redirect(`/${locale}/admin?error=forbidden`);
  await changeFulfillment(db, orderId, to, { id: actor.id, role: "staff" });
  redirect(`/${locale}/admin/orders`);
}

export async function branchConfigAction(formData: FormData) {
  const locale = String(formData.get("locale") || "en");
  const actor = await actorOrRedirect(locale);
  const branchId = String(formData.get("branchId") || "");
  if (!canManageBusiness(actor) && !(actor.role === "branch_admin" && actor.branchIds.includes(branchId))) {
    redirect(`/${locale}/admin?error=forbidden`);
  }
  const pickup = formData.get("pickup") === "enabled" ? "enabled" : "not_configured";
  const delivery = String(formData.get("delivery") || "not_configured");
  const allowed = ["not_configured", "printed_free_unconfirmed", "printed_fee_unknown", "enabled"];
  if (!allowed.includes(delivery)) redirect(`/${locale}/admin/branches`);
  const feeRaw = String(formData.get("fee") || "");
  const fee = feeRaw === "" ? null : Math.round(Number(feeRaw) * 100);
  const db = await getDb();
  await db.execute(sql`
    UPDATE branches
    SET pickup_mode = ${pickup}, delivery_mode = ${delivery}, delivery_fee_minor = ${Number.isFinite(fee) ? fee : null}, updated_at = now()
    WHERE id = ${branchId}
  `);
  await db.execute(sql`
    INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, branch_id, metadata)
    VALUES (${crypto.randomUUID()}, ${actor.id}, 'branch.service_update', 'branch', ${branchId}, ${branchId}, ${JSON.stringify({ pickup, delivery })}::jsonb)
  `);
  redirect(`/${locale}/admin/branches`);
}

export async function availabilityAction(formData: FormData) {
  const locale = String(formData.get("locale") || "en");
  const actor = await actorOrRedirect(locale);
  const itemId = String(formData.get("itemId") || "");
  const db = await getDb();
  const item = await rows<{ branch_id: string; is_available: boolean }>(await db.execute(sql`SELECT branch_id, is_available FROM menu_items WHERE id = ${itemId}`));
  if (!item[0] || !canManageMenu(actor, item[0].branch_id)) redirect(`/${locale}/admin?error=forbidden`);
  await db.execute(sql`UPDATE menu_items SET is_available = ${!item[0].is_available} WHERE id = ${itemId}`);
  await db.execute(sql`
    INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, branch_id)
    VALUES (${crypto.randomUUID()}, ${actor.id}, 'menu.availability', 'menu_item', ${itemId}, ${item[0].branch_id})
  `);
  redirect(`/${locale}/admin/menu`);
}

export async function approveMenuAction(formData: FormData) {
  const locale = String(formData.get("locale") || "en");
  const actor = await actorOrRedirect(locale);
  if (!canManageBusiness(actor)) redirect(`/${locale}/admin?error=forbidden`);
  const menuId = String(formData.get("menuId") || "");
  const db = await getDb();
  await db.execute(sql`UPDATE menus SET review_status = 'approved' WHERE id = ${menuId}`);
  await db.execute(sql`UPDATE menu_items SET review_status = 'approved' WHERE menu_id = ${menuId} AND review_status = 'pending_review'`);
  await db.execute(sql`
    INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id)
    VALUES (${crypto.randomUUID()}, ${actor.id}, 'menu.approve', 'menu', ${menuId})
  `);
  redirect(`/${locale}/admin/menu`);
}

const staffSchema = z.object({
  locale: z.enum(["en", "ar"]),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(10).max(200),
  role: z.enum(["branch_admin", "employee", "driver"]),
  branchId: z.string().min(1),
});

export async function createStaffAction(formData: FormData) {
  const parsed = staffSchema.safeParse({
    locale: formData.get("locale"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    branchId: formData.get("branchId"),
  });
  if (!parsed.success) redirect("/en/admin/staff");
  const actor = await actorOrRedirect(parsed.data.locale);
  if (!canManageStaff(actor, parsed.data.branchId)) redirect(`/${parsed.data.locale}/admin?error=forbidden`);
  if (actor.role === "branch_admin" && parsed.data.role === "branch_admin") redirect(`/${parsed.data.locale}/admin/staff`);
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.execute(sql`
    INSERT INTO users (id, email, name, password_hash, role)
    VALUES (${id}, ${parsed.data.email.toLowerCase()}, ${parsed.data.name}, ${await hashPassword(parsed.data.password)}, ${parsed.data.role})
  `);
  await db.execute(sql`INSERT INTO user_branches (user_id, branch_id) VALUES (${id}, ${parsed.data.branchId})`);
  await db.execute(sql`
    INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, branch_id, metadata)
    VALUES (${crypto.randomUUID()}, ${actor.id}, 'user.create', 'user', ${id}, ${parsed.data.branchId}, ${JSON.stringify({ role: parsed.data.role })}::jsonb)
  `);
  redirect(`/${parsed.data.locale}/admin/staff`);
}

export async function shiftAction(formData: FormData) {
  const locale = String(formData.get("locale") || "en");
  const actor = await actorOrRedirect(locale);
  const branchId = String(formData.get("branchId") || actor.branchIds[0] || "");
  if (!canAccessBranch(actor, branchId) || actor.role === "customer") redirect(`/${locale}/admin?error=forbidden`);
  const db = await getDb();
  const open = await rows<{ id: string }>(await db.execute(sql`SELECT id FROM shifts WHERE user_id = ${actor.id} AND ended_at IS NULL LIMIT 1`));
  if (open[0]) {
    await db.execute(sql`UPDATE shifts SET ended_at = now() WHERE id = ${open[0].id}`);
  } else {
    await db.execute(sql`INSERT INTO shifts (id, user_id, branch_id) VALUES (${crypto.randomUUID()}, ${actor.id}, ${branchId})`);
  }
  redirect(`/${locale}/admin`);
}

export async function assignDriverAction(formData: FormData) {
  const locale = String(formData.get("locale") || "en");
  const actor = await actorOrRedirect(locale);
  const orderId = String(formData.get("orderId") || "");
  const driverId = String(formData.get("driverId") || "");
  const db = await getDb();
  const order = await rows<{ branch_id: string }>(await db.execute(sql`SELECT branch_id FROM orders WHERE id = ${orderId}`));
  if (!order[0] || !canProcessOrders(actor, order[0].branch_id)) redirect(`/${locale}/admin?error=forbidden`);
  await db.execute(sql`UPDATE driver_assignments SET active = false, unassigned_at = now() WHERE order_id = ${orderId} AND active = true`);
  await db.execute(sql`
    INSERT INTO driver_assignments (id, order_id, driver_user_id, assigned_by)
    VALUES (${crypto.randomUUID()}, ${orderId}, ${driverId}, ${actor.id})
  `);
  redirect(`/${locale}/admin/orders`);
}

export async function locationAction(input: { orderId: string; consent: boolean; latitude: number; longitude: number; accuracy?: number }) {
  const actor = await getActor();
  if (!actor) return { ok: false as const, error: "auth" };
  const db = await getDb();
  const order = await rows<{ branch_id: string; fulfillment_status: string }>(await db.execute(sql`SELECT branch_id, fulfillment_status FROM orders WHERE id = ${input.orderId}`));
  const assignment = await rows<{ id: string }>(await db.execute(sql`
    SELECT id FROM driver_assignments WHERE order_id = ${input.orderId} AND driver_user_id = ${actor.id} AND active = true LIMIT 1
  `));
  const shift = await rows<{ id: string }>(await db.execute(sql`SELECT id FROM shifts WHERE user_id = ${actor.id} AND ended_at IS NULL LIMIT 1`));
  const allowed = order[0] && canDrive(actor, order[0].branch_id) && canRecordDriverLocation({
    consent: input.consent,
    role: actor.role,
    assignmentActive: Boolean(assignment[0]),
    fulfillmentStatus: order[0].fulfillment_status,
    shiftOpen: Boolean(shift[0]),
  });
  if (!allowed || !assignment[0]) return { ok: false as const, error: "location_denied" };
  const cutoff = new Date(Date.now() - locationRetentionDays() * 24 * 60 * 60 * 1000);
  await db.execute(sql`DELETE FROM driver_locations WHERE recorded_at < ${cutoff}`);
  await db.execute(sql`
    INSERT INTO driver_locations (id, assignment_id, driver_user_id, order_id, latitude, longitude, accuracy_meters)
    VALUES (${crypto.randomUUID()}, ${assignment[0].id}, ${actor.id}, ${input.orderId}, ${roundCoordinate(input.latitude)}, ${roundCoordinate(input.longitude)}, ${input.accuracy ?? null})
  `);
  return { ok: true as const };
}
