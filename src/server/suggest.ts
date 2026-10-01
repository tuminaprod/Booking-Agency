import type { SuggestEntry } from "@/lib/search/suggest";
import { PROPERTY_TYPE_LABEL } from "@/lib/data/catalog";
import { destinationName, getDestinationById, listDestinations, listExperiences, listHotels, listTrips } from "./catalog";

const thumb = (src: string) => `${src}?auto=format&fit=crop&w=96&h=96&q=60`;

let cache: SuggestEntry[] | null = null;

/** A compact (~10 KB) index the browser downloads once for instant autocomplete. */
export function buildSuggestIndex(): SuggestEntry[] {
  if (cache) return cache;
  cache = [
    ...listDestinations().map<SuggestEntry>((d) => ({
      id: d.id,
      type: "destination",
      title: d.name,
      subtitle: `${d.region}, ${d.country}`,
      href: `/destinations/${d.slug}`,
      destinationSlug: d.slug,
      image: thumb(d.heroImage.src),
      keywords: [d.country, d.region, d.continent, ...d.neighborhoods.map((n) => n.name)].join(" "),
      popularity: d.popularity,
    })),
    ...listHotels().map<SuggestEntry>((h) => {
      const dest = getDestinationById(h.destinationId)!;
      return {
        id: h.id,
        type: "hotel",
        title: h.name,
        subtitle: `${PROPERTY_TYPE_LABEL[h.propertyType]} · ${h.neighborhood}, ${dest.name}`,
        href: `/hotels/${h.slug}`,
        destinationSlug: dest.slug,
        image: thumb(h.images[0].src),
        keywords: `${dest.name} ${dest.country} ${h.neighborhood} ${h.propertyType}`,
        popularity: h.popularity,
      };
    }),
    ...listTrips().map<SuggestEntry>((t) => ({
      id: t.id,
      type: "trip",
      title: t.title,
      subtitle: `${t.durationDays} days · ${destinationName(t.destinationId)}`,
      href: `/trips/${t.slug}`,
      image: thumb(t.images[0].src),
      keywords: `${destinationName(t.destinationId)} ${t.stops.join(" ")} ${t.category}`,
      popularity: t.rating * 10,
    })),
    ...listExperiences().map<SuggestEntry>((e) => ({
      id: e.id,
      type: "experience",
      title: e.title,
      subtitle: `${e.durationHours} hours · ${destinationName(e.destinationId)}`,
      href: `/experiences/${e.slug}`,
      image: thumb(e.images[0].src),
      keywords: `${destinationName(e.destinationId)} ${e.category}`,
      popularity: e.rating * 9,
    })),
  ];
  return cache;
}
