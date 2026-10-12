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
    <>
      <section className="home-hero">
        <img className="hero-photo" src="/brand/hero-rigga.png" alt={text.heroAlt} />
        <div className="home-hero-copy shell">
          <p className="eyebrow light">{text.eyebrow}</p>
          <img className="hero-logo" src="/brand/logo.png" alt="" />
          <h1>{text.brand}</h1>
          <p className="hero-caption">{text.heroCaption}</p>
          <p className="lede">{text.lead}</p>
          <div className="hero-actions">
            <a className="btn" href="#cities">{text.chooseCity}</a>
            <Link className="btn ghost" href={`/${raw}/cart`}>{text.cart}</Link>
          </div>
        </div>
      </section>
      <section id="cities" className="shell section">
        <p className="eyebrow">{text.chooseCity}</p>
        <h2>{text.citiesLead}</h2>
        <div className="cities">
          {emirates.map((emirate) => (
            <Link key={emirate.id} className="city" href={`/${raw}/${emirate.id}`}>
              <span>{raw === "ar" ? emirate.name_en : emirate.name_ar}</span>
              <strong>{raw === "ar" ? emirate.name_ar : emirate.name_en}</strong>
            </Link>
          ))}
        </div>
      </section>
      <section className="shell section">
        <div className="steps">
          <article><span>01</span><h3>{text.stepCity}</h3><p>{text.stepCityBody}</p></article>
          <article><span>02</span><h3>{text.stepBranch}</h3><p>{text.stepBranchBody}</p></article>
          <article><span>03</span><h3>{text.stepOrder}</h3><p>{text.stepOrderBody}</p></article>
        </div>
      </section>
      <section className="shell section">
        <p className="eyebrow">{text.galleryTitle}</p>
        <h2>{text.galleryLead}</h2>
        <div className="gallery">
          <img src="/brand/dish-grill.jpg" alt={text.dishGrillAlt} />
          <img src="/brand/dish-chicken.jpg" alt={text.dishChickenAlt} />
          <img src="/brand/dish-arais.jpg" alt={text.dishAraisAlt} />
        </div>
      </section>
    </>
  );
}
