import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { listDestinations, listExperiences, listGuides, listHotels, listTrips } from "@/server/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (path: string) => new URL(path, SITE.url).toString();
  const now = new Date();
  const statics = ["/", "/hotels", "/trips", "/experiences", "/destinations", "/guides", "/deals", "/help"].map((p) => ({ url: u(p), lastModified: now, changeFrequency: "daily" as const, priority: p === "/" ? 1 : 0.8 }));
  return [
    ...statics,
    ...listDestinations().map((d) => ({ url: u(`/destinations/${d.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...listHotels().map((h) => ({ url: u(`/hotels/${h.slug}`), changeFrequency: "daily" as const, priority: 0.9 })),
    ...listTrips().map((t) => ({ url: u(`/trips/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...listExperiences().map((e) => ({ url: u(`/experiences/${e.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...listGuides().map((g) => ({ url: u(`/guides/${g.slug}`), lastModified: g.updatedAt ?? g.publishedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
