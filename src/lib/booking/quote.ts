import type {
  BookingItemSnapshot,
  CancellationPolicy,
  Experience,
  Hotel,
  ISODate,
  Price,
  Promotion,
  SelectedExtra,
  Trip,
} from "@/lib/models";
import { EXTRAS } from "@/lib/data/catalog";
import { addDays, diffDays } from "@/lib/dates";
import { experienceSpots, roomFitsParty } from "./availability";
import { quoteExperience, quoteHotel, quoteTrip } from "./pricing";

/**
 * Turns "what the customer picked" into a priced, validated quote. The exact
 * same function runs in the browser (live checkout summary) and on the server
 * (authoritative re-pricing before payment).
 */

export type Bookable =
  | { type: "hotel"; hotel: Hotel }
  | { type: "trip"; trip: Trip }
  | { type: "experience"; experience: Experience };

export interface QuoteParams {
  roomId?: string;
  departureId?: string;
  timeSlot?: string;
  startDate: ISODate;
  endDate?: ISODate;
  adults: number;
  children: number;
  rooms: number;
  extras: SelectedExtra[];
  promotion?: Promotion | null;
  today: ISODate;
  /** Only for importing historical/seed bookings — never set from a customer request. */
  skipAvailability?: boolean;
}

export type QuoteResult =
  | {
      ok: true;
      price: Price;
      startDate: ISODate;
      endDate: ISODate;
      cancellation: CancellationPolicy;
      snapshot: BookingItemSnapshot;
      available: number;
    }
  | { ok: false; code: "not_found" | "invalid_dates" | "unavailable" | "party_size"; reason: string };

export function extrasFor(type: Bookable["type"]) {
  return EXTRAS.filter((e) => e.appliesTo.includes(type));
}

export function quoteBookable(b: Bookable, destinationName: string, p: QuoteParams): QuoteResult {
  if (p.startDate < p.today) return { ok: false, code: "invalid_dates", reason: "The start date is in the past." };

  if (b.type === "hotel") {
    const { hotel } = b;
    const room = hotel.rooms.find((r) => r.id === p.roomId);
    if (!room) return { ok: false, code: "not_found", reason: "Please choose a room." };
    const endDate = p.endDate ?? addDays(p.startDate, 1);
    const nights = diffDays(p.startDate, endDate);
    if (nights < 1 || nights > 30) return { ok: false, code: "invalid_dates", reason: "Stays must be between 1 and 30 nights." };
    if (!roomFitsParty(room, p.adults, p.children, p.rooms)) {
      return { ok: false, code: "party_size", reason: `${room.name} sleeps up to ${room.maxAdults + room.maxChildren} guests per room. Add a room or choose a larger room type.` };
    }
    const { price, availability } = quoteHotel({
      hotel,
      room,
      checkIn: p.startDate,
      checkOut: endDate,
      rooms: p.rooms,
      adults: p.adults,
      children: p.children,
      extras: p.extras,
      extrasCatalog: extrasFor("hotel"),
      promotion: p.promotion,
      today: p.today,
    });
    if (!p.skipAvailability && availability.available < p.rooms) {
      return { ok: false, code: "unavailable", reason: "Sorry — this room has just sold out for some of your dates. Please choose another room or dates." };
    }
    return {
      ok: true,
      price,
      startDate: p.startDate,
      endDate,
      cancellation: room.cancellation,
      available: availability.available,
      snapshot: {
        entityId: hotel.id,
        slug: hotel.slug,
        title: hotel.name,
        image: { src: hotel.images[0].src, alt: hotel.images[0].alt },
        destinationName,
        address: hotel.address,
        roomId: room.id,
        roomName: room.name,
        contact: hotel.contact,
        coordinates: hotel.coordinates,
        checkInTime: hotel.policies.checkIn,
        checkOutTime: hotel.policies.checkOut,
      },
    };
  }

  if (b.type === "trip") {
    const { trip } = b;
    const departure = trip.departures.find((d) => d.id === p.departureId);
    if (!departure) return { ok: false, code: "not_found", reason: "Please choose a departure date." };
    if (departure.startDate < p.today) return { ok: false, code: "invalid_dates", reason: "This departure has already left." };
    const travellers = p.adults + p.children;
    if (!p.skipAvailability && departure.seatsLeft < travellers) {
      return { ok: false, code: "unavailable", reason: departure.seatsLeft === 0 ? "This departure is sold out." : `Only ${departure.seatsLeft} places left on this departure.` };
    }
    if (travellers > trip.groupSize.max) return { ok: false, code: "party_size", reason: `This trip takes up to ${trip.groupSize.max} travellers.` };
    const price = quoteTrip({ trip, departure, adults: p.adults, children: p.children, extras: p.extras, extrasCatalog: extrasFor("trip"), promotion: p.promotion });
    return {
      ok: true,
      price,
      startDate: departure.startDate,
      endDate: addDays(departure.startDate, trip.durationDays - 1),
      cancellation: trip.cancellation,
      available: departure.seatsLeft,
      snapshot: {
        entityId: trip.id,
        slug: trip.slug,
        title: trip.title,
        image: trip.images[0],
        destinationName,
        address: trip.meetingPoint.address,
        departureId: departure.id,
      },
    };
  }

  const { experience } = b;
  if (!p.timeSlot || !experience.timeSlots.includes(p.timeSlot)) return { ok: false, code: "not_found", reason: "Please choose a time." };
  const spots = experienceSpots(experience, p.startDate, p.timeSlot);
  const people = p.adults + p.children;
  if (!p.skipAvailability && spots < people) {
    return { ok: false, code: "unavailable", reason: spots === 0 ? "This time is fully booked. Please choose another time or date." : `Only ${spots} spots left at this time.` };
  }
  const price = quoteExperience({ experience, adults: p.adults, children: p.children, extras: p.extras, extrasCatalog: extrasFor("experience"), promotion: p.promotion });
  return {
    ok: true,
    price,
    startDate: p.startDate,
    endDate: p.startDate,
    cancellation: experience.cancellation,
    available: spots,
    snapshot: {
      entityId: experience.id,
      slug: experience.slug,
      title: experience.title,
      image: experience.images[0],
      destinationName,
      address: experience.meetingPoint.address,
      timeSlot: p.timeSlot,
    },
  };
}
