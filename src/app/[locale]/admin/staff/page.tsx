import { notFound, redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { canManageStaff, isStaff } from "@/domain/permissions";
import { getActor } from "@/lib/auth";
import { copy, isLocale } from "@/i18n/copy";
import { createStaffAction } from "@/server/admin-actions";

export default async function StaffPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) redirect(`/${raw}/login`);
  const text = copy(raw);
  const db = await getDb();
  const branches = await rows<{ id: string; name_en: string }>(await db.execute(sql`SELECT id, name_en FROM branches ORDER BY name_en`));
  const visible = actor.role === "business_admin" ? branches : branches.filter((branch) => canManageStaff(actor, branch.id));
  const people = await rows<{ name: string; email: string; role: string; branch_id: string | null }>(await db.execute(sql`
    SELECT users.name, users.email, users.role, user_branches.branch_id
    FROM users LEFT JOIN user_branches ON user_branches.user_id = users.id
    WHERE users.role <> 'customer'
    ORDER BY users.name
  `));
  return (
    <section className="shell hero">
      <h1>{text.staff}</h1>
      {visible[0] ? (
        <form className="panel" action={createStaffAction}>
          <input type="hidden" name="locale" value={raw} />
          <label>{text.name}<input name="name" required /></label>
          <label>{text.email}<input name="email" type="email" required /></label>
          <label>{text.password}<input name="password" type="password" minLength={10} required /></label>
          <label>{text.role}
            <select name="role">
              {actor.role === "business_admin" ? <option value="branch_admin">branch admin</option> : null}
              <option value="employee">employee</option>
              <option value="driver">driver</option>
            </select>
          </label>
          <label>Branch
            <select name="branchId">{visible.map((branch) => <option key={branch.id} value={branch.id}>{branch.name_en}</option>)}</select>
          </label>
          <button>{text.save}</button>
        </form>
      ) : <p>{text.forbidden}</p>}
      {people.filter((person) => actor.role === "business_admin" || (person.branch_id && actor.branchIds.includes(person.branch_id))).map((person) => (
        <p key={`${person.email}-${person.branch_id}`}>{person.name} — {person.role} — {person.email}</p>
      ))}
    </section>
  );
}
