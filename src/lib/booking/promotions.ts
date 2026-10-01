import type { BookableType, ISODate, Promotion } from "@/lib/models";

export type PromoResult =
  | { ok: true; promotion: Promotion }
  | { ok: false; reason: string };

interface PromoContext {
  type: BookableType;
  subtotal: number;
  nights?: number;
  today: ISODate;
}

export function validatePromotion(code: string, promotions: Promotion[], ctx: PromoContext): PromoResult {
  const normalised = code.trim().toUpperCase();
  if (!normalised) return { ok: false, reason: "Enter a promo code." };
  const promo = promotions.find((p) => p.code === normalised);
  if (!promo) return { ok: false, reason: "We couldn't find that code. Check the spelling and try again." };
  if (!promo.active || ctx.today > promo.validTo) return { ok: false, reason: "This code has expired." };
  if (ctx.today < promo.validFrom) return { ok: false, reason: "This code isn't active yet." };
  if (!promo.appliesTo.includes(ctx.type)) {
    return { ok: false, reason: `This code applies to ${promo.appliesTo.join(" and ")} bookings only.` };
  }
  if (promo.minNights && (ctx.nights ?? 0) < promo.minNights) {
    return { ok: false, reason: `This code requires a stay of at least ${promo.minNights} nights.` };
  }
  if (promo.minSpend && ctx.subtotal < promo.minSpend) {
    return { ok: false, reason: `This code requires a minimum spend of $${promo.minSpend.toLocaleString("en-US")}.` };
  }
  return { ok: true, promotion: promo };
}

export function promotionDiscount(promo: Promotion, subtotal: number): number {
  const raw = promo.type === "percent" ? (subtotal * promo.value) / 100 : promo.value;
  return Math.min(subtotal, Math.round(raw * 100) / 100);
}
