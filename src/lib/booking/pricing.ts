import type {
  Experience,
  Extra,
  Hotel,
  HotelRoom,
  ISODate,
  Price,
  PriceLine,
  Promotion,
  SelectedExtra,
  Trip,
  TripDeparture,
} from "@/lib/models";
import { diffDays } from "@/lib/dates";
import { SERVICE_FEE_CAP, SERVICE_FEE_RATE } from "@/lib/data/catalog";
import { stayAvailability, type StayAvailability } from "./availability";
import { promotionDiscount } from "./promotions";

/**
 * The single source of truth for money on Oriel.
 *
 * Order of operations (identical for hotels, trips and experiences):
 *   base → discounts (deal, then promo) → extras → taxes → mandatory fees → total
 *
 * Taxes apply to (base − discounts + taxable extras). The Oriel service fee is
 * a transparent percentage of the pre-tax subtotal, capped. Fees collected at
 * the property are shown in the total but separated from "due now".
 */

const round = (n: number) => Math.round(n * 100) / 100;

export interface ExtraContext {
  nights: number;
  guests: number;
  rooms: number;
}

export function extraAmount(extra: Extra, quantity: number, ctx: ExtraContext): number {
  const units = (() => {
    switch (extra.per) {
      case "stay":
        return 1;
      case "night":
        return Math.max(1, ctx.nights) * ctx.rooms;
      case "guest":
        return ctx.guests;
      case "guest-night":
        return ctx.guests * Math.max(1, ctx.nights);
    }
  })();
  return round(extra.price * units * quantity);
}

export function describeExtraUnit(extra: Extra): string {
  return { stay: "per booking", night: "per room, per night", guest: "per guest", "guest-night": "per guest, per night" }[extra.per];
}

interface AssembleInput {
  baseLines: PriceLine[];
  dealLine?: PriceLine;
  promotion?: Promotion | null;
  extras: { extra: Extra; quantity: number }[];
  extraCtx: ExtraContext;
  taxRate: number;
  taxLabel: string;
  fees: PriceLine[];
  nights?: number;
}

function assemble(input: AssembleInput): Price {
  const lines: PriceLine[] = [...input.baseLines];
  const base = round(input.baseLines.reduce((s, l) => s + l.amount, 0));

  let discounts = 0;
  if (input.dealLine) {
    lines.push(input.dealLine);
    discounts += input.dealLine.amount;
  }
  if (input.promotion) {
    const promoAmount = promotionDiscount(input.promotion, base + discounts);
    if (promoAmount > 0) {
      lines.push({
        id: `promo-${input.promotion.code}`,
        kind: "discount",
        label: `Promo code ${input.promotion.code}`,
        amount: -promoAmount,
        detail: input.promotion.title,
      });
      discounts -= promoAmount;
    }
  }
  discounts = round(discounts);

  let extras = 0;
  let taxableExtras = 0;
  for (const { extra, quantity } of input.extras) {
    if (quantity <= 0) continue;
    const amount = extraAmount(extra, quantity, input.extraCtx);
    extras += amount;
    if (extra.taxable) taxableExtras += amount;
    lines.push({ id: `extra-${extra.id}`, kind: "extra", label: extra.label, amount, detail: describeExtraUnit(extra) });
  }
  extras = round(extras);

  const taxable = Math.max(0, base + discounts + taxableExtras);
  const taxes = round(taxable * input.taxRate);
  if (taxes > 0) {
    lines.push({ id: "tax", kind: "tax", label: input.taxLabel, amount: taxes, detail: `${round(input.taxRate * 100)}% of taxable amount` });
  }

  const serviceFee = round(Math.min(SERVICE_FEE_CAP, (base + discounts + extras) * SERVICE_FEE_RATE));
  const feeLines: PriceLine[] = [
    ...input.fees,
    { id: "service-fee", kind: "fee", label: "Oriel service fee", amount: serviceFee, detail: `${SERVICE_FEE_RATE * 100}%, capped at $${SERVICE_FEE_CAP}`, payableAt: "booking" },
  ];
  lines.push(...feeLines);

  const fees = round(feeLines.reduce((s, l) => s + l.amount, 0));
  const dueAtProperty = round(feeLines.filter((l) => l.payableAt === "property").reduce((s, l) => s + l.amount, 0));
  const total = round(base + discounts + extras + taxes + fees);

  return {
    currency: "USD",
    lines,
    base,
    discounts,
    extras,
    taxes,
    fees,
    dueNow: round(total - dueAtProperty),
    dueAtProperty,
    total,
    nights: input.nights,
    perNight: input.nights ? round((base + discounts) / input.nights) : undefined,
  };
}

function resolveExtras(selected: SelectedExtra[], catalog: Extra[]) {
  return selected
    .map((s) => ({ extra: catalog.find((e) => e.id === s.extraId), quantity: s.quantity }))
    .filter((e): e is { extra: Extra; quantity: number } => Boolean(e.extra));
}

/* ------------------------------------------------------------------ */
/* Hotels                                                              */
/* ------------------------------------------------------------------ */

