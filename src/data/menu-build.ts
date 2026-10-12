import type { SeedCategory, SeedItem } from "./types";

export function dish(en: string, ar: string, price: string, page: number, descriptionEn?: string, descriptionAr?: string): SeedItem {
  return { en, ar, price, page, review: "pending_review", descriptionEn, descriptionAr };
}

export function unclear(en: string, ar: string, page: number, note: string): SeedItem {
  return { en, ar, page, available: false, review: "needs_clarification", note };
}

export function choices(en: string, ar: string, page: number, options: Array<[string, string, string]>): SeedItem {
  return {
    en,
    ar,
    page,
    review: "pending_review",
    choices: options.map(([choiceEn, choiceAr, price]) => ({ en: choiceEn, ar: choiceAr, price })),
  };
}

export function category(en: string, ar: string, page: number, items: SeedItem[]): SeedCategory {
  return { en, ar, page, items };
}
