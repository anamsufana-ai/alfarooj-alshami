import { notFound, redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { canViewReports, isStaff } from "@/domain/permissions";
import { dubaiDateString, periodRange, type PeriodKind } from "@/domain/periods";
import { formatMinor } from "@/domain/money";
import { summarizeOrders, type ReportOrder } from "@/domain/reports";
import { getActor } from "@/lib/auth";
import { copy, isLocale } from "@/i18n/copy";

export default async function ReportsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ period?: string; date?: string; branch?: string }> }) {
  const { locale: raw } = await params;
  const query = await searchParams;
  if (!isLocale(raw)) notFound();
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) redirect(`/${raw}/login`);
  const text = copy(raw);
  const period = (query.period ?? "day") as PeriodKind;
  const date = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : dubaiDateString(new Date());
  const requested = query.branch && query.branch !== "all" ? query.branch : null;
  const branchId = actor.role === "business_admin" ? requested : (requested && actor.branchIds.includes(requested) ? requested : actor.branchIds[0] ?? null);
  if (actor.role !== "business_admin" && !branchId) redirect(`/${raw}/admin?error=forbidden`);
  if (!canViewReports(actor, branchId) && actor.role !== "business_admin") redirect(`/${raw}/admin?error=forbidden`);
  const range = periodRange(period === "range" ? "day" : period, date);
  const db = await getDb();
  const scoped = actor.role === "business_admin" ? branchId : (branchId ?? actor.branchIds[0]);
  const data = await rows<Record<string, unknown>>(await db.execute(sql`
    SELECT branch_id, payment_status, fulfillment_status, subtotal_minor, discount_minor,
           delivery_fee_minor, included_vat_minor, total_minor
    FROM orders
    WHERE created_at >= ${range.start} AND created_at < ${range.end}
      AND (${scoped}::text IS NULL OR branch_id = ${scoped})
  `));
  const mapped = data.map((row) => ({
    branch_id: String(row.branch_id),
    paymentStatus: String(row.payment_status) as ReportOrder["paymentStatus"],
    fulfillmentStatus: String(row.fulfillment_status),
    subtotalMinor: Number(row.subtotal_minor),
    discountMinor: Number(row.discount_minor),
    deliveryFeeMinor: Number(row.delivery_fee_minor),
    includedVatMinor: row.included_vat_minor == null ? null : Number(row.included_vat_minor),
    totalMinor: Number(row.total_minor),
  }));
  const visible = actor.role === "business_admin" ? mapped : mapped.filter((row) => actor.branchIds.includes(row.branch_id));
  const totals = summarizeOrders(visible);
  const branches = await rows<{ id: string; name_en: string }>(await db.execute(sql`SELECT id, name_en FROM branches ORDER BY name_en`));
  return (
    <section className="shell hero">
      <h1>{text.reports}</h1>
      <p>{text.formula}</p>
      <form>
        <label>Period
          <select name="period" defaultValue={period}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </label>
        <label>Date<input name="date" type="date" defaultValue={date} /></label>
        {actor.role === "business_admin" ? (
          <label>Branch
            <select name="branch" defaultValue={branchId ?? "all"}>
              <option value="all">All branches</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name_en}</option>)}
            </select>
          </label>
        ) : null}
        <button>{text.save}</button>
      </form>
      <ul>
        <li>{text.placed}: {totals.placedCount}</li>
        <li>{text.paidOrders}: {totals.paidCount}</li>
        <li>{text.gross}: {formatMinor(totals.grossSalesMinor, raw)}</li>
        <li>{text.refunds}: {formatMinor(totals.refundsMinor, raw)}</li>
        <li>{text.net}: {formatMinor(totals.netMinor, raw)}</li>
        <li>{text.includedVat}: {formatMinor(totals.includedVatMinor, raw)}</li>
      </ul>
      <p><a href={`/api/reports/export?period=${period}&date=${date}${branchId ? `&branch=${branchId}` : ""}`}>CSV</a></p>
    </section>
  );
}
