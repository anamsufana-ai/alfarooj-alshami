import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { LogoutButton } from "@/components/auth-forms";
import { getDb, rows } from "@/db/client";
import { formatMinor } from "@/domain/money";
import { getActor } from "@/lib/auth";
import { copy, isLocale } from "@/i18n/copy";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const actor = await getActor();
  if (!actor) redirect(`/${raw}/login`);
  const text = copy(raw);
  const db = await getDb();
  const user = await rows<{ name: string; email: string; phone: string | null }>(await db.execute(sql`SELECT name, email, phone FROM users WHERE id = ${actor.id}`));
  const orders = actor.role === "customer"
    ? await rows<{ public_number: number | string; fulfillment_status: string; payment_status: string; total_minor: number; created_at: string }>(
      await db.execute(sql`SELECT public_number, fulfillment_status, payment_status, total_minor, created_at FROM orders WHERE customer_user_id = ${actor.id} ORDER BY created_at DESC`),
    )
    : [];
  const addresses = await rows<{ id: string; line1: string; emirate_id: string | null }>(await db.execute(sql`SELECT id, line1, emirate_id FROM addresses WHERE user_id = ${actor.id}`));
  return (
    <section className="shell hero">
      <h1>{user[0]?.name}</h1>
      <p>{user[0]?.email}</p>
      <LogoutButton locale={raw} />
      <h2>{text.orders}</h2>
      {orders.length === 0 ? <p>{text.emptyOrders}</p> : orders.map((order) => (
        <p key={String(order.public_number)}>{text.orderNumber} {String(order.public_number)} — {order.fulfillment_status} / {order.payment_status} — {formatMinor(order.total_minor, raw)}</p>
      ))}
      <h2>{text.address}</h2>
      <AddressForm locale={raw} />
      {addresses.map((address) => <p key={address.id}>{address.emirate_id}: {address.line1}</p>)}
      <p><Link href={`/${raw}/register`}>{text.register}</Link></p>
    </section>
  );
}

function AddressForm({ locale }: { locale: "en" | "ar" }) {
  const text = copy(locale);
  return (
    <form className="panel" action={saveAddress}>
      <input type="hidden" name="locale" value={locale} />
      <label>{text.emirate}
        <select name="emirate" required defaultValue="dubai">
          <option value="dubai">Dubai</option>
          <option value="sharjah">Sharjah</option>
          <option value="ajman">Ajman</option>
        </select>
      </label>
      <label>{text.address}<input name="line1" required /></label>
      <button>{text.save}</button>
    </form>
  );
}

async function saveAddress(formData: FormData) {
  "use server";
  const { getActor } = await import("@/lib/auth");
  const { getDb } = await import("@/db/client");
  const { sql } = await import("drizzle-orm");
  const { redirect } = await import("next/navigation");
  const actor = await getActor();
  const locale = String(formData.get("locale") || "en");
  if (!actor) {
    redirect(`/${locale}/login`);
    return;
  }
  const db = await getDb();
  await db.execute(sql`
    INSERT INTO addresses (id, user_id, emirate_id, line1)
    VALUES (${crypto.randomUUID()}, ${actor.id}, ${String(formData.get("emirate") || "")}, ${String(formData.get("line1") || "")})
  `);
  redirect(`/${locale}/account`);
}
