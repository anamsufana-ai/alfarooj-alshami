import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { copy, isLocale } from "@/i18n/copy";

export default async function EmiratePage({ params }: { params: Promise<{ locale: string; emirate: string }> }) {
  const { locale: raw, emirate } = await params;
  if (!isLocale(raw)) notFound();
  const text = copy(raw);
  const db = await getDb();
  const city = await rows<{ id: string; name_en: string; name_ar: string }>(
    await db.execute(sql`SELECT id, name_en, name_ar FROM emirates WHERE id = ${emirate}`),
  );
  if (!city[0]) notFound();
  const branches = await rows<{ slug: string; name_en: string; name_ar: string; phones: string[] }>(
    await db.execute(sql`SELECT slug, name_en, name_ar, phones FROM branches WHERE emirate_id = ${emirate} AND is_active = true ORDER BY name_en`),
  );
  return (
    <section className="shell hero">
      <h1>{raw === "ar" ? city[0].name_ar : city[0].name_en}</h1>
      <div className="cards">
        {branches.map((branch) => (
          <Link key={branch.slug} className="card" href={`/${raw}/branch/${branch.slug}`}>
            <strong>{raw === "ar" ? branch.name_ar : branch.name_en}</strong>
            <span>{raw === "ar" ? branch.name_en : branch.name_ar}</span>
            <span>{text.phone}: {(branch.phones ?? []).join(" · ")}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
