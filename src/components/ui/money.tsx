"use client";

import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/stores";

/**
 * Renders a USD amount in the visitor's chosen display currency.
 * Before hydration it renders USD (the server default) to avoid mismatches.
 */
export function Money({ usd, cents, className }: { usd: number; cents?: boolean; className?: string }) {
  const currency = useCurrency();
  return <span className={className}>{formatMoney(usd, currency, { cents })}</span>;
}

export function useFormatMoney() {
  const currency = useCurrency();
  return (usd: number, cents?: boolean) => formatMoney(usd, currency, { cents });
}
