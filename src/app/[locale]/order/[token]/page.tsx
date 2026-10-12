import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { hashSecret } from "@/lib/auth";
import { formatMinor } from "@/domain/money";
import { copy, isLocale } from "@/i18n/copy";
import { syncCheckoutSession } from "@/server/payments";
import { OrderRefresh } from "@/components/order-refresh";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ locale: string; token: string }>; searchParams: Promise<{ session_id?: string }> }) {
  const { locale: raw, token } = await params;
  const query = await searchParams;
  if (!isLocale(raw)) notFound();
  const text = copy(raw);
  const db = await getDb();
  if (query.session_id) await syncCheckoutSession(db, query.session_id);
  const found = await rows<{
    id: string; public_number: number | string; payment_status: string; fulfillment_status: string;
    total_minor: number; vat_note: string | null; included_vat_minor: number | null; contact_name: string; updated_at: string;
  }>(await db.execute(sql`
    SELECT id, public_number, payment_status, fulfillment_status, total_minor, vat_note, included_vat_minor, contact_name, updated_at
    FROM orders WHERE access_token_hash = ${await hashSecret(token)}
  `));
  const order = found[0];
  if (!order) notFound();
  const invoice = await rows<{ invoice_number: number | string }>(await db.execute(sql`SELECT invoice_number FROM invoices WHERE order_id = ${order.id}`));
  const location = await rows<{ recorded_at: string }>(await db.execute(sql`
    SELECT recorded_at FROM driver_locations WHERE order_id = ${order.id} ORDER BY recorded_at DESC LIMIT 1
  `));
  return (
    <section className="shell hero">
      <h1>{text.orderNumber} {String(order.public_number)}</h1>
      <p>{order.contact_name}</p>
      <p>{text.status}: {order.fulfillment_status} / {order.payment_status}</p>
      <p>{text.total}: {formatMinor(order.total_minor, raw)}</p>
      {order.included_vat_minor != null ? <p>{text.includedVat}: {formatMinor(order.included_vat_minor, raw)}. {text.notTaxInvoice}</p> : null}
      {order.payment_status !== "paid" ? <p className="notice">{text.paymentPending}</p> : null}
      {location[0] ? <p>{text.lastUpdate}: {new Date(location[0].recorded_at).toLocaleString(raw === "ar" ? "ar" : "en", { timeZone: "Asia/Dubai" })}</p> : null}
      <p>{text.noLiveMap}</p>
      {invoice[0] ? <p><Link href={`/${raw}/invoice/${token}`}>{text.invoice} {String(invoice[0].invoice_number)}</Link></p> : null}
      <OrderRefresh />
    </section>
  );
}
