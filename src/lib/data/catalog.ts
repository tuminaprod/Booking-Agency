import type { AmenityId, Extra, ExperienceCategory, GuideCategory, HotelAmenity, PropertyType, TravelCategory } from "@/lib/models";
import type { PhotoKey } from "./photos";

export const AMENITIES: Record<AmenityId, HotelAmenity> = {
  wifi: { id: "wifi", label: "Free Wi-Fi", group: "essentials" },
  "air-conditioning": { id: "air-conditioning", label: "Air conditioning", group: "essentials" },
  parking: { id: "parking", label: "Parking", group: "essentials" },
  "ev-charging": { id: "ev-charging", label: "EV charging", group: "essentials" },
  pool: { id: "pool", label: "Pool", group: "wellness" },
  spa: { id: "spa", label: "Spa & thalasso", group: "wellness" },
  hammam: { id: "hammam", label: "Hammam", group: "wellness" },
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
  golf: { id: "golf", label: "Golf nearby", group: "outdoors" },
};

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  hotel: "Hotel",
  resort: "Resort",
  boutique: "Boutique hotel",
  villa: "Villa",
  apartment: "Apartment",
  dar: "Dar (traditional house)",
  guesthouse: "Guesthouse",
  lodge: "Lodge",
  camp: "Desert camp",
};

export interface CategoryMeta<T extends string> {
  id: T;
  label: string;
  description: string;
  image: PhotoKey;
}

export const TRAVEL_CATEGORIES: CategoryMeta<TravelCategory>[] = [
  { id: "beach", label: "Beach destinations", description: "Djerba, Hammamet, Monastir, Béjaïa", image: "djerbaParasol" },
  { id: "city", label: "City escapes", description: "Tunis, Algiers, Oran, Constantine", image: "algiersBay" },
  { id: "luxury", label: "Luxury stays", description: "Spa resorts and restored palaces", image: "oasisPoolNight" },
  { id: "desert", label: "Desert experiences", description: "Douz, Tozeur, Taghit, Djanet", image: "duneRidge" },
  { id: "cultural", label: "Cultural destinations", description: "Medinas, Roman cities, ksour", image: "elJemAmphitheatre" },
  { id: "weekend", label: "Weekend trips", description: "Short breaks close to the capitals", image: "sidiBouSaidAlley" },
  { id: "family", label: "Family holidays", description: "Calm seas and easy days", image: "monastirBay" },
  { id: "adventure", label: "Adventure", description: "Treks, dunes and mountains", image: "tassiliArch" },
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
  desert: "Sahara trips",
};

export const EXPERIENCE_CATEGORIES: CategoryMeta<ExperienceCategory>[] = [
  { id: "tours", label: "Medina & city tours", description: "Guided by locals", image: "sidiBouSaidAlley" },
  { id: "food", label: "Food experiences", description: "Markets, tastings, kitchens", image: "foodSpread" },
  { id: "desert", label: "Sahara experiences", description: "Dunes, camels, camps", image: "camelsResting" },
  { id: "culture", label: "Heritage & culture", description: "Roman cities, mosques, ksour", image: "kairouanMosque" },
  { id: "adventure", label: "Adventure", description: "Treks, sandboarding, diving", image: "taghitDuneWalker" },
  { id: "cruises", label: "Sea & boat trips", description: "Time on the Mediterranean", image: "monastirHarbour" },
  { id: "day-trips", label: "Day trips", description: "Beyond the city limits", image: "elJemArches" },
  { id: "nature", label: "Nature & mountains", description: "Coasts, oases and peaks", image: "bejaiaCoast" },
  { id: "family", label: "Family activities", description: "Loved by all ages", image: "djerbaBeach" },
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

/** Add-ons offered during checkout. Reference prices in EUR, converted to the booking currency. */
export const EXTRAS: Extra[] = [
  { id: "breakfast", label: "Daily breakfast", description: "Breakfast for every guest, every morning.", price: 9, per: "guest-night", appliesTo: ["hotel"], taxable: true },
  { id: "airport-transfer", label: "Private airport transfer", description: "Chauffeured arrival and departure transfer.", price: 35, per: "stay", appliesTo: ["hotel", "trip"], taxable: true },
  { id: "early-check-in", label: "Guaranteed early check-in", description: "Your room ready from 10:00 on arrival day.", price: 20, per: "stay", appliesTo: ["hotel"], taxable: true },
  { id: "late-checkout", label: "Late checkout until 16:00", description: "Keep your room until 4 pm.", price: 20, per: "stay", appliesTo: ["hotel"], taxable: true },
  { id: "travel-insurance", label: "Oriel Travel Protection", description: "Cancellation, medical and baggage cover. Not subject to tax.", price: 15, per: "guest", appliesTo: ["hotel", "trip", "experience"], taxable: false },
  { id: "hammam-ritual", label: "Hammam & massage ritual", description: "Traditional hammam with black soap and a 30-minute massage.", price: 30, per: "guest", appliesTo: ["hotel"], taxable: true },
  { id: "celebration", label: "Celebration package", description: "Flowers, pastries and a handwritten note in the room.", price: 40, per: "stay", appliesTo: ["hotel"], taxable: true },
  { id: "private-guide", label: "Private guide upgrade", description: "A dedicated guide instead of group touring on selected days.", price: 60, per: "stay", appliesTo: ["trip", "experience"], taxable: true },
  { id: "photo-pack", label: "Professional photo pack", description: "Edited photos from your experience within 48 hours.", price: 18, per: "stay", appliesTo: ["experience"], taxable: true },
];

/** Oriel platform service fee — shown on every price, never hidden. Cap is in EUR, converted. */
export const SERVICE_FEE_RATE = 0.03;
export const SERVICE_FEE_CAP_EUR = 30;
