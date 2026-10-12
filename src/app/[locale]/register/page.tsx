import Link from "next/link";
import { notFound } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { copy, isLocale } from "@/i18n/copy";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const text = copy(raw);
  return <section className="shell hero"><h1>{text.register}</h1><RegisterForm locale={raw} /><Link href={`/${raw}/login`}>{text.login}</Link></section>;
}
