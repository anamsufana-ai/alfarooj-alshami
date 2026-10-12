"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LocaleLink({ locale }: { locale: "en" | "ar" }) {
  const pathname = usePathname() || `/${locale}`;
  const next = locale === "ar" ? "en" : "ar";
  const parts = pathname.split("/");
  parts[1] = next;
  return <Link href={parts.join("/") || `/${next}`}>{next === "ar" ? "العربية" : "English"}</Link>;
}
