import Link from "next/link";
import { copy, type Locale } from "@/i18n/copy";
import type { Actor } from "@/domain/permissions";
import { isStaff } from "@/domain/permissions";
import { LocaleLink } from "./locale-link";

export function SiteHeader({ locale, actor, needsSetup }: { locale: Locale; actor: Actor | null; needsSetup: boolean }) {
  const text = copy(locale);
  return (
    <header className="bar shell">
      <Link href={`/${locale}`} className="quiet brand-link" aria-label={text.logoAlt}>
        <img className="brand-logo" src="/brand/logo.png" alt={text.logoAlt} />
      </Link>
      <nav aria-label="Main">
        <Link href={`/${locale}`}>{text.home}</Link>
        <Link className="cart-pill" href={`/${locale}/cart`}>{text.cart}</Link>
        {actor ? <Link href={`/${locale}/account`}>{text.account}</Link> : <Link href={`/${locale}/login`}>{text.login}</Link>}
        {actor && isStaff(actor.role) ? <Link href={`/${locale}/admin`}>{text.admin}</Link> : null}
        {actor?.role === "driver" ? <Link href={`/${locale}/drive`}>{text.driverShare}</Link> : null}
        {needsSetup ? <Link href={`/${locale}/setup`}>{text.setup}</Link> : null}
        <LocaleLink locale={locale} />
      </nav>
    </header>
  );
}
