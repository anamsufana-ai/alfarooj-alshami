import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { canViewReports } from "@/domain/permissions";
import { dubaiDateString, periodRange, type PeriodKind } from "@/domain/periods";
import { summarizeOrders, type ReportOrder } from "@/domain/reports";
import { getActor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor) return new Response("Sign in required", { status: 401 });
  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "day") as PeriodKind;
  const date = url.searchParams.get("date") ?? dubaiDateString(new Date());
  const branch = url.searchParams.get("branch");
  if (!canViewReports(actor, branch) && actor.role !== "business_admin") return new Response("Forbidden", { status: 403 });
  const range = periodRange(period === "range" ? "day" : period, date);
  const db = await getDb();
  const data = await rows<Record<string, unknown>>(await db.execute(sql`
    SELECT branch_id, payment_status, fulfillment_status, subtotal_minor, discount_minor,
           delivery_fee_minor, included_vat_minor, total_minor
    FROM orders WHERE created_at >= ${range.start} AND created_at < ${range.end}
  `));
  const mapped: Array<ReportOrder & { branch_id: string }> = data.map((row) => ({
    branch_id: String(row.branch_id),
    paymentStatus: String(row.payment_status) as ReportOrder["paymentStatus"],
    fulfillmentStatus: String(row.fulfillment_status),
    subtotalMinor: Number(row.subtotal_minor),
    discountMinor: Number(row.discount_minor),
    deliveryFeeMinor: Number(row.delivery_fee_minor),
    includedVatMinor: row.included_vat_minor == null ? null : Number(row.included_vat_minor),
    totalMinor: Number(row.total_minor),
  }));
  const visible = actor.role === "business_admin" ? mapped.filter((row) => !branch || row.branch_id === branch) : mapped.filter((row) => actor.branchIds.includes(row.branch_id));
  const totals = summarizeOrders(visible);
  const csv = [
    "metric,minor_units",
    `placed,${totals.placedCount}`,
    `paid,${totals.paidCount}`,
    `gross_sales_minor,${totals.grossSalesMinor}`,
    `refunds_minor,${totals.refundsMinor}`,
    `net_minor,${totals.netMinor}`,
    `included_vat_minor,${totals.includedVatMinor}`,
  ].join("\n");
  return new Response(`\uFEFF${csv}`, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=report.csv" },
  });
}
