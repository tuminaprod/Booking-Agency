import type { Booking, BookingStatus, PaymentStatus } from "@/lib/models";
import { quoteBookable } from "@/lib/booking/quote";
import { CUSTOMERS } from "@/lib/data/users";
import { resolveBookable } from "./bookings";
import type { BookableType } from "@/lib/models";

interface Seed {
  ref: string;
  customer: string;
  type: BookableType;
  slug: string;
  roomIndex?: number;
  departureIndex?: number;
  slot?: string;
  start: string;
  end?: string;
  adults: number;
  children?: number;
  status: BookingStatus;
  payment?: PaymentStatus;
  createdAt: string;
  extras?: { extraId: string; quantity: number }[];
}

const SEEDS: Seed[] = [
  // Demo customer — upcoming
  { ref: "OR-KAL7Q2", customer: "usr-demo", type: "hotel", slug: "kalliste-cliff-suites", roomIndex: 0, start: "2026-10-18", end: "2026-10-22", adults: 2, status: "confirmed", createdAt: "2026-08-02T14:12:00Z", extras: [{ extraId: "airport-transfer", quantity: 1 }, { extraId: "celebration", quantity: 1 }] },
  { ref: "OR-JPN4X8", customer: "usr-demo", type: "trip", slug: "classic-japan-kyoto-tokyo", departureIndex: 2, start: "", adults: 2, status: "confirmed", createdAt: "2026-07-19T09:30:00Z" },
  { ref: "OR-TEA2M5", customer: "usr-demo", type: "experience", slug: "kyoto-tea-ceremony", slot: "10:00", start: "2026-12-14", adults: 2, status: "confirmed", createdAt: "2026-09-02T18:00:00Z" },
  // Demo customer — past
  { ref: "OR-PAR9H3", customer: "usr-demo", type: "hotel", slug: "maison-lumen-saint-germain", roomIndex: 1, start: "2026-04-10", end: "2026-04-13", adults: 2, status: "completed", createdAt: "2026-02-01T12:00:00Z" },
  { ref: "OR-BAL3K7", customer: "usr-demo", type: "hotel", slug: "ubud-rainforest-sanctuary", roomIndex: 0, start: "2025-11-02", end: "2025-11-08", adults: 2, status: "completed", createdAt: "2025-08-21T12:00:00Z" },
  { ref: "OR-ROM6T1", customer: "usr-demo", type: "hotel", slug: "palazzo-aurelio", roomIndex: 0, start: "2026-06-05", end: "2026-06-08", adults: 2, status: "cancelled", payment: "refunded", createdAt: "2026-03-14T12:00:00Z" },
  // Other customers (admin data)
  { ref: "OR-NAL8P4", customer: "usr-c1", type: "hotel", slug: "nalu-lagoon-retreat", roomIndex: 0, start: "2026-11-20", end: "2026-11-27", adults: 2, status: "confirmed", createdAt: "2026-09-12T08:10:00Z" },
  { ref: "OR-AND5R2", customer: "usr-c2", type: "hotel", slug: "andaman-cove-resort", roomIndex: 2, start: "2026-12-21", end: "2026-12-30", adults: 2, children: 2, status: "confirmed", createdAt: "2026-09-20T16:45:00Z" },
  { ref: "OR-QAS1W9", customer: "usr-c9", type: "hotel", slug: "qasr-noor-beach-resort", roomIndex: 1, start: "2026-10-09", end: "2026-10-13", adults: 2, children: 2, status: "confirmed", createdAt: "2026-09-25T11:00:00Z" },
  { ref: "OR-HAN2Z6", customer: "usr-c7", type: "hotel", slug: "hanami-ryokan-higashiyama", roomIndex: 0, start: "2026-11-15", end: "2026-11-17", adults: 2, status: "pending", payment: "authorized", createdAt: "2026-09-29T19:20:00Z" },
  { ref: "OR-RIV4D3", customer: "usr-c6", type: "hotel", slug: "hotel-rive-claire", roomIndex: 0, start: "2026-10-23", end: "2026-10-25", adults: 2, status: "confirmed", createdAt: "2026-09-27T07:55:00Z" },
  { ref: "OR-DOL7B8", customer: "usr-c4", type: "trip", slug: "dolomites-hut-to-hut", departureIndex: 0, start: "", adults: 2, status: "confirmed", createdAt: "2026-09-01T10:00:00Z" },
  { ref: "OR-LAP3F5", customer: "usr-c10", type: "trip", slug: "lapland-northern-lights", departureIndex: 0, start: "", adults: 2, children: 1, status: "confirmed", createdAt: "2026-09-18T10:00:00Z" },
  { ref: "OR-CAP9C1", customer: "usr-c3", type: "experience", slug: "cappadocia-sunrise-balloon", slot: "04:30", start: "2026-10-16", adults: 2, status: "confirmed", createdAt: "2026-09-26T10:00:00Z" },
  { ref: "OR-TKY6N2", customer: "usr-c8", type: "experience", slug: "tokyo-night-food-tour", slot: "18:00", start: "2026-10-21", adults: 3, status: "confirmed", createdAt: "2026-09-28T10:00:00Z" },
  { ref: "OR-SAN2L4", customer: "usr-c5", type: "hotel", slug: "aspro-villas-oia", roomIndex: 1, start: "2026-10-05", end: "2026-10-10", adults: 4, children: 1, status: "cancelled", payment: "partially-refunded", createdAt: "2026-07-11T10:00:00Z" },
  { ref: "OR-GAL8E7", customer: "usr-c2", type: "hotel", slug: "galata-konak-hotel", roomIndex: 0, start: "2026-05-02", end: "2026-05-05", adults: 1, status: "completed", createdAt: "2026-03-01T10:00:00Z" },
  { ref: "OR-SHI5U3", customer: "usr-c1", type: "hotel", slug: "shirogane-sky-hotel", roomIndex: 0, start: "2026-11-02", end: "2026-11-06", adults: 2, status: "confirmed", createdAt: "2026-09-30T06:40:00Z" },
];

