import type { AmenityId, CancellationType, HotelBadge, ImageAsset, ISODate, PropertyType } from "@/lib/models";
import { addDays, isValidISODate } from "@/lib/dates";

export const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Guest rating" },
  { id: "distance", label: "Distance from centre" },
  { id: "popularity", label: "Popularity" },
] as const;

export type HotelSort = (typeof SORT_OPTIONS)[number]["id"];

/** Filter toggles that map to amenities, exposed as first-class filters. */
export const FEATURE_FILTERS = [
  { id: "free-cancellation", label: "Free cancellation" },
  { id: "breakfast", label: "Breakfast included" },
  { id: "pool", label: "Pool" },
  { id: "spa", label: "Spa" },
  { id: "parking", label: "Parking" },
  { id: "beachfront", label: "Beachfront" },
  { id: "family-friendly", label: "Family friendly" },
  { id: "airport-transfer", label: "Airport transfer" },
] as const;
export type FeatureFilter = (typeof FEATURE_FILTERS)[number]["id"];

export interface HotelSearchQuery {
  destination: string; // destination slug, or "" for anywhere
  q: string; // free-text
  checkIn: ISODate;
  checkOut: ISODate;
  adults: number;
  children: number;
  rooms: number;
  priceMin?: number;
  priceMax?: number;
  stars: number[];
  minRating?: number;
  types: PropertyType[];
  amenities: AmenityId[];
  features: FeatureFilter[];
  neighborhoods: string[];
  category?: string;
  sort: HotelSort;
}

const clampInt = (v: string | null, min: number, max: number, fallback: number) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const list = (sp: URLSearchParams, key: string) => (sp.get(key) ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function parseHotelQuery(sp: URLSearchParams, defaults: { checkIn: ISODate; checkOut: ISODate }): HotelSearchQuery {
  let checkIn = sp.get("checkIn") ?? "";
  let checkOut = sp.get("checkOut") ?? "";
  if (!isValidISODate(checkIn)) checkIn = defaults.checkIn;
  if (!isValidISODate(checkOut) || checkOut <= checkIn) checkOut = addDays(checkIn, Math.max(1, 3));
  const sort = (SORT_OPTIONS.find((s) => s.id === sp.get("sort"))?.id ?? "recommended") as HotelSort;
  const num = (k: string) => {
    const n = Number(sp.get(k));
    return sp.get(k) && Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  return {
    destination: sp.get("destination") ?? "",
    q: (sp.get("q") ?? "").slice(0, 80),
    checkIn,
    checkOut,
    adults: clampInt(sp.get("adults"), 1, 16, 2),
    children: clampInt(sp.get("children"), 0, 10, 0),
    rooms: clampInt(sp.get("rooms"), 1, 8, 1),
    priceMin: num("priceMin"),
    priceMax: num("priceMax"),
    stars: list(sp, "stars").map(Number).filter((n) => n >= 1 && n <= 5),
    minRating: num("minRating"),
    types: list(sp, "types") as PropertyType[],
    amenities: list(sp, "amenities") as AmenityId[],
    features: list(sp, "features") as FeatureFilter[],
    neighborhoods: list(sp, "neighborhoods"),
    category: sp.get("category") ?? undefined,
    sort,
  };
}

export function serializeHotelQuery(q: Partial<HotelSearchQuery>): string {
  const sp = new URLSearchParams();
  const set = (k: string, v: unknown) => {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) return;
    sp.set(k, Array.isArray(v) ? v.join(",") : String(v));
  };
  set("destination", q.destination);
  set("q", q.q);
  set("checkIn", q.checkIn);
  set("checkOut", q.checkOut);
  if (q.adults !== undefined && q.adults !== 2) set("adults", q.adults);
  if (q.children) set("children", q.children);
  if (q.rooms !== undefined && q.rooms !== 1) set("rooms", q.rooms);
  set("priceMin", q.priceMin);
  set("priceMax", q.priceMax);
  set("stars", q.stars);
  set("minRating", q.minRating);
  set("types", q.types);
  set("amenities", q.amenities);
  set("features", q.features);
  set("neighborhoods", q.neighborhoods);
  set("category", q.category);
  if (q.sort && q.sort !== "recommended") set("sort", q.sort);
  return sp.toString();
}

export type DisplayBadge = HotelBadge | "free-cancellation" | "breakfast";

/** Compact, serialisable hotel result consumed by the client. */
export interface HotelSearchItem {
  id: string;
  slug: string;
  name: string;
  stars: number;
  rating: number;
  reviewCount: number;
  propertyType: PropertyType;
  destinationName: string;
  destinationSlug: string;
  country: string;
  neighborhood: string;
  distanceKm: number;
  coordinates: { lat: number; lng: number };
  images: ImageAsset[];
  amenities: AmenityId[];
  badges: DisplayBadge[];
  popularity: number;
  room: {
    id: string;
    name: string;
    bedsLabel: string;
    cancellation: CancellationType;
    cancellationSummary: string;
    breakfastIncluded: boolean;
  };
  price: {
    perNight: number;
    originalPerNight?: number;
    total: number;
    dueNow: number;
    dueAtProperty: number;
    taxesAndFees: number;
    nights: number;
  };
  availableUnits: number;
  dealLabel?: string;
}

export interface HotelSearchFacets {
  priceRange: [number, number];
  neighborhoods: { name: string; count: number }[];
  types: { id: PropertyType; count: number }[];
  stars: { value: number; count: number }[];
  features: { id: FeatureFilter; count: number }[];
}

export interface HotelSearchResponse {
  query: HotelSearchQuery;
  items: HotelSearchItem[];
  total: number;
  facets: HotelSearchFacets;
  destination?: { slug: string; name: string; country: string };
}
