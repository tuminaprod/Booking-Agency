/**
 * Domain models for the Oriel platform.
 *
 * Shared by the demo data layer, server services (src/server), the booking
 * engine (src/lib/booking) and the UI. They mirror the relational schema in
 * db/schema.sql so the in-memory repositories can be swapped for a database.
 *
 * Conventions
 * - Inventory is restricted to Tunisia (TN) and Algeria (DZ) — see lib/geo/countries.ts.
 * - Every monetary amount carries a currency. Inventory is priced in the
 *   country's local currency (TND / DZD); a booking is charged in the booking
 *   currency configured for that country (default: the local currency).
 * - Calendar dates are ISO strings in `YYYY-MM-DD` form (no time zone).
 */

import type { CountryCode } from "@/lib/geo/countries";
export type { CountryCode } from "@/lib/geo/countries";

export type ID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string;

export type CurrencyCode = "TND" | "DZD" | "EUR" | "USD";
/** Currencies an inventory item may be priced in (the two local currencies). */
export type LocalCurrency = "TND" | "DZD";
export type LanguageCode = "en" | "fr" | "ar";

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ImageAsset {
  src: string;
  alt: string;
}

/**
 * Provenance of an inventory record. Demo records are fictional and are
 * labelled as such in the UI; verified records come from a supplier import
 * (see src/server/importers/hotel-import.ts).
 */
export type DataSource = { kind: "demo"; note: string } | { kind: "verified"; supplier: string; externalId: string; verifiedAt: ISODateTime };

export type RecordStatus = "active" | "draft" | "archived";

/* ------------------------------------------------------------------ */
/* Taxonomy                                                            */
/* ------------------------------------------------------------------ */

export type TravelCategory = "beach" | "luxury" | "city" | "family" | "romantic" | "adventure" | "weekend" | "cultural" | "desert";

export type TripCategory = TravelCategory;

export type ExperienceCategory = "tours" | "food" | "adventure" | "culture" | "cruises" | "day-trips" | "private" | "nature" | "family" | "desert";

export type PropertyType = "hotel" | "resort" | "boutique" | "villa" | "apartment" | "dar" | "guesthouse" | "lodge" | "camp";

export type AmenityId =
  | "wifi"
  | "pool"
  | "spa"
  | "gym"
  | "parking"
  | "restaurant"
  | "bar"
  | "beachfront"
  | "airport-transfer"
  | "family-friendly"
  | "breakfast"
  | "room-service"
  | "concierge"
  | "pet-friendly"
  | "ev-charging"
  | "kids-club"
  | "air-conditioning"
  | "butler"
  | "hot-tub"
  | "hammam"
  | "golf";

export interface HotelAmenity {
  id: AmenityId;
  label: string;
  group: "essentials" | "wellness" | "dining" | "services" | "family" | "outdoors";
}

/* ------------------------------------------------------------------ */
/* Geography                                                           */
/* ------------------------------------------------------------------ */

export interface Destination {
  id: ID;
  slug: string;
  /** Display name, e.g. "Sidi Bou Said" */
  name: string;
  countryCode: CountryCode;
  regionId: ID;
  /** Municipality the destination belongs to */
  city: string;
  status: RecordStatus;
  tagline: string;
  description: string[];
  heroImage: ImageAsset;
  gallery: ImageAsset[];
  /** 0–100 */
  popularity: number;
  coordinates: Coordinates;
  bestTimeToVisit: { months: string; summary: string };
  facts: { language: string; timezone: string; gettingThere: string };
  neighborhoods: { name: string; description: string }[];
  thingsToDo: string[];
  travelTips: string[];
  itineraries: { title: string; days: number; summary: string; tripSlug?: string }[];
  /** Related destinations — always in the same country */
  relatedIds: ID[];
  categories: TravelCategory[];
}

export type AttractionType = "heritage" | "beach" | "nature" | "museum" | "religious" | "market" | "viewpoint" | "desert";

export interface Attraction {
  id: ID;
  destinationId: ID;
  name: string;
  description: string;
  type: AttractionType;
  coordinates: Coordinates;
}

/* ------------------------------------------------------------------ */
/* Hotels                                                              */
/* ------------------------------------------------------------------ */

export type HotelImageCategory = "exterior" | "pool" | "room" | "dining" | "spa" | "view" | "lobby" | "destination";

