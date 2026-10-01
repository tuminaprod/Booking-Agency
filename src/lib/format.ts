import type { ISODate } from "@/lib/models";
import { parseISODate } from "@/lib/dates";

export { formatMoney } from "@/lib/money";

export const LANGUAGES = [
  { code: "en", label: "English", available: true },
  { code: "fr", label: "Français", available: false },
  { code: "ar", label: "العربية", available: false },
] as const;

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
