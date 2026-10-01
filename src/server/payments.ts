import type { BillingAddress, Payment } from "@/lib/models";
import { cardBrand } from "@/lib/booking/schema";

/**
 * Payment gateway adapter.
 *
 * This demo adapter simulates a card processor. Swap `processCardPayment`
 * for a real provider (Stripe, Adyen…) — the rest of the booking pipeline
 * only depends on the `PaymentResult` contract. Full card numbers are never
 * persisted; only brand and last four digits are kept.
 *
 * Test cards (see /help#payments):
 *   4242 4242 4242 4242 — approved
 *   4000 0000 0000 0002 — declined
 *   4000 0000 0000 9995 — insufficient funds
 */

export type PaymentFailureCode = "card_declined" | "insufficient_funds" | "processing_error";

export type PaymentResult =
  | { ok: true; payment: Omit<Payment, "bookingId"> }
  | { ok: false; code: PaymentFailureCode; message: string };

const DECLINES: Record<string, { code: PaymentFailureCode; message: string }> = {
  "4000000000000002": { code: "card_declined", message: "Your card was declined. Please try another card or contact your bank." },
  "4000000000009995": { code: "insufficient_funds", message: "Your card has insufficient funds. Please use a different card." },
  "4000000000000119": { code: "processing_error", message: "We couldn't reach your bank. No money was taken — please try again." },
};

export async function processCardPayment(input: {
  number: string;
  amount: number;
  billing: BillingAddress;
}): Promise<PaymentResult> {
  // Simulate network latency to the processor
  await new Promise((r) => setTimeout(r, 650));
  const number = input.number.replace(/\s+/g, "");
  const decline = DECLINES[number];
  if (decline) return { ok: false, ...decline };
  return {
    ok: true,
    payment: {
      id: `pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      method: "card",
      cardBrand: cardBrand(number),
      last4: number.slice(-4),
      status: "paid",
      amount: input.amount,
      refundedAmount: 0,
      currency: "USD",
      createdAt: new Date().toISOString(),
      billing: input.billing,
    },
  };
}
