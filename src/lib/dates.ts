import type { ISODate } from "@/lib/models";

/** Calendar-date helpers. All maths is done in UTC to avoid DST drift. */

export function parseISODate(value: ISODate): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function toISODate(date: Date): ISODate {
  return date.toISOString().slice(0, 10);
}

export function isValidISODate(value: unknown): value is ISODate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = parseISODate(value);
  return !Number.isNaN(d.getTime()) && toISODate(d) === value;
}

export function addDays(value: ISODate, days: number): ISODate {
  const d = parseISODate(value);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000);
}

export function eachDate(from: ISODate, toExclusive: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; d < toExclusive; d = addDays(d, 1)) out.push(d);
  return out;
}

export function weekday(value: ISODate): number {
  return parseISODate(value).getUTCDay();
}

/** Local "today" as an ISO date (client or server clock). */
export function todayISO(now: Date = new Date()): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function defaultStay(now: Date = new Date()): { checkIn: ISODate; checkOut: ISODate } {
  const checkIn = addDays(todayISO(now), 21);
  return { checkIn, checkOut: addDays(checkIn, 3) };
}