export interface HotelQuoteInput {
  hotel: Hotel;
  room: HotelRoom;
  checkIn: ISODate;
  checkOut: ISODate;
  rooms: number;
  adults: number;
  children: number;
  extras?: SelectedExtra[];
  extrasCatalog?: Extra[];
  promotion?: Promotion | null;
  /** Used to check whether the hotel's deal is still running */
  today: ISODate;
}

export interface HotelQuote {
  price: Price;
  availability: StayAvailability;
}

export function quoteHotel(input: HotelQuoteInput): HotelQuote {
  const { hotel, room, checkIn, checkOut, rooms, today } = input;
  const nights = Math.max(0, diffDays(checkIn, checkOut));
  const availability = stayAvailability(hotel, room, checkIn, checkOut);
  const roomTotal = round(availability.nights.reduce((s, n) => s + n.price, 0) * rooms);
  const guests = input.adults + input.children;

  const baseLines: PriceLine[] = [
    {
      id: "room",
      kind: "base",
      label: `${room.name}`,
      amount: roomTotal,
      detail: `${nights} night${nights === 1 ? "" : "s"} × ${rooms} room${rooms === 1 ? "" : "s"}`,
    },
  ];

  const dealActive = hotel.deal && today <= hotel.deal.endsAt;
  const dealLine: PriceLine | undefined = dealActive
    ? { id: "deal", kind: "discount", label: `${hotel.deal!.label} (−${hotel.deal!.percentOff}%)`, amount: -round((roomTotal * hotel.deal!.percentOff) / 100) }
    : undefined;

  const fees: PriceLine[] = hotel.fees.map((f) => {
    const units = f.per === "night" ? nights * rooms : f.per === "guest-night" ? nights * guests : 1;
    return {
      id: f.id,
      kind: "fee",
      label: f.label,
      amount: round(f.amount * units),
      detail: f.payableAt === "property" ? "Paid at the property" : "Mandatory, charged now",
      payableAt: f.payableAt,
    };
  });

  const price = assemble({
    baseLines,
    dealLine,
    promotion: input.promotion,
    extras: resolveExtras(input.extras ?? [], input.extrasCatalog ?? []),
    extraCtx: { nights, guests, rooms },
    taxRate: hotel.taxRate,
    taxLabel: "Taxes & VAT",
    fees,
    nights,
  });
  return { price, availability };
}

/* ------------------------------------------------------------------ */
/* Trips                                                               */
/* ------------------------------------------------------------------ */

export const CHILD_TRIP_RATE = 0.75;

export interface TripQuoteInput {
  trip: Trip;
  departure: TripDeparture;
  adults: number;
  children: number;
  extras?: SelectedExtra[];
  extrasCatalog?: Extra[];
  promotion?: Promotion | null;
}

export function quoteTrip(input: TripQuoteInput): Price {
  const { trip, departure, adults, children } = input;
  const baseLines: PriceLine[] = [
    { id: "adults", kind: "base", label: `${trip.durationDays}-day trip — adults`, amount: round(departure.price * adults), detail: `${adults} × $${departure.price.toLocaleString("en-US")}` },
  ];
  if (children > 0) {
    const childPrice = round(departure.price * CHILD_TRIP_RATE);
    baseLines.push({ id: "children", kind: "base", label: "Children (under 12)", amount: round(childPrice * children), detail: `${children} × $${childPrice.toLocaleString("en-US")}` });
  }
  return assemble({
    baseLines,
    promotion: input.promotion,
    extras: resolveExtras(input.extras ?? [], input.extrasCatalog ?? []),
    extraCtx: { nights: trip.durationDays - 1, guests: adults + children, rooms: 1 },
    taxRate: trip.taxRate,
    taxLabel: "Taxes",
    fees: [],
  });
}

/* ------------------------------------------------------------------ */
/* Experiences                                                         */
/* ------------------------------------------------------------------ */

export const CHILD_EXPERIENCE_RATE = 0.6;

export interface ExperienceQuoteInput {
  experience: Experience;
  adults: number;
  children: number;
  extras?: SelectedExtra[];
  extrasCatalog?: Extra[];
  promotion?: Promotion | null;
}

export function quoteExperience(input: ExperienceQuoteInput): Price {
  const { experience, adults, children } = input;
  const baseLines: PriceLine[] = [
    { id: "adults", kind: "base", label: "Adults", amount: round(experience.priceFrom * adults), detail: `${adults} × $${experience.priceFrom}` },
  ];
  if (children > 0) {
    const childPrice = round(experience.priceFrom * CHILD_EXPERIENCE_RATE);
    baseLines.push({ id: "children", kind: "base", label: "Children", amount: round(childPrice * children), detail: `${children} × $${childPrice}` });
  }
  return assemble({
    baseLines,
    promotion: input.promotion,
    extras: resolveExtras(input.extras ?? [], input.extrasCatalog ?? []),
    extraCtx: { nights: 0, guests: adults + children, rooms: 1 },
    taxRate: experience.taxRate,
    taxLabel: "Taxes",
    fees: [],
  });
}
