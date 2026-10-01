import type { AmenityId, Hotel, HotelRoom, PropertyType, TravelCategory } from "@/lib/models";
import { quoteHotel } from "@/lib/booking/pricing";
import { roomFitsParty } from "@/lib/booking/availability";
import { DESTINATIONS } from "@/lib/data/destinations";
import { todayISO } from "@/lib/dates";
import type {
  DisplayBadge,
  FeatureFilter,
  HotelSearchFacets,
  HotelSearchItem,
  HotelSearchQuery,
  HotelSearchResponse,
} from "@/lib/search/hotel-query";
import { listHotels } from "./catalog";

const BED_LABEL: Record<string, string> = { king: "king", queen: "queen", twin: "single", double: "double", futon: "futon", "sofa-bed": "sofa bed" };

export function bedsLabel(room: HotelRoom): string {
  return room.beds.map((b) => `${b.count} ${BED_LABEL[b.type]} bed${b.count > 1 ? "s" : ""}`).join(" + ");
}

const FEATURE_TO_AMENITY: Partial<Record<FeatureFilter, AmenityId>> = {
  pool: "pool",
  spa: "spa",
  parking: "parking",
  beachfront: "beachfront",
  "family-friendly": "family-friendly",
  "airport-transfer": "airport-transfer",
};

type FacetKey = "price" | "neighborhoods" | "types" | "stars" | "features";

function toItem(hotel: Hotel, q: HotelSearchQuery, today: string): HotelSearchItem | null {
  const destination = DESTINATIONS.find((d) => d.id === hotel.destinationId)!;
  // Choose the cheapest room that fits the party and is available for the whole stay.
  const candidates = hotel.rooms
    .filter((r) => roomFitsParty(r, q.adults, q.children, q.rooms))
    .map((room) => ({
      room,
      quote: quoteHotel({ hotel, room, checkIn: q.checkIn, checkOut: q.checkOut, rooms: q.rooms, adults: q.adults, children: q.children, today }),
    }))
    .filter((c) => c.quote.availability.available >= q.rooms)
    .sort((a, b) => a.quote.price.total - b.quote.price.total);
  const best = candidates[0];
  if (!best) return null;
  const { room, quote } = best;
  const price = quote.price;
  const nights = price.nights ?? 1;
  const dealLine = price.lines.find((l) => l.id === "deal");

  const badges: DisplayBadge[] = hotel.badges.filter((b) => b !== "limited");
  if (quote.availability.available <= 2 || hotel.badges.includes("limited")) badges.push("limited");
  if (room.cancellation.type === "free") badges.push("free-cancellation");
  if (room.breakfastIncluded) badges.push("breakfast");

  return {
    id: hotel.id,
    slug: hotel.slug,
    name: hotel.name,
    stars: hotel.stars,
    rating: hotel.rating,
    reviewCount: hotel.reviewCount,
    propertyType: hotel.propertyType,
    destinationName: destination.name,
    destinationSlug: destination.slug,
    country: destination.country,
    neighborhood: hotel.neighborhood,
    distanceKm: hotel.distanceFromCenterKm,
    coordinates: hotel.coordinates,
    images: hotel.images.slice(0, 4).map(({ src, alt }) => ({ src, alt })),
    amenities: hotel.amenities,
    badges: [...new Set(badges)],
    popularity: hotel.popularity,
    room: {
      id: room.id,
      name: room.name,
      bedsLabel: bedsLabel(room),
      cancellation: room.cancellation.type,
      cancellationSummary: room.cancellation.summary,
      breakfastIncluded: room.breakfastIncluded,
    },
    price: {
      perNight: Math.round((price.perNight ?? 0) / q.rooms),
      originalPerNight: dealLine ? Math.round(price.base / nights / q.rooms) : undefined,
      total: price.total,
      dueNow: price.dueNow,
      dueAtProperty: price.dueAtProperty,
      taxesAndFees: Math.round((price.taxes + price.fees) * 100) / 100,
      nights,
    },
    availableUnits: quote.availability.available,
    dealLabel: dealLine?.label,
  };
}

