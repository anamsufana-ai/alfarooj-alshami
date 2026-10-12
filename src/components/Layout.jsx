import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { locations } from "../data";
import { useLang } from "../i18n";
import { useCafe } from "../store";
import Icon from "./Icon";
import Logo from "./Logo";

const links = [
  ["/menu", "Menu & order"],
  ["/#branches", "Branches"],
  ["/about", "About"],
  ["/contact", "Contact"],
];

export function CartButton() {
  const { count } = useCafe();
  const { t } = useLang();
  return (
    <Link className="cart-button" to="/checkout" aria-label={t("Basket, {count} items", { count })}>
      <Icon name="bag" size={20} />
      <span className="cart-count">{count}</span>
    </Link>
  );
}

export default function Layout() {
  const { toast, user } = useCafe();
  const { t, isAr, toggle } = useLang();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const bare = pathname.startsWith("/invoice/");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overHero = pathname === "/" && !scrolled && !open;

  if (bare) return <Outlet />;

  return (
    <>
      <a className="skip" href="#content">
        {t("Skip to content")}
      </a>
      <header className={overHero ? "site-header over-hero" : "site-header"}>
        <Link className="brand" to="/" aria-label={t("Al Farooj Al Shami home")} onClick={() => setOpen(false)}>
          <Logo decorative />
          <span>
            <strong>{t("Al Farooj Al Shami")}</strong>
            <small className="arabic">مطعم الفروج الشامي</small>
          </span>
        </Link>
        <nav id="primary-nav" className={open ? "primary-nav open" : "primary-nav"} aria-label={t("Primary")}>
          {links.map(([to, label]) =>
            to.includes("#") ? (
              <Link key={to} to={to} onClick={() => setOpen(false)}>
                {t(label)}
              </Link>
            ) : (
              <NavLink key={to} to={to} end onClick={() => setOpen(false)}>
                {t(label)}
              </NavLink>
            ),
          )}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="lang-toggle"
            onClick={toggle}
            lang={isAr ? "en" : "ar"}
            aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
          >
            {isAr ? "English" : "العربية"}
          </button>
          <Link className="account-link" to="/account" onClick={() => setOpen(false)}>
            <Icon name="user" size={20} />
            <span>{user ? user.name.split(" ")[0] : t("Sign in")}</span>
          </Link>
          <CartButton />
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? t("Close") : t("Menu")}
          </button>
        </div>
      </header>
      <main id="content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-brand">
          <Logo variant="full" className="footer-logo" />
          <p>{t("Damascus cooking from five branches in Dubai, Sharjah and Ajman. Order online for delivery or pickup.")}</p>
        </div>
        <div>
          <h2>{t("Order")}</h2>
          <ul>
            <li>
              <Link to="/menu">{t("Menu & ordering")}</Link>
            </li>
            <li>
              <Link to="/account">{t("My orders")}</Link>
            </li>
            <li>
              <Link to="/admin">{t("Staff login")}</Link>
            </li>
          </ul>
        </div>
        <div className="footer-branches">
          <h2>{t("Branches")}</h2>
          <ul>
            {locations.map((place) => (
              <li key={place.id}>
                <span>
                  {isAr ? place.ar : place.name} · {t(place.city)}
                </span>
                <a href={place.phoneHref} dir="ltr">
                  {place.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} {t("Al Farooj Al Shami Restaurants")}</span>
          <span>
            <a href="https://www.alfaroojalshamirestaurant.ae/" target="_blank" rel="noreferrer">
              alfaroojalshamirestaurant.ae
            </a>
            {" · "}
            <Link to="/terms">{t("Terms")}</Link>
            {" · "}
            <Link to="/privacy">{t("Privacy")}</Link>
          </span>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} /> {toast}
        </div>
      )}
    </>
  );
}

export function BranchSwitch({ compact = false }) {
  const { locationId, setLocationId } = useCafe();
  const { t, isAr } = useLang();
  return (
    <div className={compact ? "branch-switch compact" : "branch-switch"} role="group" aria-label={t("Choose a branch")}>
      {locations.map((place) => (
        <button key={place.id} type="button" aria-pressed={locationId === place.id} onClick={() => setLocationId(place.id)}>
          <Icon name="pin" size={18} />
          <span>
            <strong>{isAr ? place.ar : place.name}</strong>
            <small>{t(place.city)}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
