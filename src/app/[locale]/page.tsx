import Link from "next/link";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { copy, isLocale } from "@/i18n/copy";
import { notFound } from "next/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const text = copy(raw);
  const db = await getDb();
  const emirates = await rows<{ id: string; name_en: string; name_ar: string }>(
    await db.execute(sql`SELECT id, name_en, name_ar FROM emirates ORDER BY sort_order`),
  );
  return (
    <section className="shell hero">
      <div className="home-hero">
        <img className="hero-photo" src="/brand/hero-rigga.png" alt={text.heroAlt} />
        <div className="home-hero-copy">
          <img className="hero-logo" src="/brand/logo.png" alt="" />
          <h1>{text.brand}</h1>
          <p className="hero-caption">{text.heroCaption}</p>
          <p>{text.lead}</p>
        </div>
      </div>
      <h2>{text.chooseCity}</h2>
      <div className="cities">
        {emirates.map((emirate) => (
          <Link key={emirate.id} className="city" href={`/${raw}/${emirate.id}`}>
            <span>{raw === "ar" ? emirate.name_en : emirate.name_ar}</span>
            <strong>{raw === "ar" ? emirate.name_ar : emirate.name_en}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
