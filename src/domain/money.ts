export function majorToMinor(value: string): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid amount: ${value}`);
  }
  const dirhams = Number(match[1]);
  const fils = Number((match[2] ?? "").padEnd(2, "0"));
  return dirhams * 100 + fils;
}

export function formatMinor(minor: number, locale: string): string {
  const sign = minor < 0 ? "-" : "";
  const absolute = Math.abs(minor);
  const dirhams = Math.floor(absolute / 100);
  const fils = absolute % 100;
  const amount = `${dirhams}.${fils.toString().padStart(2, "0")}`;
  return locale === "ar" ? `${amount} د.إ` : `AED ${sign}${amount}`.replace("AED -", "-AED ");
}

export function includedVatMinor(totalMinor: number, rateBps: number): number {
  if (rateBps < 0 || totalMinor < 0) {
    throw new Error("VAT inputs must be non-negative");
  }
  return Math.round((totalMinor * rateBps) / (10000 + rateBps));
}