function matchesText(hotel: Hotel, text: string): boolean {
  if (!text) return true;
  const destination = DESTINATIONS.find((d) => d.id === hotel.destinationId)!;
  const hay = `${hotel.name} ${hotel.neighborhood} ${destination.name} ${destination.country} ${destination.region}`.toLowerCase();
  return text
    .toLowerCase()
    .split(/\s+/)
    .every((t) => hay.includes(t));
}

function featuresOf(item: HotelSearchItem): FeatureFilter[] {
  const feats: FeatureFilter[] = [];
  if (item.room.cancellation === "free") feats.push("free-cancellation");
  if (item.room.breakfastIncluded) feats.push("breakfast");
  for (const [f, a] of Object.entries(FEATURE_TO_AMENITY)) if (a && item.amenities.includes(a)) feats.push(f as FeatureFilter);
  return feats;
}

function passesFilters(item: HotelSearchItem, q: HotelSearchQuery, skip?: FacetKey): boolean {
  if (skip !== "price" && q.priceMin !== undefined && item.price.perNight < q.priceMin) return false;
  if (skip !== "price" && q.priceMax !== undefined && item.price.perNight > q.priceMax) return false;
  if (skip !== "stars" && q.stars.length && !q.stars.includes(item.stars)) return false;
  if (q.minRating !== undefined && item.rating < q.minRating) return false;
  if (skip !== "types" && q.types.length && !q.types.includes(item.propertyType)) return false;
  if (skip !== "neighborhoods" && q.neighborhoods.length && !q.neighborhoods.includes(item.neighborhood)) return false;
  if (q.amenities.length && !q.amenities.every((a) => item.amenities.includes(a))) return false;
  if (skip !== "features" && q.features.length) {
    const feats = featuresOf(item);
    if (!q.features.every((f) => feats.includes(f))) return false;
  }
  return true;
}

const score = (i: HotelSearchItem) => i.rating * 8 + i.popularity * 0.6 + (i.dealLabel ? 6 : 0) + (i.room.cancellation === "free" ? 3 : 0);

function sortItems(items: HotelSearchItem[], sort: HotelSearchQuery["sort"]) {
  const s = [...items];
  switch (sort) {
    case "price-asc":
      return s.sort((a, b) => a.price.perNight - b.price.perNight);
    case "price-desc":
      return s.sort((a, b) => b.price.perNight - a.price.perNight);
    case "rating":
      return s.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "distance":
      return s.sort((a, b) => a.distanceKm - b.distanceKm);
    case "popularity":
      return s.sort((a, b) => b.popularity - a.popularity);
    default:
      return s.sort((a, b) => score(b) - score(a));
  }
}

function tally<T>(items: HotelSearchItem[], keyFn: (i: HotelSearchItem) => T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const i of items) for (const k of keyFn(i)) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

export function searchHotels(q: HotelSearchQuery, today = todayISO()): HotelSearchResponse {
  const destination = DESTINATIONS.find((d) => d.slug === q.destination);
  const pool = listHotels()
    .filter((h) => (destination ? h.destinationId === destination.id : true))
    .filter((h) => (q.category ? h.categories.includes(q.category as TravelCategory) : true))
    .filter((h) => matchesText(h, q.q));

  const all = pool.map((h) => toItem(h, q, today)).filter((i): i is HotelSearchItem => Boolean(i));
  const filtered = all.filter((i) => passesFilters(i, q));
  const except = (k: FacetKey) => all.filter((x) => passesFilters(x, q, k));

  const prices = all.map((i) => i.price.perNight);
  const starCounts = tally(except("stars"), (i) => [i.stars]);
  const facets: HotelSearchFacets = {
    priceRange: prices.length ? [Math.floor(Math.min(...prices) / 10) * 10, Math.ceil(Math.max(...prices) / 10) * 10] : [0, 1000],
    neighborhoods: [...tally(except("neighborhoods"), (i) => [i.neighborhood])]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    types: [...tally(except("types"), (i) => [i.propertyType])].map(([id, count]) => ({ id: id as PropertyType, count })),
    stars: [5, 4, 3].map((value) => ({ value, count: starCounts.get(value) ?? 0 })),
    features: [...tally(except("features"), featuresOf)].map(([id, count]) => ({ id, count })),
  };

  return {
    query: q,
    items: sortItems(filtered, q.sort),
    total: filtered.length,
    facets,
    destination: destination ? { slug: destination.slug, name: destination.name, country: destination.country } : undefined,
  };
}
