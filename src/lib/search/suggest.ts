export type SuggestionType = "destination" | "hotel" | "trip" | "experience";

export interface SuggestEntry {
  id: string;
  type: SuggestionType;
  title: string;
  subtitle: string;
  href: string;
  /** Destination slug for hotel search routing */
  destinationSlug?: string;
  image: string;
  keywords: string;
  popularity: number;
}

export const SUGGESTION_GROUP_LABEL: Record<SuggestionType, string> = {
  destination: "Destinations",
  hotel: "Hotels",
  trip: "Trips",
  experience: "Experiences",
};

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/**
 * Lightweight ranking: prefix matches on the title beat word-prefix matches,
 * which beat substring matches in keywords. Popularity breaks ties.
 */
export function rankSuggestions(index: SuggestEntry[], query: string, opts: { types?: SuggestionType[]; limitPerType?: number } = {}): SuggestEntry[] {
  const q = normalise(query);
  if (!q) return [];
  const terms = q.split(/\s+/);
  const scored: { e: SuggestEntry; s: number }[] = [];
  for (const e of index) {
    if (opts.types && !opts.types.includes(e.type)) continue;
    const title = normalise(e.title);
    const hay = `${title} ${normalise(e.subtitle)} ${normalise(e.keywords)}`;
    if (!terms.every((t) => hay.includes(t))) continue;
    let s = 0;
    if (title.startsWith(q)) s += 100;
    else if (title.split(/[\s-]+/).some((w) => w.startsWith(terms[0]))) s += 60;
    else if (title.includes(q)) s += 40;
    else s += 10;
    if (e.type === "destination") s += 25;
    s += e.popularity / 10;
    scored.push({ e, s });
  }
  scored.sort((a, b) => b.s - a.s);
  const limit = opts.limitPerType ?? 4;
  const perType = new Map<SuggestionType, number>();
  const out: SuggestEntry[] = [];
  for (const { e } of scored) {
    const n = perType.get(e.type) ?? 0;
    if (n >= limit) continue;
    perType.set(e.type, n + 1);
    out.push(e);
  }
  // Keep group order stable: destinations, hotels, trips, experiences
  const order: SuggestionType[] = ["destination", "hotel", "trip", "experience"];
  return out.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
}
