export type SeedChoice = {
  en: string;
  ar: string;
  price: string;
};

export type SeedItem = {
  en: string;
  ar: string;
  price?: string;
  page: number;
  descriptionEn?: string;
  descriptionAr?: string;
  available?: boolean;
  note?: string;
  review?: "pending_review" | "needs_clarification";
  choices?: SeedChoice[];
};

export type SeedCategory = {
  en: string;
  ar: string;
  page: number;
  items: SeedItem[];
};

export type SeedMenu = {
  id: string;
  branchId: string;
  sourceFilename: string;
  sourceTitle: string | null;
  sourceCreatedAt: string | null;
  vatNoteEn: string | null;
  vatNoteAr: string | null;
  categories: SeedCategory[];
};

export type SeedBranch = {
  id: string;
  emirateId: "dubai" | "sharjah" | "ajman";
  slug: string;
  nameEn: string;
  nameAr: string;
  phones: string[];
  publishedLocationEn: string | null;
  publishedLocationAr: string | null;
  locationPrecision: "none" | "street_only" | "published_partial" | "conflict" | "verified";
  addressConflictNoteEn: string | null;
  addressConflictNoteAr: string | null;
  deliveryMode: "not_configured" | "printed_free_unconfirmed" | "printed_fee_unknown" | "enabled";
  deliveryFeeMinor: number | null;
  pickupMode: "not_configured" | "enabled";
  hoursStatus: "unknown" | "printed_unconfirmed" | "confirmed";
  hoursNoteEn: string | null;
  hoursNoteAr: string | null;
  sourceUrl: string;
  sourceNoteEn: string;
  sourceNoteAr: string;
};
