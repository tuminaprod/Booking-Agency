/**
 * Read-side repositories. Every page and API route goes through these
 * functions rather than importing demo data directly, so replacing the demo
 * data with a database only requires changing this module.
 */
import type { Destination, Experience, Hotel, Review, ReviewableType, TravelGuide, Trip } from "@/lib/models";
import { DESTINATIONS } from "@/lib/data/destinations";
import { EXPERIENCES } from "@/lib/data/experiences";
import { GUIDES } from "@/lib/data/guides";
import { HOTELS } from "@/lib/data/hotels";
import { PROMOTIONS } from "@/lib/data/promotions";
import { REVIEWS } from "@/lib/data/reviews";
import { TRIPS } from "@/lib/data/trips";

export const listHotels = (): Hotel[] => HOTELS;
export const getHotel = (slug: string) => HOTELS.find((h) => h.slug === slug);
export const getHotelById = (id: string) => HOTELS.find((h) => h.id === id);
export const hotelsInDestination = (destinationId: string) => HOTELS.filter((h) => h.destinationId === destinationId);

export const listDestinations = (): Destination[] => DESTINATIONS;
export const getDestination = (slug: string) => DESTINATIONS.find((d) => d.slug === slug);
export const getDestinationById = (id: string) => DESTINATIONS.find((d) => d.id === id);

export const listTrips = (): Trip[] => TRIPS;
export const getTrip = (slug: string) => TRIPS.find((t) => t.slug === slug);
export const tripsInDestination = (destinationId: string) => TRIPS.filter((t) => t.destinationId === destinationId);

export const listExperiences = (): Experience[] => EXPERIENCES;
export const getExperience = (slug: string) => EXPERIENCES.find((e) => e.slug === slug);
export const experiencesInDestination = (destinationId: string) => EXPERIENCES.filter((e) => e.destinationId === destinationId);

export const listGuides = (): TravelGuide[] => [...GUIDES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);

export const listPromotions = () => PROMOTIONS;

export function reviewsFor(type: ReviewableType, id: string): Review[] {
  return REVIEWS.filter((r) => r.entityType === type && r.entityId === id && r.status === "published");
}
export const listReviews = () => REVIEWS;

export interface DestinationStats {
  hotelCount: number;
  experienceCount: number;
  tripCount: number;
  startingHotelPrice: number | null;
}

export function destinationStats(destinationId: string): DestinationStats {
  const hotels = hotelsInDestination(destinationId);
  const prices = hotels.flatMap((h) => h.rooms.map((r) => r.basePrice));
  return {
    hotelCount: hotels.length,
    experienceCount: experiencesInDestination(destinationId).length,
    tripCount: tripsInDestination(destinationId).length,
    startingHotelPrice: prices.length ? Math.min(...prices) : null,
  };
}

export function hotelStartingPrice(hotel: Hotel): number {
  return Math.min(...hotel.rooms.map((r) => r.basePrice));
}

export function destinationName(id: string): string {
  return getDestinationById(id)?.name ?? "";
}
