import { describe, expect, it } from "vitest";
import { EXTRAS } from "@/lib/data/catalog";
import { HOTELS } from "@/lib/data/hotels";
import { PROMOTIONS } from "@/lib/data/promotions";
import { TRIPS } from "@/lib/data/trips";
import { EXPERIENCES } from "@/lib/data/experiences";
import { addDays, diffDays, isValidISODate } from "@/lib/dates";
import { quoteExperience, quoteHotel, quoteTrip } from "./pricing";
import { validatePromotion } from "./promotions";
import { freeCancellationDeadline, quoteRefund } from "./cancellation";
import { stayAvailability } from "./availability";

const today = "2026-09-30";
const kalliste = HOTELS.find((h) => h.slug === "kalliste-cliff-suites")!;
const nalu = HOTELS.find((h) => h.slug === "nalu-lagoon-retreat")!;
const aspro = HOTELS.find((h) => h.slug === "aspro-villas-oia")!;

const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;

describe("dates", () => {
  it("computes differences and validates", () => {
    expect(diffDays("2026-10-01", "2026-10-04")).toBe(3);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(isValidISODate("2026-02-30")).toBe(false);
    expect(isValidISODate("2026-02-28")).toBe(true);
  });
});

describe("quoteHotel", () => {
  const base = { hotel: kalliste, room: kalliste.rooms[0], checkIn: "2026-10-12", checkOut: "2026-10-15", rooms: 1, adults: 2, children: 0, today };

  it("itemises every component and totals reconcile", () => {
    const { price } = quoteHotel(base);
    expect(price.nights).toBe(3);
    expect(price.total).toBe(sum(price.lines.map((l) => l.amount)));
    expect(price.total).toBe(sum([price.base, price.discounts, price.extras, price.taxes, price.fees]));
    expect(price.dueNow + price.dueAtProperty).toBeCloseTo(price.total, 2);
    expect(price.lines.some((l) => l.kind === "tax")).toBe(true);
    expect(price.lines.some((l) => l.id === "service-fee")).toBe(true);
  });

  it("separates property-collected fees from the amount due now", () => {
    const { price } = quoteHotel(base);
    // Climate resilience fee: $15/night × 3 nights, collected at the property
    expect(price.dueAtProperty).toBe(45);
  });

  it("includes mandatory booking-time fees in due now", () => {
    const { price } = quoteHotel({ ...base, hotel: nalu, room: nalu.rooms[0] });
    const transfer = price.lines.find((l) => l.label.includes("speedboat"))!;
    expect(transfer.payableAt).toBe("booking");
    expect(price.dueNow).toBeGreaterThan(price.base);
  });

  it("applies hotel deals before promo codes", () => {
    const promo = PROMOTIONS.find((p) => p.code === "WELCOME10")!;
    const { price } = quoteHotel({ ...base, hotel: aspro, room: aspro.rooms[0], promotion: promo });
    const deal = price.lines.find((l) => l.id === "deal")!;
    const promoLine = price.lines.find((l) => l.id.startsWith("promo-"))!;
    expect(deal.amount).toBeCloseTo(-price.base * 0.15, 1);
    expect(promoLine.amount).toBeCloseTo(-(price.base + deal.amount) * 0.1, 1);
  });

  it("charges extras according to their unit and does not tax insurance", () => {
    const { price: without } = quoteHotel(base);
    const { price } = quoteHotel({
      ...base,
      extras: [{ extraId: "breakfast", quantity: 1 }, { extraId: "travel-insurance", quantity: 1 }],
      extrasCatalog: EXTRAS,
    });
    expect(price.extras).toBe(28 * 2 * 3 + 39 * 2);
    const taxDelta = price.taxes - without.taxes;
    expect(taxDelta).toBeCloseTo(28 * 2 * 3 * kalliste.taxRate, 1);
  });

  it("reports availability across the stay", () => {
    const stay = stayAvailability(kalliste, kalliste.rooms[0], "2026-10-12", "2026-10-15");
    expect(stay.nights).toHaveLength(3);
    expect(stay.available).toBe(Math.min(...stay.nights.map((n) => n.available)));
  });
});

describe("quoteTrip & quoteExperience", () => {
  it("prices children at a reduced rate", () => {
    const trip = TRIPS[1];
    const dep = trip.departures[0];
    const price = quoteTrip({ trip, departure: dep, adults: 2, children: 1 });
    expect(price.base).toBeCloseTo(dep.price * 2 + dep.price * 0.75, 1);
    expect(price.total).toBe(sum(price.lines.map((l) => l.amount)));
  });

  it("prices experiences per participant", () => {
    const exp = EXPERIENCES[0];
    const price = quoteExperience({ experience: exp, adults: 3, children: 0 });
    expect(price.base).toBe(exp.priceFrom * 3);
  });
});

describe("promotions", () => {
  it("rejects expired, wrong-type and below-minimum codes with clear reasons", () => {
    expect(validatePromotion("summer25", PROMOTIONS, { type: "hotel", subtotal: 1000, nights: 3, today })).toMatchObject({ ok: false, reason: "This code has expired." });
    expect(validatePromotion("EXPLORE20", PROMOTIONS, { type: "hotel", subtotal: 1000, nights: 3, today }).ok).toBe(false);
    expect(validatePromotion("AUTUMN15", PROMOTIONS, { type: "hotel", subtotal: 500, nights: 3, today }).ok).toBe(false);
    expect(validatePromotion("AUTUMN15", PROMOTIONS, { type: "hotel", subtotal: 900, nights: 3, today }).ok).toBe(true);
    expect(validatePromotion("NOPE", PROMOTIONS, { type: "hotel", subtotal: 900, nights: 3, today }).ok).toBe(false);
  });
});

describe("cancellation", () => {
  const policy = { type: "partial" as const, freeUntilDays: 14, refundPercentAfter: 50, summary: "" };
  const booking = {
    cancellation: policy,
    startDate: "2026-11-01",
    status: "confirmed" as const,
    price: { dueNow: 1000 } as never,
    payment: { amount: 1000, refundedAmount: 0 } as never,
  };

  it("computes the free cancellation deadline", () => {
    expect(freeCancellationDeadline(policy, "2026-11-01")).toBe("2026-10-18");
  });

  it("refunds fully inside the window and partially after", () => {
    expect(quoteRefund(booking, "2026-10-10").refundAmount).toBe(1000);
    expect(quoteRefund(booking, "2026-10-25").refundAmount).toBe(500);
    expect(quoteRefund({ ...booking, cancellation: { type: "non-refundable", summary: "" } }, "2026-10-10").refundAmount).toBe(0);
  });
});
