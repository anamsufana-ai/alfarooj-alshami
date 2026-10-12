import { notFound, redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { SetupForm } from "@/components/auth-forms";
import { getDb, rows } from "@/db/client";
import { copy, isLocale } from "@/i18n/copy";

export default async function SetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const db = await getDb();
  const count = await rows<{ count: number | string }>(await db.execute(sql`SELECT count(*) AS count FROM users`));
  if (Number(count[0]?.count ?? 0) > 0) redirect(`/${raw}/login`);
  return (
    <section className="shell hero">
      <h1>{copy(raw).setup}</h1>
      <p>This screen closes after the first business admin exists. Password reset email is not configured.</p>
      <SetupForm locale={raw} />
    </section>
  );
}
