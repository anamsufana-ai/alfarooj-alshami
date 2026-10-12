import { notFound, redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { isStaff } from "@/domain/permissions";
import { getActor } from "@/lib/auth";
import { copy, isLocale } from "@/i18n/copy";
import { branchConfigAction } from "@/server/admin-actions";

export default async function BranchesAdmin({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) redirect(`/${raw}/login`);
  const db = await getDb();
  const branches = await rows<{ id: string; name_en: string; delivery_mode: string; pickup_mode: string; delivery_fee_minor: number | null }>(
    await db.execute(sql`SELECT id, name_en, delivery_mode, pickup_mode, delivery_fee_minor FROM branches ORDER BY name_en`),
  );
  const visible = actor.role === "business_admin" ? branches : branches.filter((branch) => actor.branchIds.includes(branch.id));
  return (
    <section className="shell hero">
      <h1>{copy(raw).branches}</h1>
      {visible.map((branch) => (
        <form key={branch.id} className="panel" action={branchConfigAction}>
          <h2>{branch.name_en}</h2>
          <input type="hidden" name="locale" value={raw} />
          <input type="hidden" name="branchId" value={branch.id} />
          <label>Delivery mode
            <select name="delivery" defaultValue={branch.delivery_mode}>
              <option value="not_configured">not configured</option>
              <option value="printed_free_unconfirmed">printed free, unconfirmed</option>
              <option value="printed_fee_unknown">printed, fee unknown</option>
              <option value="enabled">enabled</option>
            </select>
          </label>
          <label>Delivery fee AED<input name="fee" defaultValue={branch.delivery_fee_minor == null ? "" : (branch.delivery_fee_minor / 100).toFixed(2)} /></label>
          <label>Pickup
            <select name="pickup" defaultValue={branch.pickup_mode}>
              <option value="not_configured">not configured</option>
              <option value="enabled">enabled</option>
            </select>
          </label>
          <button>{copy(raw).save}</button>
        </form>
      ))}
    </section>
  );
}
