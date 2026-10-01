import type { Availability, Experience, Hotel, HotelRoom, ISODate, Trip, TripDeparture } from "@/lib/models";
import { eachDate, parseISODate, weekday } from "@/lib/dates";
import { unit } from "@/lib/seed";

/**
 * Deterministic availability & dynamic pricing.
 *
 * In production this would be backed by an inventory service; here we derive
 * stable values from the room id + date so every page, API route and test sees
 * the same numbers.
 */

const PEAK_MONTHS: Record<string, { peak: number[]; shoulder: number[] }> = {
  "dst-maldives": { peak: [12, 1, 2, 3, 4], shoulder: [11] },
  "dst-bali": { peak: [7, 8, 12], shoulder: [4, 5, 6, 9] },
  "dst-phuket": { peak: [12, 1, 2, 3], shoulder: [11, 4] },
  "dst-dubai": { peak: [12, 1, 2, 3], shoulder: [11, 4] },
  "dst-lapland": { peak: [12, 1, 2, 3], shoulder: [11] },
  "dst-kyoto": { peak: [3, 4, 11], shoulder: [5, 10, 12] },
  "dst-dolomites": { peak: [7, 8, 1, 2], shoulder: [6, 9, 12, 3] },
};
const DEFAULT_SEASON = { peak: [6, 7, 8], shoulder: [4, 5, 9, 10] };

export function seasonalMultiplier(destinationId: string, date: ISODate): number {
  const month = parseISODate(date).getUTCMonth() + 1;
  const season = PEAK_MONTHS[destinationId] ?? DEFAULT_SEASON;
  if (season.peak.includes(month)) return 1.22;
  if (season.shoulder.includes(month)) return 1.08;
  return 1;
}

export function nightlyRate(hotel: Hotel, room: HotelRoom, date: ISODate): number {
  const dow = weekday(date);
  const weekend = dow === 5 || dow === 6 ? 1.12 : 1;
  const jitter = 0.97 + unit(`${room.id}:${date}:p`) * 0.06; // ±3% demand noise
  return Math.round(room.basePrice * seasonalMultiplier(hotel.destinationId, date) * weekend * jitter);
}

export function roomAvailability(hotel: Hotel, room: HotelRoom, date: ISODate): Availability {
  // Skewed so most nights have space, with occasional scarcity and rare sell-outs.
  const u = unit(`${room.id}:${date}:a`);
  const booked = Math.floor(u * u * (room.inventory + 0.5));
  const available = Math.max(0, room.inventory - booked);
  return { entityId: room.id, date, available, price: nightlyRate(hotel, room, date), closed: available === 0 };
}

export interface StayAvailability {
  nights: Availability[];
  /** Units available for the full stay (min across nights) */
  available: number;
  bookable: boolean;
}

export function stayAvailability(hotel: Hotel, room: HotelRoom, checkIn: ISODate, checkOut: ISODate): StayAvailability {
  const nights = eachDate(checkIn, checkOut).map((d) => roomAvailability(hotel, room, d));
  const available = nights.length ? Math.min(...nights.map((n) => n.available)) : 0;
  return { nights, available, bookable: nights.length > 0 && available > 0 };
}

export function roomFitsParty(room: HotelRoom, adults: number, children: number, rooms: number): boolean {
  const perRoomAdults = Math.ceil(adults / rooms);
  const perRoomChildren = Math.ceil(children / rooms);
  return perRoomAdults <= room.maxAdults && perRoomAdults + perRoomChildren <= room.maxAdults + room.maxChildren;
}

export function upcomingDepartures(trip: Trip, today: ISODate): TripDeparture[] {
  return trip.departures.filter((d) => d.startDate > today);
}

export function experienceRunsOn(experience: Experience, date: ISODate): boolean {
  return experience.runsOn.includes(weekday(date));
}

export function experienceSpots(experience: Experience, date: ISODate, slot: string): number {
  if (!experienceRunsOn(experience, date)) return 0;
  const taken = Math.floor(unit(`${experience.id}:${date}:${slot}`) * (experience.groupSize.max + 2));
  return Math.max(0, experience.groupSize.max - taken);
}
