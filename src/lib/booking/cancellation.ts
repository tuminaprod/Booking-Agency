import type { Booking, CancellationPolicy, ISODate } from "@/lib/models";
import { addDays, diffDays } from "@/lib/dates";

/** Last date on which a full refund is available, or null for non-refundable. */
export function freeCancellationDeadline(policy: CancellationPolicy, startDate: ISODate): ISODate | null {
  if (policy.type === "non-refundable" || policy.freeUntilDays === undefined) return null;
  return addDays(startDate, -policy.freeUntilDays);
}

export interface RefundQuote {
  eligible: boolean;
  refundPercent: number;
  refundAmount: number;
  /** Amount retained by the property/operator */
  retained: number;
  explanation: string;
}

/**
 * Refund workflow logic used by both the customer "Manage booking" screen and
 * the admin cancellation/refund workflow. Only the amount paid at booking is
 * refundable; property-collected fees were never charged.
 */
export function quoteRefund(booking: Pick<Booking, "cancellation" | "startDate" | "price" | "payment" | "status">, today: ISODate): RefundQuote {
  const paid = booking.payment.amount - booking.payment.refundedAmount;
  if (booking.status === "cancelled" || booking.status === "completed") {
    return { eligible: false, refundPercent: 0, refundAmount: 0, retained: paid, explanation: "This booking can no longer be cancelled." };
  }
  const daysBefore = diffDays(today, booking.startDate);
  const policy = booking.cancellation;
  let pct = 0;
  let explanation: string;
  if (policy.type === "non-refundable") {
    explanation = "This rate is non-refundable.";
  } else if (policy.freeUntilDays !== undefined && daysBefore >= policy.freeUntilDays) {
    pct = 100;
    explanation = "You're within the free cancellation window — full refund.";
  } else if (policy.type === "partial") {
    pct = policy.refundPercentAfter ?? 0;
    explanation = `The free cancellation window has passed; ${pct}% of the amount paid is refundable.`;
  } else {
    explanation = "The free cancellation window has passed.";
  }
  if (daysBefore < 0) {
    pct = 0;
    explanation = "The stay has already started.";
  }
  const refundAmount = Math.round(paid * pct) / 100;
  return { eligible: pct > 0, refundPercent: pct, refundAmount, retained: Math.round((paid - refundAmount) * 100) / 100, explanation };
}
