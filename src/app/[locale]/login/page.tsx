import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { copy, isLocale } from "@/i18n/copy";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  return <section className="shell hero"><h1>{copy(raw).login}</h1><LoginForm locale={raw} /></section>;
}
