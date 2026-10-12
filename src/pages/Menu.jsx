import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "../components/Icon";
import { BranchSwitch } from "../components/Layout";
import PageBanner from "../components/PageBanner";
import { aed, categoriesFor, categoryPhotos, itemsFor, offersFor, photoCategories } from "../data";
import { useLang } from "../i18n";
import { money } from "../pricing";
import { useCafe } from "../store";

function Stepper({ entry }) {
  const { lineQty, addItem, setQty } = useCafe();
  const { t, itemName } = useLang();
  const name = itemName(entry);
  const qty = lineQty(entry.id);
  if (!qty) {
    return (
      <button type="button" className="add-button" onClick={() => addItem(entry)} aria-label={t("Add {name}", { name })}>
        +
      </button>
    );
  }
  return (
    <div className="qty">
      <button type="button" onClick={() => setQty(entry.id, qty - 1)} aria-label={t("Remove one {name}", { name })}>
        −
      </button>
      <span>{qty}</span>
      <button type="button" onClick={() => setQty(entry.id, qty + 1)} aria-label={t("Add one {name}", { name })}>
        +
      </button>
    </div>
  );
}

export default function Menu() {
  const { location, locationId, cart, count, sums } = useCafe();
  const { t, isAr, itemName, lineName } = useLang();
  const { hash } = useLocation();
  const [query, setQuery] = useState("");
  const items = itemsFor(locationId);
  const categories = categoriesFor(locationId);
  const branchOffers = offersFor(locationId);
  const subtotal = sums("pickup").items;

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hit = (entry) =>
      !q || entry.name.toLowerCase().includes(q) || (entry.ar || "").includes(q) || t(entry.name).includes(q);
    const list = [];
    const offerHits = branchOffers.filter(hit);
    if (offerHits.length) list.push({ id: "offers", name: "Daily offers", ar: "العروض اليومية", items: offerHits });
    for (const category of categories) {
      const found = items.filter((item) => item.category === category.id && hit(item));
      if (found.length) list.push({ ...category, items: found });
    }
    return list;
  }, [query, items, categories, branchOffers, t]);

  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, locationId]);

  return (
    <>
      <PageBanner
        photo={location.hero}
        eyebrow={t("Order online · delivery or pickup")}
        title={t("{branch} menu", { branch: isAr ? location.ar : location.name })}
      >
        <p>
          {isAr ? location.addressAr : location.address}
          {location.hours && ` · ${t(location.hours)}`} ·{" "}
          <a href={location.phoneHref} dir="ltr">
            {location.phone}
          </a>
        </p>
        <BranchSwitch />
      </PageBanner>
      <section className="page menu-page">
        <div className="menu-tools">
          <label className="search">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder={t("Search shawarma, hummus, kebab…")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={t("Search the menu")}
            />
          </label>
          <nav className="chip-bar" aria-label={t("Menu sections")}>
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="chip">
                {isAr ? section.ar : section.name}
              </a>
            ))}
          </nav>
        </div>

        <div className="menu-layout">
          <div className="menu-sections">
            {sections.length === 0 && <p className="empty">{t("Nothing matches “{query}”. Try another word.", { query })}</p>}
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="menu-section">
                <header
                  className={photoCategories.has(section.id) ? "section-banner" : "section-banner no-photo"}
                  style={photoCategories.has(section.id) ? { "--hero": `url(${categoryPhotos[section.id]})` } : undefined}
                >
                  <h2>
                    {isAr ? section.ar : section.name} <small>{isAr ? section.name : section.ar}</small>
                  </h2>
                  <span>
                    {section.items.length === 1
                      ? t("1 item")
                      : t("{count} items", { count: section.items.length })}
                  </span>
                </header>
                <ul className="item-list">
                  {section.items.map((entry) => (
                    <li key={entry.id} className="item-row">
                      <div className="item-text">
                        <strong>{entry.kicker ? t(entry.name) : itemName(entry)}</strong>
                        {!entry.kicker && entry.ar && <span className="item-ar">{isAr ? entry.name : entry.ar}</span>}
                        {(entry.note || entry.detail) && <span className="item-note">{t(entry.note || entry.detail)}</span>}
                        {entry.kicker && <span className="item-note">{t(entry.kicker)}</span>}
                      </div>
                      <div className="item-buy">
                        <span className="price">{aed(entry.price)}</span>
                        <Stepper entry={entry} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <p className="muted small">
              {t(
                "Prices are as printed on the branch menu and include 5% VAT. If a dish is not available today, the branch will call you before preparing your order.",
              )}
            </p>
          </div>

          <aside className="basket-panel" aria-label={t("Your basket")}>
            <h2>{t("Your basket")}</h2>
            {cart.length === 0 ? (
              <p className="muted">{t("Your basket is empty. Tap + to add items.")}</p>
            ) : (
              <>
                <ul className="mini-lines">
                  {cart.map((line) => (
                    <li key={line.id}>
                      <span>
                        {line.qty} × {lineName(line)}
                      </span>
                      <span>{aed(line.qty * line.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mini-total">
                  <span>{t("Subtotal")}</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <Link className="btn solid block" to="/checkout">
                  {t("Go to checkout")}
                </Link>
              </>
            )}
          </aside>
        </div>

        {count > 0 && (
          <Link className="basket-bar" to="/checkout">
            <span className="basket-bar-count">{count}</span>
            <span>{t("View basket")}</span>
            <strong>{money(subtotal)}</strong>
          </Link>
        )}
      </section>
    </>
  );
}

