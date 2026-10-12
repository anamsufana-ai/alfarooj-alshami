import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { isStaff } from "@/domain/permissions";
import { integrationReport } from "@/lib/config";
import { databaseMode } from "@/db/client";
import { getActor } from "@/lib/auth";
import { copy, isLocale } from "@/i18n/copy";
import { shiftAction } from "@/server/admin-actions";

export default async function AdminHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const actor = await getActor();
  if (!actor) redirect(`/${raw}/login`);
  if (!isStaff(actor.role)) redirect(`/${raw}/account`);
  const text = copy(raw);
  const db = await getDb();
  const open = await rows<{ id: string }>(await db.execute(sql`SELECT id FROM shifts WHERE user_id = ${actor.id} AND ended_at IS NULL`));
  const report = integrationReport(databaseMode());
  return (
    <section className="shell hero">
      <h1>{text.admin}</h1>
      <nav>
        <Link href={`/${raw}/admin/orders`}>{text.orders}</Link>
        <Link href={`/${raw}/admin/reports`}>{text.reports}</Link>
        <Link href={`/${raw}/admin/branches`}>{text.branches}</Link>
        <Link href={`/${raw}/admin/menu`}>{text.menuAdmin}</Link>
        <Link href={`/${raw}/admin/staff`}>{text.staff}</Link>
      </nav>
      <form action={shiftAction}>
        <input type="hidden" name="locale" value={raw} />
        <button>{open[0] ? text.clockOut : text.clockIn}</button>
      </form>
      <h2>Integrations</h2>
      <ul>
        {Object.entries(report).map(([key, value]) => <li key={key}>{key}: {value}</li>)}
      </ul>
      <p>Email, SMS, maps, and file storage are not sending or displaying live data until each provider is configured and verified.</p>
    </section>
  );
}