let cache: Booking[] | null = null;

export function demoBookings(): Booking[] {
  if (cache) return cache;
  const out: Booking[] = [];
  for (const s of SEEDS) {
    const resolved = resolveBookable(s.type, s.slug);
    if (!resolved) continue;
    const customer = CUSTOMERS.find((c) => c.id === s.customer)!;
    const b = resolved.bookable;
    const roomId = b.type === "hotel" ? b.hotel.rooms[s.roomIndex ?? 0]?.id : undefined;
    const departure = b.type === "trip" ? b.trip.departures[s.departureIndex ?? 0] : undefined;
    const quoteDay = s.createdAt.slice(0, 10);
    const q = quoteBookable(b, resolved.destination, {
      roomId,
      departureId: departure?.id,
      timeSlot: s.slot,
      startDate: departure?.startDate ?? s.start,
      endDate: s.end,
      adults: s.adults,
      children: s.children ?? 0,
      rooms: 1,
      extras: s.extras ?? [],
      today: quoteDay,
      skipAvailability: true,
    });
    if (!q.ok) continue;
    const paymentStatus: PaymentStatus = s.payment ?? "paid";
    const refunded = paymentStatus === "refunded" ? q.price.dueNow : paymentStatus === "partially-refunded" ? Math.round(q.price.dueNow * 50) / 100 : 0;
    out.push({
      id: `bkg_${s.ref.toLowerCase().replace("-", "")}`,
      reference: s.ref,
      userId: customer.id,
      type: s.type,
      status: s.status,
      createdAt: s.createdAt,
      item: q.snapshot,
      startDate: q.startDate,
      endDate: q.endDate,
      guests: { adults: s.adults, children: s.children ?? 0, rooms: 1 },
      leadGuest: { firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: "+44 20 7946 0321", country: customer.country ?? "" },
      extras: s.extras ?? [],
      price: q.price,
      payment: {
        id: `pay_${s.ref.toLowerCase().replace("-", "")}`,
        bookingId: `bkg_${s.ref.toLowerCase().replace("-", "")}`,
        method: "card",
        cardBrand: "visa",
        last4: "4242",
        status: paymentStatus,
        amount: q.price.dueNow,
        refundedAmount: refunded,
        currency: "USD",
        createdAt: s.createdAt,
        billing: { line1: "12 Harbour Street", city: "London", postalCode: "E1 6AN", country: customer.country ?? "" },
      },
      cancellation: q.cancellation,
    });
  }
  cache = out;
  return out;
}

export const bookingsForUser = (userId: string) => demoBookings().filter((b) => b.userId === userId);
export const getDemoBooking = (reference: string) => demoBookings().find((b) => b.reference === reference);