export interface HotelImage extends ImageAsset {
  id: ID;
  category: HotelImageCategory;
}

export type CancellationType = "free" | "partial" | "non-refundable";

export interface CancellationPolicy {
  type: CancellationType;
  /** Free cancellation allowed until this many days before the start date. */
  freeUntilDays?: number;
  /** Percentage refunded after the free window (partial policies). */
  refundPercentAfter?: number;
  summary: string;
}

export type HotelBadge = "popular" | "great-value" | "luxury" | "limited" | "new";

export interface MandatoryFee {
  id: ID;
  label: string;
  /** Amount in the hotel's currency */
  amount: number;
  per: "night" | "stay" | "guest-night";
  /** Some fees (e.g. the tourist tax) are collected at the property. */
  payableAt: "booking" | "property";
}

export interface HotelPolicies {
  checkIn: string; // "15:00"
  checkOut: string; // "11:00"
  children: string;
  pets: string;
  smoking: string;
  payment: string;
  extraNotes?: string[];
}

export interface NearbyPlace {
  name: string;
  type: "attraction" | "beach" | "transport" | "dining" | "shopping" | "nature";
  distanceKm: number;
}

export interface HotelDeal {
  percentOff: number;
  label: string;
  endsAt: ISODate;
}

export interface Hotel {
  id: ID;
  slug: string;
  name: string;
  /** Denormalised from the destination and verified on every write */
  countryCode: CountryCode;
  regionId: ID;
  destinationId: ID;
  status: RecordStatus;
  source: DataSource;
  /** Currency the hotel's rates and fees are stored in */
  currency: LocalCurrency;
  propertyType: PropertyType;
  stars: 1 | 2 | 3 | 4 | 5;
  /** Guest rating on a 0–10 scale */
  rating: number;
  reviewCount: number;
  address: string;
  neighborhood: string;
  coordinates: Coordinates;
  distanceFromCenterKm: number;
  shortDescription: string;
  description: string[];
  highlights: string[];
  images: HotelImage[];
  amenities: AmenityId[];
  policies: HotelPolicies;
  nearby: NearbyPlace[];
  rooms: HotelRoom[];
  badges: HotelBadge[];
  /** 0–100 popularity index used for "Popularity" sorting */
  popularity: number;
  categories: TravelCategory[];
  contact: { phone: string; email: string };
  /** Combined VAT/sales tax rate applied to room + taxable extras (0.07 = 7%) */
  taxRate: number;
  fees: MandatoryFee[];
  deal?: HotelDeal;
  createdAt: ISODateTime;
}

export type BedType = "king" | "queen" | "twin" | "double" | "sofa-bed";
export type RoomType = "standard" | "superior" | "deluxe" | "suite" | "family" | "villa" | "tent";

export interface HotelRoom {
  id: ID;
  hotelId: ID;
  name: string;
  roomType: RoomType;
  description: string;
  images: ImageAsset[];
  beds: { type: BedType; count: number }[];
  maxAdults: number;
  maxChildren: number;
  sizeSqm: number;
  view?: string;
  amenities: string[];
  breakfastIncluded: boolean;
  cancellation: CancellationPolicy;
  /** Base nightly rate (in `currency`) before seasonal/weekend adjustments */
  basePrice: number;
  currency: LocalCurrency;
  /** Number of units of this room type the property holds */
  inventory: number;
}

/* ------------------------------------------------------------------ */
/* Availability & pricing                                              */
/* ------------------------------------------------------------------ */

export interface Availability {
  entityId: ID;
  date: ISODate;
  available: number;
  /** Nightly (or per-person) price for that date, in the item's currency */
  price: number;
  closed: boolean;
}

export type PriceLineKind = "base" | "discount" | "extra" | "tax" | "fee";

export interface PriceLine {
  id: string;
  kind: PriceLineKind;
  label: string;
  /** Signed amount in the price's currency — discounts are negative */
  amount: number;
  detail?: string;
  payableAt?: "booking" | "property";
}

/** A fully itemised price in a single currency. Every total shown in the UI derives from this. */
export interface Price {
  currency: CurrencyCode;
  lines: PriceLine[];
  base: number;
  discounts: number;
  extras: number;
  taxes: number;
  fees: number;
  dueNow: number;
  dueAtProperty: number;
  total: number;
  nights?: number;
  perNight?: number;
}

/* ------------------------------------------------------------------ */
/* Trips                                                               */
/* ------------------------------------------------------------------ */

