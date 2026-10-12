"use client";

import { useEffect, useState } from "react";
import { copy, type Locale } from "@/i18n/copy";
import { readCart, writeCart, type StoredCart } from "@/lib/cart";
import { placeCheckout, quoteCart } from "@/server/customer-actions";

type Quote = Awaited<ReturnType<typeof quoteCart>>;

export function CartCheckout({ locale }: { locale: Locale }) {
  const text = copy(locale);
  const [cart, setCart] = useState<StoredCart | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const current = readCart();
    setCart(current);
    if (current) void quoteCart(current, locale).then(setQuote);
  }, [locale]);

  async function submit(formData: FormData) {
    if (!cart) return;
    setPending(true);
    setError("");
    const result = await placeCheckout({
      branchId: cart.branchId,
      clientRequestId: crypto.randomUUID(),
      locale,
      fulfillmentType: String(formData.get("fulfillmentType") || "delivery"),
      contactName: String(formData.get("name") || ""),
      contactPhone: String(formData.get("phone") || ""),
      contactEmail: String(formData.get("email") || ""),
      addressEmirate: String(formData.get("emirate") || ""),
      addressLine1: String(formData.get("address") || ""),
      notes: String(formData.get("notes") || ""),
      lines: cart.lines,
    });
    if (result && "ok" in result && !result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    if (result && "next" in result && result.next) {
      writeCart(null);
      window.location.assign(result.next);
      return;
    }
    setPending(false);
  }

  if (!cart || cart.lines.length === 0) return <p>{text.cartEmpty}</p>;
  return (
    <div className="stack">
      {quote?.lines.map((line) => (
        <article key={`${line.itemId}-${line.modifiers.map((modifier) => modifier.nameEn).join()}`} className="item">
          <strong>{locale === "ar" ? line.nameAr : line.nameEn}</strong>
          <span>{text.quantity}: {line.quantity}</span>
          <span>{line.lineLabel}</span>
          <button type="button" className="quiet" onClick={() => {
            const next = { ...cart, lines: cart.lines.filter((candidate) => candidate.itemId !== line.itemId) };
            writeCart(next.lines.length ? next : null);
            setCart(next.lines.length ? next : null);
          }}>{text.remove}</button>
        </article>
      ))}
      {quote ? <p>{text.subtotal}: {quote.subtotalLabel}</p> : null}
      {quote && quote.errors.length > 0 ? <p className="notice warn">{quote.errors.join(", ")}</p> : null}
      <form className="panel" action={submit}>
        <label>{text.name}<input name="name" required minLength={2} /></label>
        <label>{text.phoneLabel}<input name="phone" required inputMode="tel" /></label>
        <label>{text.email} ({text.optional})<input name="email" type="email" /></label>
        <fieldset>
          <legend>{text.delivery}</legend>
          <label><input type="radio" name="fulfillmentType" value="delivery" defaultChecked /> {text.delivery}</label>
          <label><input type="radio" name="fulfillmentType" value="pickup" /> {text.pickup}</label>
        </fieldset>
        <label>{text.emirate}
          <select name="emirate" defaultValue="">
            <option value=""> </option>
            <option value="dubai">Dubai / دبي</option>
            <option value="sharjah">Sharjah / الشارقة</option>
            <option value="ajman">Ajman / عجمان</option>
          </select>
        </label>
        <label>{text.address}<input name="address" /></label>
        <label>{text.notes}<textarea name="notes" maxLength={400} /></label>
        <p className="notice">{text.paymentNotConfigured}</p>
        {error ? <p className="notice warn" role="alert">{error}</p> : null}
        <button disabled={pending} type="submit">{text.placeOrder}</button>
      </form>
    </div>
  );
}
