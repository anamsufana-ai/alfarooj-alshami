import { notFound, redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { canManageMenu, isStaff } from "@/domain/permissions";
import { getActor } from "@/lib/auth";
import { copy, isLocale } from "@/i18n/copy";
import { approveMenuAction, availabilityAction } from "@/server/admin-actions";

export default async function MenuAdmin({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) redirect(`/${raw}/login`);
  const text = copy(raw);
  const db = await getDb();
  const menus = await rows<{ id: string; branch_id: string; source_filename: string; review_status: string; name_en: string }>(
    await db.execute(sql`SELECT m.id, m.branch_id, m.source_filename, m.review_status, b.name_en FROM menus m JOIN branches b ON b.id = m.branch_id`),
  );
  const items = await rows<{ id: string; branch_id: string; name_en: string; is_available: boolean; review_status: string }>(
    await db.execute(sql`SELECT id, branch_id, name_en, is_available, review_status FROM menu_items ORDER BY name_en LIMIT 80`),
  );
  return (
    <section className="shell hero">
      <h1>{text.menuAdmin}</h1>
      <p>{text.reviewBanner}</p>
      {menus.filter((menu) => actor.role === "business_admin" || actor.branchIds.includes(menu.branch_id)).map((menu) => (
        <form key={menu.id} action={approveMenuAction}>
          <p>{menu.name_en}: {menu.source_filename} ({menu.review_status})</p>
          <input type="hidden" name="locale" value={raw} />
          <input type="hidden" name="menuId" value={menu.id} />
          {actor.role === "business_admin" ? <button>Mark reviewed items approved</button> : null}
        </form>
      ))}
      <table>
        <tbody>
          {items.filter((item) => canManageMenu(actor, item.branch_id)).map((item) => (
            <tr key={item.id}>
              <td>{item.name_en}</td>
              <td>{item.review_status}</td>
              <td>
                <form action={availabilityAction}>
                  <input type="hidden" name="locale" value={raw} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <button>{item.is_available ? "Hide" : "Show"}</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
