import { notFound } from "next/navigation";
import { databaseMode } from "@/db/client";
import { getDb, rows } from "@/db/client";
import { sql } from "drizzle-orm";
import { getActor } from "@/lib/auth";
import { isLocale } from "@/i18n/copy";
import { SiteHeader } from "@/components/site-header";
import { copy } from "@/i18n/copy";

export const dynamic = "force-dynamic";

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const text = copy(raw);
  if (databaseMode() === "missing") {
    return (
      <main id="main" className="shell">
        <h1>{text.brand}</h1>
        <p className="notice warn">DATABASE_URL is required on Netlify. Local development can use the embedded database when that variable is empty and the site is not running on Netlify.</p>
      </main>
    );
  }
  let actor = null;
  let needsSetup = false;
  try {
    actor = await getActor();
    const db = await getDb();
    const count = await rows<{ count: number | string }>(await db.execute(sql`SELECT count(*) AS count FROM users`));
    needsSetup = Number(count[0]?.count ?? 0) === 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return <main id="main" className="shell"><p className="notice warn">{message}</p></main>;
  }
  return (
    <>
      <a className="skip" href="#main">{text.skip}</a>
      <SiteHeader locale={raw} actor={actor} needsSetup={needsSetup} />
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="shell footer-grid">
          <div>
            <img className="footer-logo" src="/brand/logo.png" alt="" />
            <p>{text.brand}</p>
            <p>{text.brandAr}</p>
          </div>
          <div>
            <p className="eyebrow">{text.official}</p>
            <a href="https://www.alfaroojalshamirestaurant.ae/">alfaroojalshamirestaurant.ae</a>
          </div>
        </div>
      </footer>
    </>
  );
}
