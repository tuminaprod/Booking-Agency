import type {
  AmenityId,
  Extra,
  ExperienceCategory,
  GuideCategory,
  HotelAmenity,
  PropertyType,
  TravelCategory,
} from "@/lib/models";
import type { PhotoKey } from "./photos";

export const AMENITIES: Record<AmenityId, HotelAmenity> = {
  wifi: { id: "wifi", label: "Free Wi-Fi", group: "essentials" },
  "air-conditioning": { id: "air-conditioning", label: "Air conditioning", group: "essentials" },
  parking: { id: "parking", label: "Parking", group: "essentials" },
  "ev-charging": { id: "ev-charging", label: "EV charging", group: "essentials" },
  pool: { id: "pool", label: "Pool", group: "wellness" },
  spa: { id: "spa", label: "Spa", group: "wellness" },
  gym: { id: "gym", label: "Fitness centre", group: "wellness" },
  "hot-tub": { id: "hot-tub", label: "Hot tub", group: "wellness" },
  restaurant: { id: "restaurant", label: "Restaurant", group: "dining" },
  bar: { id: "bar", label: "Bar & lounge", group: "dining" },
  breakfast: { id: "breakfast", label: "Breakfast available", group: "dining" },
  "room-service": { id: "room-service", label: "24h room service", group: "dining" },
  concierge: { id: "concierge", label: "Concierge", group: "services" },
  butler: { id: "butler", label: "Butler service", group: "services" },
  "airport-transfer": { id: "airport-transfer", label: "Airport transfer", group: "services" },
  "pet-friendly": { id: "pet-friendly", label: "Pet friendly", group: "services" },
  "family-friendly": { id: "family-friendly", label: "Family friendly", group: "family" },
  "kids-club": { id: "kids-club", label: "Kids' club", group: "family" },
  beachfront: { id: "beachfront", label: "Beachfront", group: "outdoors" },
  "ski-storage": { id: "ski-storage", label: "Ski storage", group: "outdoors" },
};

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  hotel: "Hotel",
  resort: "Resort",
  boutique: "Boutique hotel",
  villa: "Villa",
  apartment: "Apartment",
  ryokan: "Ryokan",
  riad: "Riad",
  lodge: "Lodge",
};

export interface CategoryMeta<T extends string> {
  id: T;
  label: string;
  description: string;
  image: PhotoKey;
}

/** Homepage / discovery categories */
export const TRAVEL_CATEGORIES: CategoryMeta<TravelCategory>[] = [
  { id: "beach", label: "Beach escapes", description: "Barefoot days and warm water", image: "palmBeach" },
  { id: "luxury", label: "Luxury resorts", description: "Private pools, personal service", image: "maldivesVilla" },
  { id: "city", label: "City breaks", description: "Culture, dining and design", image: "parisBridge" },
  { id: "family", label: "Family holidays", description: "Space and fun for everyone", image: "turquoiseBoats" },
  { id: "romantic", label: "Romantic getaways", description: "Sunsets made for two", image: "oia" },
  { id: "adventure", label: "Adventure", description: "Peaks, reefs and wild places", image: "peaksClouds" },
  { id: "weekend", label: "Weekend escapes", description: "Short trips, big resets", image: "vernazza" },
  { id: "cultural", label: "Cultural trips", description: "Temples, souks and old towns", image: "kyotoPagoda" },
];

export const TRIP_CATEGORY_LABEL: Record<TravelCategory, string> = {
  beach: "Beach holidays",
  city: "City trips",
  adventure: "Adventure trips",
  family: "Family trips",
  romantic: "Romantic trips",
  luxury: "Luxury trips",
  cultural: "Cultural trips",
  weekend: "Weekend trips",
};

export const EXPERIENCE_CATEGORIES: CategoryMeta<ExperienceCategory>[] = [
  { id: "tours", label: "Tours", description: "Guided by locals", image: "kyotoStreet" },
  { id: "food", label: "Food experiences", description: "Markets, tastings, kitchens", image: "foodSpread" },
  { id: "adventure", label: "Adventure", description: "Get the heart racing", image: "scuba" },
  { id: "culture", label: "Culture", description: "Art, craft and heritage", image: "blueMosque" },
  { id: "cruises", label: "Cruises", description: "Time on the water", image: "halong" },
  { id: "day-trips", label: "Day trips", description: "Beyond the city limits", image: "limestoneIsland" },
  { id: "private", label: "Private experiences", description: "Just you and your guide", image: "colosseum" },
  { id: "nature", label: "Nature", description: "Lakes, forests, wildlife", image: "braiesBoat" },
  { id: "family", label: "Family activities", description: "Loved by all ages", image: "turquoiseBoats" },
];

export const GUIDE_CATEGORY_LABEL: Record<GuideCategory, string> = {
  "destination-guides": "Destination guides",
  "things-to-do": "Things to do",
  "travel-tips": "Travel tips",
  "best-hotels": "Best hotels",
  "food-guides": "Food guides",
  "weekend-itineraries": "Weekend itineraries",
  "family-travel": "Family travel",
  "luxury-travel": "Luxury travel",
};

/** Add-ons offered during checkout. Prices in USD. */
export const EXTRAS: Extra[] = [
  {
    id: "breakfast",
    label: "Daily breakfast",
    description: "À la carte breakfast for every guest, every morning.",
    price: 28,
    per: "guest-night",
    appliesTo: ["hotel"],
    taxable: true,
  },
  {
    id: "airport-transfer",
    label: "Private airport transfer",
    description: "Chauffeured arrival and departure in a premium vehicle.",
    price: 95,
    per: "stay",
    appliesTo: ["hotel", "trip"],
    taxable: true,
  },
  {
    id: "early-check-in",
    label: "Guaranteed early check-in",
    description: "Your room ready from 10:00 on arrival day.",
    price: 60,
    per: "stay",
    appliesTo: ["hotel"],
    taxable: true,
  },
  {
    id: "late-checkout",
    label: "Late checkout until 16:00",
    description: "Linger over lunch — keep your room until 4 pm.",
    price: 55,
    per: "stay",
    appliesTo: ["hotel"],
    taxable: true,
  },
  {
    id: "travel-insurance",
    label: "Oriel Travel Protection",
    description: "Trip cancellation, medical and baggage cover. Not subject to tax.",
    price: 39,
    per: "guest",
    appliesTo: ["hotel", "trip", "experience"],
    taxable: false,
  },
  {
    id: "celebration",
    label: "Celebration package",
    description: "Champagne, flowers and a handwritten note waiting in the room.",
    price: 120,
    per: "stay",
    appliesTo: ["hotel"],
    taxable: true,
  },
  {
    id: "spa-credit",
    label: "Spa credit",
    description: "$150 to spend on treatments during your stay.",
    price: 135,
    per: "stay",
    appliesTo: ["hotel"],
    taxable: true,
  },
  {
    id: "private-guide",
    label: "Private guide upgrade",
    description: "Swap group touring for a dedicated guide on selected days.",
    price: 180,
    per: "stay",
    appliesTo: ["trip", "experience"],
    taxable: true,
  },
  {
    id: "photo-pack",
    label: "Professional photo pack",
    description: "Edited photos from your experience, delivered within 48 hours.",
    price: 45,
    per: "stay",
    appliesTo: ["experience"],
    taxable: true,
  },
];

/** Oriel platform service fee — shown on every price, never hidden. */
export const SERVICE_FEE_RATE = 0.03;
export const SERVICE_FEE_CAP = 90;
