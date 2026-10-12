import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/db/client";
import { menuPageCounts } from "@/data/menus";
import { formatMinor } from "@/domain/money";
import { copy, isLocale } from "@/i18n/copy";
import { MenuBoard, type MenuCard } from "@/components/menu-board";
import { showUnreviewed } from "@/server/orders";

type Branch = {
  id: string;
  name_en: string;
  name_ar: string;
  phones: string[];
  published_location_en: string | null;
  published_location_ar: string | null;
  location_precision: string;
  address_conflict_note_en: string | null;
  address_conflict_note_ar: string | null;
  delivery_mode: string;
  pickup_mode: string;
  hours_status: string;
  hours_note_en: string | null;
  hours_note_ar: string | null;
  source_note_en: string | null;
};

export default async function BranchPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const text = copy(raw);
  const db = await getDb();
  const found = await rows<Branch>(await db.execute(sql`
    SELECT id, name_en, name_ar, phones, published_location_en, published_location_ar, location_precision,
           address_conflict_note_en, address_conflict_note_ar, delivery_mode, pickup_mode, hours_status,
           hours_note_en, hours_note_ar, source_note_en
    FROM branches WHERE slug = ${slug} AND is_active = true
  `));
  const branch = found[0];
  if (!branch) notFound();
  const pending = await showUnreviewed(db);
  const menu = await rows<{ id: string; review_status: string; vat_note_en: string | null }>(
    await db.execute(sql`SELECT id, review_status, vat_note_en FROM menus WHERE branch_id = ${branch.id} LIMIT 1`),
  );
  const rowsItems = await rows<{
    id: string; category_en: string; category_ar: string; name_en: string; name_ar: string;
    description_en: string | null; description_ar: string | null; price_minor: number | null;
    is_available: boolean; review_status: string; extraction_note: string | null; source_page: number | null;
  }>(await db.execute(sql`
    SELECT i.id, c.name_en AS category_en, c.name_ar AS category_ar, i.name_en, i.name_ar, i.description_en,
           i.description_ar, i.price_minor, i.is_available, i.review_status, i.extraction_note, i.source_page
    FROM menu_items i JOIN menu_categories c ON c.id = i.category_id
    WHERE i.branch_id = ${branch.id}
    ORDER BY c.sort_order, i.sort_order
  `));
  const choiceRows = await rows<{ item_id: string; id: string; name_en: string; name_ar: string; absolute_price_minor: number | null }>(
    await db.execute(sql`
      SELECT g.item_id, ch.id, ch.name_en, ch.name_ar, ch.absolute_price_minor
      FROM modifier_choices ch JOIN modifier_groups g ON g.id = ch.group_id
      JOIN menu_items i ON i.id = g.item_id
      WHERE i.branch_id = ${branch.id}
      ORDER BY ch.sort_order
    `),
  );
  const visible = rowsItems.filter((item) => pending || item.review_status === "approved" || item.review_status === "needs_clarification");
  const cards: MenuCard[] = visible.map((item) => ({
    id: item.id,
    categoryEn: item.category_en,
    categoryAr: item.category_ar,
    nameEn: item.name_en,
    nameAr: item.name_ar,
    descriptionEn: item.description_en,
    descriptionAr: item.description_ar,
    priceLabel: item.price_minor == null ? null : formatMinor(item.price_minor, raw),
    available: item.is_available && item.review_status !== "needs_clarification",
    note: item.extraction_note,
    choices: choiceRows.filter((choice) => choice.item_id === item.id).map((choice) => ({
      id: choice.id,
      nameEn: choice.name_en,
      nameAr: choice.name_ar,
      absolutePriceMinor: choice.absolute_price_minor,
    })),
  }));
  const pages = new Set(rowsItems.map((item) => item.source_page).filter((page): page is number => page != null));
  const expected = menu[0] ? menuPageCounts[menu[0].id] : undefined;
  const mapQuery = branch.location_precision === "street_only" ? branch.published_location_en : null;
  return (
    <section className="shell page">
      <header className="page-head">
      <p className="eyebrow">{text.eyebrow}</p>
      <h1>{raw === "ar" ? branch.name_ar : branch.name_en}</h1>
      <p className="muted">{raw === "ar" ? branch.name_en : branch.name_ar}</p>
      <p className="phone-line">{(branch.phones ?? []).map((phone) => <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>)}</p>
      {branch.published_location_en || branch.published_location_ar ? <p>{raw === "ar" ? branch.published_location_ar : branch.published_location_en}</p> : <p>{text.addressMissing}</p>}
      {mapQuery ? <p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}>{text.mapSearch}</a></p> : null}
      <div className="facts">
        <p>{branch.hours_status === "unknown" ? text.hoursUnknown : (raw === "ar" ? branch.hours_note_ar : branch.hours_note_en)}</p>
        <p>{branch.delivery_mode === "printed_free_unconfirmed" ? text.deliveryFreeUnconfirmed : branch.delivery_mode === "printed_fee_unknown" ? text.deliveryFeeUnknown : text.deliveryOff}</p>
        {branch.pickup_mode !== "enabled" ? <p>{text.pickupOff}</p> : null}
      </div>
      {branch.address_conflict_note_en ? <p className="notice">{raw === "ar" ? branch.address_conflict_note_ar : branch.address_conflict_note_en}</p> : null}
      {menu[0]?.review_status !== "approved" ? <p className="notice">{text.pendingMenu}</p> : null}
      {expected && pages.size < expected ? <p className="notice">{text.missingPanels}</p> : null}
      {branch.source_note_en ? <details className="source-note"><summary>{text.official}</summary><p>{branch.source_note_en}</p></details> : null}
      </header>
      {cards.length === 0 ? <p>{text.noItems}</p> : <MenuBoard locale={raw} branchId={branch.id} items={cards} />}
      <p><Link className="btn" href={`/${raw}/cart`}>{text.cart}</Link></p>
    </section>
  );
}
