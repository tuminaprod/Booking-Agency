import type { CurrencyCode, ISODate } from "@/lib/models";
import { parseISODate } from "@/lib/dates";

/** Indicative display rates from USD. Charges are always settled in USD. */
export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string; rate: number }[] = [
  { code: "USD", label: "US dollar", symbol: "$", rate: 1 },
  { code: "EUR", label: "Euro", symbol: "€", rate: 0.92 },
  { code: "GBP", label: "British pound", symbol: "£", rate: 0.79 },
  { code: "CHF", label: "Swiss franc", symbol: "CHF", rate: 0.88 },
  { code: "AED", label: "UAE dirham", symbol: "AED", rate: 3.67 },
  { code: "JPY", label: "Japanese yen", symbol: "¥", rate: 149 },
];

export const LANGUAGES = [
  { code: "en", label: "English", available: true },
  { code: "fr", label: "Français", available: false },
  { code: "de", label: "Deutsch", available: false },
  { code: "es", label: "Español", available: false },
  { code: "it", label: "Italiano", available: false },
  { code: "ja", label: "日本語", available: false },
] as const;

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(usd: number, currency: CurrencyCode = "USD", opts: { cents?: boolean } = {}): string {
  const meta = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const value = usd * meta.rate;
  const cents = opts.cents && currency !== "JPY";
  const key = `${currency}:${cents}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    });
    formatters.set(key, f);
  }
  return f.format(value);
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dateShortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dateLongFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export const formatDate = (d: ISODate) => dateFmt.format(parseISODate(d));
export const formatDateShort = (d: ISODate) => dateShortFmt.format(parseISODate(d));
export const formatDateLong = (d: ISODate) => dateLongFmt.format(parseISODate(d));
export const formatMonth = (d: ISODate) => monthFmt.format(parseISODate(d));

export function formatDateRange(from: ISODate, to?: ISODate): string {
  if (!to || to === from) return formatDate(from);
  const a = parseISODate(from);
  const b = parseISODate(to);
  if (a.getUTCFullYear() === b.getUTCFullYear()) return `${formatDateShort(from)} – ${formatDate(to)}`;
  return `${formatDate(from)} – ${formatDate(to)}`;
}

export function ratingLabel(rating: number): string {
  if (rating >= 9.5) return "Exceptional";
  if (rating >= 9) return "Superb";
  if (rating >= 8.5) return "Excellent";
  if (rating >= 8) return "Very good";
  if (rating >= 7) return "Good";
  return "Pleasant";
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m ? `${h} h ${m} min` : `${h} hour${h === 1 ? "" : "s"}`;
}

export function guestsLabel(adults: number, children: number, rooms?: number): string {
  const parts = [plural(adults, "adult")];
  if (children) parts.push(plural(children, "child", "children"));
  if (rooms !== undefined) parts.push(plural(rooms, "room"));
  return parts.join(" · ");
}
