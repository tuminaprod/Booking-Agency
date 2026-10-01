import type { CurrencyCode, Money } from "@/lib/models";

/**
 * Currency handling.
 *
 * - Inventory is priced in TND (Tunisia) or DZD (Algeria).
 * - Bookings are charged in the booking currency configured per country
 *   (admin setting; default = local currency).
 * - Conversion only happens through `convert`, using the indicative rates
 *   below, and every formatted amount includes its currency code so two
 *   currencies are never shown side by side without labels.
 */

/** Units of each currency per 1 EUR (indicative reference rates). */
export const RATES_PER_EUR: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.1,
  TND: 3.4,
  DZD: 150,
};

export const CURRENCY_META: Record<CurrencyCode, { label: string; decimals: number; step: number }> = {
  TND: { label: "Tunisian dinar", decimals: 3, step: 5 },
  DZD: { label: "Algerian dinar", decimals: 2, step: 100 },
  EUR: { label: "Euro", decimals: 2, step: 1 },
  USD: { label: "US dollar", decimals: 2, step: 1 },
};

export const SUPPORTED_CURRENCIES = Object.keys(RATES_PER_EUR) as CurrencyCode[];

export function isCurrency(v: unknown): v is CurrencyCode {
  return typeof v === "string" && (SUPPORTED_CURRENCIES as string[]).includes(v);
}

/** Rounds to the currency's minor unit (TND has 3 decimals; DZD/EUR/USD have 2). */
export function roundMoney(amount: number, currency: CurrencyCode): number {
  const f = 10 ** CURRENCY_META[currency].decimals;
  return Math.round(amount * f) / f;
}

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  return roundMoney((amount / RATES_PER_EUR[from]) * RATES_PER_EUR[to], to);
}

export const money = (amount: number, currency: CurrencyCode): Money => ({ amount: roundMoney(amount, currency), currency });

const formatters = new Map<string, Intl.NumberFormat>();

/**
 * Formats with an explicit ISO code, e.g. "TND 245", "DZD 18,500", "EUR 72.50".
 * `cents` shows minor units (2 decimals; TND is shown to 2 for readability).
 */
export function formatMoney(amount: number, currency: CurrencyCode, opts: { cents?: boolean } = {}): string {
  const digits = opts.cents && currency !== "DZD" ? 2 : 0;
  const key = `${currency}:${digits}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code", minimumFractionDigits: digits, maximumFractionDigits: digits });
    formatters.set(key, f);
  }
  // Intl uses a non-breaking space between code and number
  return f.format(amount);
}

export const formatMoneyObj = (m: Money, opts?: { cents?: boolean }) => formatMoney(m.amount, m.currency, opts);