export type Meal = "breakfast" | "lunch" | "dinner";

export interface TripDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: Meal[];
  overnight?: string;
}

export interface TripDeparture {
  id: ID;
  startDate: ISODate;
  seatsLeft: number;
  /** Per-person price for this departure, in the trip's currency */
  price: number;
}

export interface Trip {
  id: ID;
  slug: string;
  title: string;
  countryCode: CountryCode;
  /** First entry is the primary destination; all must be in `countryCode` */
  destinationIds: ID[];
  status: RecordStatus;
  currency: LocalCurrency;
  source: DataSource;
  stops: string[];
  category: TripCategory;
  secondaryCategories: TripCategory[];
  durationDays: number;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  images: ImageAsset[];
  summary: string;
  overview: string[];
  highlights: string[];
  days: TripDay[];
  accommodation: { name: string; nights: number; hotelSlug?: string; description: string }[];
  included: string[];
  excluded: string[];
  meetingPoint: { name: string; address: string; time: string; notes: string };
  importantInfo: string[];
  groupSize: { min: number; max: number };
  departures: TripDeparture[];
  cancellation: CancellationPolicy;
  taxRate: number;
}

/* ------------------------------------------------------------------ */
/* Experiences                                                         */
/* ------------------------------------------------------------------ */

export interface Experience {
  id: ID;
  slug: string;
  title: string;
  countryCode: CountryCode;
  destinationId: ID;
  status: RecordStatus;
  currency: LocalCurrency;
  source: DataSource;
  category: ExperienceCategory;
  durationHours: number;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  images: ImageAsset[];
  summary: string;
  description: string[];
  highlights: string[];
  itinerary: { time: string; title: string; description: string }[];
  meetingPoint: { name: string; address: string; notes: string };
  included: string[];
  excluded: string[];
  requirements: string[];
  languages: string[];
  groupSize: { max: number; private: boolean };
  timeSlots: string[];
  /** Weekday numbers (0 = Sunday) on which it runs */
  runsOn: number[];
  cancellation: CancellationPolicy;
  taxRate: number;
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

export type ReviewableType = "hotel" | "trip" | "experience";
export type TravelerType = "couple" | "family" | "solo" | "business" | "friends";

export interface Review {
  id: ID;
  entityType: ReviewableType;
  entityId: ID;
  author: string;
  country: string;
  rating: number;
  title: string;
  body: string;
  date: ISODate;
  travelerType: TravelerType;
  status: "published" | "pending" | "flagged";
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export interface Traveler {
  id: ID;
  firstName: string;
  lastName: string;
  dateOfBirth?: ISODate;
  relation: "self" | "partner" | "child" | "friend" | "family";
}

export interface SavedPaymentMethod {
  id: ID;
  brand: "visa" | "mastercard" | "amex";
  last4: string;
  expMonth: number;
  expYear: number;
  holder: string;
  isDefault: boolean;
}

export interface NotificationPreferences {
  bookingUpdates: boolean;
  priceAlerts: boolean;
  tripReminders: boolean;
  newsletter: boolean;
  sms: boolean;
}

export interface User {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  /** Country of residence — any country; unrelated to the destination restriction */
  country?: string;
  role: "customer" | "admin";
  emailVerified: boolean;
  createdAt: ISODateTime;
  preferences: {
    currency: CurrencyCode | "auto";
    language: LanguageCode;
    travelStyle: TravelCategory[];
    notifications: NotificationPreferences;
  };
  travelers: Traveler[];
  paymentMethods: SavedPaymentMethod[];
}

/* ------------------------------------------------------------------ */
/* Bookings & payments                                                 */
/* ------------------------------------------------------------------ */

export type BookableType = "hotel" | "trip" | "experience";
export type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed";

export interface BookingGuest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
}

export interface BillingAddress {
  line1: string;
  city: string;
  postalCode: string;
  country: string;
}

export type PaymentStatus = "paid" | "authorized" | "pending" | "failed" | "refunded" | "partially-refunded";
export type PaymentMethod = "card" | "cash";

export interface Payment {
  id: ID;
  bookingId: ID;
  /** "cash" = paid in person at the property / to the operator on arrival */
  method: PaymentMethod;
  cardBrand?: "visa" | "mastercard" | "amex" | "unknown";
  last4?: string;
  status: PaymentStatus;
  amount: number;
  refundedAmount: number;
  currency: CurrencyCode;
  createdAt: ISODateTime;
  billing?: BillingAddress;
}

export interface Extra {
  id: ID;
  label: string;
  description: string;
  /** Reference price in EUR; converted to the booking currency at quote time */
  price: number;
  per: "stay" | "night" | "guest" | "guest-night";
  appliesTo: BookableType[];
  taxable: boolean;
}

export interface SelectedExtra {
  extraId: ID;
  quantity: number;
}

export interface BookingItemSnapshot {
  entityId: ID;
  slug: string;
  title: string;
  image: ImageAsset;
  destinationName: string;
  countryName?: string;
  address?: string;
  roomId?: ID;
  roomName?: string;
  departureId?: ID;
  timeSlot?: string;
  contact?: { phone: string; email: string };
  coordinates?: Coordinates;
  checkInTime?: string;
  checkOutTime?: string;
}

export type AttributionSource = "facebook" | "instagram" | "google" | "email" | "direct" | "other";

/** Marketing attribution captured from the landing URL (UTM parameters, click ids). */
export interface Attribution {
  source: AttributionSource;
  medium?: string;
  campaign?: string;
  content?: string;
  clickId?: string;
  landingPath?: string;
  capturedAt: ISODateTime;
}

export interface Booking {
  id: ID;
  reference: string;
  userId?: ID;
  type: BookableType;
  /** Country of the booked item. Absent only on archived legacy bookings. */
  countryCode?: CountryCode;
  channel: "checkout" | "quick_reservation";
  attribution?: Attribution;
  /**
   * True for bookings whose listing is no longer in the catalogue (e.g. the
   * previous international catalogue). The booking and its snapshot are
   * preserved; links to the listing are disabled.
   */
  legacy?: boolean;
  status: BookingStatus;
  createdAt: ISODateTime;
  item: BookingItemSnapshot;
  startDate: ISODate;
  endDate: ISODate;
  guests: { adults: number; children: number; rooms: number };
  leadGuest: BookingGuest;
  specialRequests?: string;
  extras: SelectedExtra[];
  promoCode?: string;
  price: Price;
  payment: Payment;
  cancellation: CancellationPolicy;
}

/* ------------------------------------------------------------------ */
/* Wishlist                                                            */
/* ------------------------------------------------------------------ */

export type SavableType = "hotel" | "destination" | "trip" | "experience";

export interface WishlistItem {
  id: ID;
  type: SavableType;
  entityId: ID;
  addedAt: ISODateTime;
  collectionIds: ID[];
}

export interface WishlistCollection {
  id: ID;
  name: string;
  createdAt: ISODateTime;
}

export interface Wishlist {
  userId?: ID;
  items: WishlistItem[];
  collections: WishlistCollection[];
}

/* ------------------------------------------------------------------ */
/* Promotions                                                          */
/* ------------------------------------------------------------------ */

export interface Promotion {
  id: ID;
  code: string;
  title: string;
  description: string;
  type: "percent" | "fixed";
  /** Percentage, or a fixed amount in EUR converted to the booking currency */
  value: number;
  /** Minimum spend in EUR, compared after conversion */
  minSpend?: number;
  minNights?: number;
  countries: CountryCode[];
  appliesTo: BookableType[];
  validFrom: ISODate;
  validTo: ISODate;
  active: boolean;
  usageCount: number;
}

/* ------------------------------------------------------------------ */
/* Editorial                                                           */
/* ------------------------------------------------------------------ */

export type GuideCategory =
  | "destination-guides"
  | "things-to-do"
  | "travel-tips"
  | "best-hotels"
  | "food-guides"
  | "weekend-itineraries"
  | "family-travel"
  | "luxury-travel";

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "tip"; title: string; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; image: ImageAsset; caption?: string };

export interface GuideSection {
  id: string;
  heading: string;
  blocks: GuideBlock[];
}

export interface TravelGuide {
  id: ID;
  slug: string;
  title: string;
  excerpt: string;
  category: GuideCategory;
  author: { name: string; role: string };
  publishedAt: ISODate;
  updatedAt?: ISODate;
  readingMinutes: number;
  heroImage: ImageAsset;
  sections: GuideSection[];
  countryCodes: CountryCode[];
  relatedDestinationIds: ID[];
  relatedHotelIds: ID[];
  relatedExperienceIds: ID[];
}
