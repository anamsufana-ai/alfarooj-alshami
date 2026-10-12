import { notFound, redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { canProcessOrders, isStaff } from "@/domain/permissions";
import { FULFILLMENT_STATUSES, canTransition, type FulfillmentStatus, type FulfillmentType } from "@/domain/transitions";
import { formatMinor } from "@/domain/money";
import { getActor } from "@/lib/auth";
import { copy, isLocale } from "@/i18n/copy";
import { assignDriverAction, transitionAction } from "@/server/admin-actions";

export default async function OrdersAdmin({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) redirect(`/${raw}/login`);
  const text = copy(raw);
  const db = await getDb();
  const orders = await rows<{
    id: string; public_number: number | string; branch_id: string; branch_name: string; contact_name: string;
    fulfillment_status: FulfillmentStatus; fulfillment_type: FulfillmentType; payment_status: string; total_minor: number;
  }>(await db.execute(sql`
    SELECT o.id, o.public_number, o.branch_id, b.name_en AS branch_name, o.contact_name, o.fulfillment_status,
           o.fulfillment_type, o.payment_status, o.total_minor
    FROM orders o JOIN branches b ON b.id = o.branch_id
    ORDER BY o.created_at DESC
    LIMIT 100
  `));
  const visible = orders.filter((order) => actor.role === "business_admin" || actor.branchIds.includes(order.branch_id));
  const drivers = await rows<{ id: string; name: string; branch_id: string }>(await db.execute(sql`
    SELECT users.id, users.name, user_branches.branch_id
    FROM users JOIN user_branches ON user_branches.user_id = users.id
    WHERE users.role = 'driver' AND users.disabled_at IS NULL
  `));
  return (
    <section className="shell hero">
      <h1>{text.orders}</h1>
      {visible.length === 0 ? <p>{text.emptyOrders}</p> : null}
      <table>
        <tbody>
          {visible.map((order) => (
            <tr key={order.id}>
              <td>{String(order.public_number)}<br />{order.branch_name}<br />{order.contact_name}</td>
              <td>{order.fulfillment_status}<br />{order.payment_status}<br />{formatMinor(order.total_minor, raw)}</td>
              <td>
                {canProcessOrders(actor, order.branch_id) ? FULFILLMENT_STATUSES.filter((status) => canTransition({
                  from: order.fulfillment_status,
                  to: status,
                  actor: "staff",
                  fulfillmentType: order.fulfillment_type,
                })).map((status) => (
                  <form key={status} action={transitionAction}>
                    <input type="hidden" name="locale" value={raw} />
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="to" value={status} />
                    <button>{status}</button>
                  </form>
                )) : null}
                <form action={assignDriverAction}>
                  <input type="hidden" name="locale" value={raw} />
                  <input type="hidden" name="orderId" value={order.id} />
                  <select name="driverId">
                    {drivers.filter((driver) => driver.branch_id === order.branch_id).map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                  </select>
                  <button>{text.assign}</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
