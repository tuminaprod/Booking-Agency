import { z } from "zod";

/**
 * Supported markets — the single source of truth for the country restriction.
 *
 * Oriel sells travel in TUNISIA (TN) and ALGERIA (DZ) only. Every
 * destination, hotel, trip, experience, attraction, map record, API
 * response and landing page is derived from — and validated against — this list.
 * Adding a country is a deliberate code change here, never a data entry.
 */
export const SUPPORTED_COUNTRY_CODES = ["TN", "DZ"] as const;
export type CountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number];
export const DEFAULT_COUNTRY: CountryCode = "TN";

export interface Country {
  code: CountryCode;
  name: string;
  /** URL segment, e.g. /tunisia */
  slug: "tunisia" | "algeria";
  nameFr: string;
  nameAr: string;
  /** Local currency — also the default booking currency */
  currency: "TND" | "DZD";
  /** Approximate geographic bounding box used for validation and map fitting */
  bounds: { south: number; west: number; north: number; east: number };
  center: { lat: number; lng: number };
  tagline: string;
  description: string;
}

export const COUNTRIES: Record<CountryCode, Country> = {
  TN: {
    code: "TN",
    name: "Tunisia",
    slug: "tunisia",
    nameFr: "Tunisie",
    nameAr: "تونس",
    currency: "TND",
    bounds: { south: 30.2, west: 7.5, north: 37.6, east: 11.7 },
    center: { lat: 34.8, lng: 9.6 },
    tagline: "Mediterranean light, Saharan silence",
    description:
      "From the blue-and-white lanes of Sidi Bou Said to the palm oases of the Jérid, Tunisia packs 1,300 km of coastline, Roman amphitheatres, Islamic heritage and the edge of the Sahara into one easy-to-travel country.",
  },
  DZ: {
    code: "DZ",
    name: "Algeria",
    slug: "algeria",
    nameFr: "Algérie",
    nameAr: "الجزائر",
    currency: "DZD",
    bounds: { south: 18.9, west: -8.7, north: 37.2, east: 12.0 },
    center: { lat: 28.0, lng: 2.6 },
    tagline: "Africa's largest country, gloriously uncrowded",
    description:
      "Algeria moves from a Mediterranean coast of white cities and Roman ruins to the High Plateaux and the vast Sahara — ergs, ksour and the volcanic peaks of the Hoggar — with a sense of discovery few destinations still offer.",
  },
};

export const COUNTRY_LIST: Country[] = SUPPORTED_COUNTRY_CODES.map((c) => COUNTRIES[c]);

export const countryCodeSchema = z.enum(SUPPORTED_COUNTRY_CODES, {
  message: "Unsupported country. Oriel supports Tunisia (TN) and Algeria (DZ) only.",
});

export function isSupportedCountry(value: unknown): value is CountryCode {
  return typeof value === "string" && (SUPPORTED_COUNTRY_CODES as readonly string[]).includes(value);
}

/**
 * Normalises user/URL input ("tn", "Tunisia", "tunisia", "DZ", "algérie"…)
 * to a supported code. Returns null for anything else — callers must reject,
 * never fall back silently.
 */
export function parseCountry(input: unknown): CountryCode | null {
  if (typeof input !== "string") return null;
  const v = input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (v === "tn" || v === "tunisia" || v === "tunisie") return "TN";
  if (v === "dz" || v === "algeria" || v === "algerie") return "DZ";
  return null;
}

export const countryBySlug = (slug: string): Country | undefined => COUNTRY_LIST.find((c) => c.slug === slug);

export function withinCountry(code: CountryCode, lat: number, lng: number): boolean {
  const b = COUNTRIES[code].bounds;
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}

/** Regions group destinations inside a country (tourism regions, not administrative claims). */
export interface Region {
  id: string;
  countryCode: CountryCode;
  name: string;
  description: string;
}

export const REGIONS: Region[] = [
  // Tunisia
  { id: "tn-grand-tunis", countryCode: "TN", name: "Grand Tunis", description: "The capital, Carthage and the northern suburbs on the Gulf of Tunis." },
  { id: "tn-cap-bon", countryCode: "TN", name: "Cap Bon & Hammamet", description: "Beaches, citrus groves and the resort coast of the Cap Bon peninsula." },
  { id: "tn-sahel", countryCode: "TN", name: "Sahel", description: "Sousse, Monastir and Mahdia — medinas, ribats and long sandy shores." },
  { id: "tn-south-east", countryCode: "TN", name: "Djerba & the South-East", description: "The island of Djerba and the Zarzis coast." },
  { id: "tn-sahara", countryCode: "TN", name: "Sahara & Jérid", description: "Palm oases, salt lakes and the dunes of the Grand Erg Oriental." },
  { id: "tn-north", countryCode: "TN", name: "Northern Coast", description: "Bizerte and Tabarka, where forest meets coral coast." },
  { id: "tn-centre", countryCode: "TN", name: "Centre & North-West", description: "Kairouan, El Kef and the interior's heritage towns." },
  // Algeria
  { id: "dz-algiers", countryCode: "DZ", name: "Algiers & Tipaza", description: "The capital's Casbah and the Roman coast to the west." },
  { id: "dz-north-west", countryCode: "DZ", name: "Oran & the North-West", description: "Oran's bay and the Andalusian heritage of Tlemcen." },
  { id: "dz-kabylie", countryCode: "DZ", name: "Kabylie & Béjaïa", description: "Mountain villages and a dramatic cliff-lined coast." },
  { id: "dz-north-east", countryCode: "DZ", name: "Constantine & the East", description: "The city of bridges and the beaches of Annaba." },
  { id: "dz-aures", countryCode: "DZ", name: "High Plateaux & Aurès", description: "Sétif, Batna and the Roman cities of Djemila and Timgad." },
  { id: "dz-north-sahara", countryCode: "DZ", name: "Northern Sahara", description: "The M'Zab valley, Taghit and the red oasis of Timimoun." },
  { id: "dz-deep-south", countryCode: "DZ", name: "Tassili & Hoggar", description: "Djanet, Tamanrasset and some of the world's great desert landscapes." },
];

export const regionsOf = (code: CountryCode) => REGIONS.filter((r) => r.countryCode === code);
export const getRegion = (id: string) => REGIONS.find((r) => r.id === id);
