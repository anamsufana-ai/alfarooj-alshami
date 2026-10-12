export const BUSINESS_TIME_ZONE = "Asia/Dubai";
const DUBAI_OFFSET = "+04:00";

export type PeriodKind = "day" | "week" | "month" | "year" | "range";

export function dubaiDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseIsoDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const start = new Date(`${value}T00:00:00${DUBAI_OFFSET}`);
  if (Number.isNaN(start.getTime())) return null;
  if (dubaiDateString(start) !== value) return null;
  return value;
}

export function dubaiStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00${DUBAI_OFFSET}`);
}

export function addDays(isoDate: string, days: number): string {
  const next = new Date(dubaiStart(isoDate).getTime() + days * 24 * 60 * 60 * 1000);
  return dubaiDateString(next);
}

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export function mondayOnOrBefore(isoDate: string): string {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "short",
  }).format(dubaiStart(isoDate));
  const index = WEEKDAY_INDEX[weekday];
  if (index == null) throw new Error(`Unexpected weekday ${weekday}`);
  return addDays(isoDate, -index);
}

export function periodRange(kind: PeriodKind, from: string, to?: string): { start: Date; end: Date } {
  const startDate = parseIsoDate(from);
  if (!startDate) throw new Error("Invalid start date");
  if (kind === "day") {
    return { start: dubaiStart(startDate), end: dubaiStart(addDays(startDate, 1)) };
  }
  if (kind === "week") {
    const monday = mondayOnOrBefore(startDate);
    return { start: dubaiStart(monday), end: dubaiStart(addDays(monday, 7)) };
  }
  if (kind === "month") {
    const [year, month] = startDate.split("-").map(Number);
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
    return { start: dubaiStart(monthStart), end: dubaiStart(next) };
  }
  if (kind === "year") {
    const year = Number(startDate.slice(0, 4));
    return { start: dubaiStart(`${year}-01-01`), end: dubaiStart(`${year + 1}-01-01`) };
  }
  const endDate = to ? parseIsoDate(to) : null;
  if (!endDate || endDate < startDate) throw new Error("Invalid end date");
  return { start: dubaiStart(startDate), end: dubaiStart(addDays(endDate, 1)) };
}
