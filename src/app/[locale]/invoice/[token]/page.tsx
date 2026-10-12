import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { hashSecret } from "@/lib/auth";
import { formatMinor } from "@/domain/money";
import { isLocale } from "@/i18n/copy";

export default async function InvoicePage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale: raw, token } = await params;
  if (!isLocale(raw)) notFound();
  const db = await getDb();
  const found = await rows<{ snapshot: Record<string, unknown>; invoice_number: number | string }>(await db.execute(sql`
    SELECT invoices.snapshot, invoices.invoice_number
    FROM invoices JOIN orders ON orders.id = invoices.order_id
    WHERE orders.access_token_hash = ${await hashSecret(token)}
  `));
  const invoice = found[0];
  if (!invoice) notFound();
  const snapshot = invoice.snapshot;
  const lines = Array.isArray(snapshot.lines) ? snapshot.lines as Array<Record<string, unknown>> : [];
  return (
    <article className="shell hero">
      <h1>Invoice {String(invoice.invoice_number)}</h1>
      <p>Order {String(snapshot.orderNumber)}</p>
      <p>{String((snapshot.contact as { name?: string } | undefined)?.name ?? "")}</p>
      {lines.map((line, index) => <p key={index}>{String(line.name_en)} × {String(line.quantity)} — {formatMinor(Number(line.line_total_minor), raw)}</p>)}
      <p>Total {formatMinor(Number(snapshot.totalMinor), raw)}</p>
      <p>{String(snapshot.disclaimer ?? "")}</p>
      <p>{String(snapshot.vatNote ?? "")}</p>
    </article>
  );
}
