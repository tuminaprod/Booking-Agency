import type { Booking, BookableType } from "@/lib/models";
import { bookingRequestSchema, fieldErrors } from "@/lib/booking/schema";
import { quoteBookable, type Bookable } from "@/lib/booking/quote";
import { validatePromotion } from "@/lib/booking/promotions";
import { diffDays, todayISO } from "@/lib/dates";
import { destinationName, getExperience, getHotel, getTrip, listPromotions } from "./catalog";
import { processCardPayment } from "./payments";

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; status: number; code: string; message: string; fieldErrors?: Record<string, string> };

export function resolveBookable(type: BookableType, slug: string): { bookable: Bookable; destination: string } | null {
  if (type === "hotel") {
    const hotel = getHotel(slug);
    return hotel ? { bookable: { type, hotel }, destination: destinationName(hotel.destinationId) } : null;
  }
  if (type === "trip") {
    const trip = getTrip(slug);
    return trip ? { bookable: { type, trip }, destination: destinationName(trip.destinationId) } : null;
  }
  const experience = getExperience(slug);
  return experience ? { bookable: { type, experience }, destination: destinationName(experience.destinationId) } : null;
}

export function generateReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `OR-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

/**
 * Server-authoritative booking pipeline:
 * validate → resolve → re-price → check availability → verify total → charge → confirm.
 * The client never dictates a price.
 */
export async function createBooking(raw: unknown, today = todayISO()): Promise<CreateBookingResult> {
  const parsed = bookingRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, status: 422, code: "validation_error", message: "Some details need attention.", fieldErrors: fieldErrors(parsed.error) };
  }
  const req = parsed.data;
  const resolved = resolveBookable(req.type, req.slug);
  if (!resolved) return { ok: false, status: 404, code: "not_found", message: "We couldn't find that listing." };

  let promotion = null;
  if (req.promoCode) {
    const pre = quoteBookable(resolved.bookable, resolved.destination, { ...req, today, promotion: null });
    if (!pre.ok) return { ok: false, status: 409, code: pre.code, message: pre.reason };
    const promo = validatePromotion(req.promoCode, listPromotions(), {
      type: req.type,
      subtotal: pre.price.base + pre.price.discounts,
      nights: req.type === "hotel" ? diffDays(pre.startDate, pre.endDate) : undefined,
      today,
    });
    if (!promo.ok) return { ok: false, status: 422, code: "promo_invalid", message: promo.reason, fieldErrors: { promoCode: promo.reason } };
    promotion = promo.promotion;
  }

  const quote = quoteBookable(resolved.bookable, resolved.destination, { ...req, today, promotion });
  if (!quote.ok) return { ok: false, status: 409, code: quote.code, message: quote.reason };

  if (Math.abs(quote.price.total - req.expectedTotal) > 0.01) {
    return {
      ok: false,
      status: 409,
      code: "price_changed",
      message: `The price has changed since you started booking (now $${quote.price.total.toFixed(2)}). Please review the updated total.`,
    };
  }

  const charge = await processCardPayment({ number: req.card.number, amount: quote.price.dueNow, billing: req.billing });
  if (!charge.ok) return { ok: false, status: 402, code: charge.code, message: charge.message };

  const id = `bkg_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const booking: Booking = {
    id,
    reference: generateReference(),
    type: req.type,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    item: quote.snapshot,
    startDate: quote.startDate,
    endDate: quote.endDate,
    guests: { adults: req.adults, children: req.children, rooms: req.rooms },
    leadGuest: req.guest,
    specialRequests: req.specialRequests,
    extras: req.extras.filter((e) => e.quantity > 0),
    promoCode: promotion?.code,
    price: quote.price,
    payment: { ...charge.payment, bookingId: id },
    cancellation: quote.cancellation,
  };
  return { ok: true, booking };
}
