import { notFound } from "next/navigation";
import { CartCheckout } from "@/components/cart-checkout";
import { copy, isLocale } from "@/i18n/copy";

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const text = copy(raw);
  return (
    <section className="shell hero">
      <h1>{text.checkout}</h1>
      <CartCheckout locale={raw} />
    </section>
  );
}
