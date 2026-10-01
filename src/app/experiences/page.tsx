import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import type { ExperienceCategory } from "@/lib/models";
import { EXPERIENCE_CATEGORIES } from "@/lib/data/catalog";
import { photoUrl } from "@/lib/data/photos";
import { isValidISODate, weekday } from "@/lib/dates";
import { formatDateShort } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { destinationName, getDestination, listDestinations, listExperiences } from "@/server/catalog";
import { ExperienceCard } from "@/components/cards/cards";
import { ListingToolbar } from "@/components/listing/listing-toolbar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export const metadata = buildMetadata({
  title: "Travel experiences, tours & activities",
  description: "Book food tours, cruises, cultural experiences, adventures and private guides in top destinations — with instant confirmation and clear pricing.",
  path: "/experiences",
  image: photoUrl("foodSpread"),
});

const SORTS = [
  { id: "popular", label: "Most popular" },
  { id: "rating", label: "Top rated" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "duration", label: "Shortest first" },
];

export default async function ExperiencesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const category = sp.category as ExperienceCategory | undefined;
  const dest = sp.destination ? getDestination(sp.destination) : undefined;
  const text = (sp.q ?? "").toLowerCase().trim();
  const people = Math.max(1, Number(sp.people) || 1);
  const date = isValidISODate(sp.date) ? sp.date : undefined;

  let items = listExperiences().filter((e) => {
    if (category && e.category !== category) return false;
    if (dest && e.destinationId !== dest.id) return false;
    if (text && !`${e.title} ${destinationName(e.destinationId)} ${e.category}`.toLowerCase().includes(text)) return false;
    if (date && !e.runsOn.includes(weekday(date))) return false;
    if (e.groupSize.max < people) return false;
    return true;
  });
  const sort = sp.sort ?? "popular";
  items = [...items].sort((a, b) =>
    sort === "price-asc" ? a.priceFrom - b.priceFrom : sort === "price-desc" ? b.priceFrom - a.priceFrom : sort === "rating" ? b.rating - a.rating : sort === "duration" ? a.durationHours - b.durationHours : b.reviewCount - a.reviewCount,
  );
  const destOptions = listDestinations()
    .filter((d) => listExperiences().some((e) => e.destinationId === d.id))
    .map((d) => ({ id: d.slug, label: d.name }));

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <Image src={photoUrl("halong")} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-40" />
        <div className="container-page py-16 sm:py-20">
          <p className="eyebrow !text-gold-soft">Experiences</p>
          <h1 className="mt-2 max-w-2xl font-display text-5xl sm:text-6xl">The moments that make a trip.</h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">Tastings, tours and adventures led by people who know their place best. Small groups, fair prices, instant confirmation.</p>
        </div>
      </section>

      <div className="container-page pt-8">
        <h2 className="sr-only">Browse by category</h2>
        <ul className="no-scrollbar -mx-4 mb-8 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-9">
          {EXPERIENCE_CATEGORIES.map((c) => (
            <li key={c.id} className="w-32 shrink-0 sm:w-auto">
              <Link href={`/experiences?category=${c.id}`} className="group block" aria-current={category === c.id ? "page" : undefined}>
                <span className={`relative block aspect-square overflow-hidden rounded-lg bg-sand ring-offset-2 ${category === c.id ? "ring-2 ring-navy" : ""}`}>
                  <Image src={photoUrl(c.image)} alt="" fill sizes="(min-width: 1024px) 11vw, 128px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </span>
                <span className="mt-2 block text-sm font-medium text-ink">{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <Suspense>
          <ListingToolbar
            categories={EXPERIENCE_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))}
            sorts={SORTS}
            destinations={destOptions}
            total={items.length}
            noun={["experience", "experiences"]}
            extraChips={[
              ...(date ? [{ param: "date", label: `Available ${formatDateShort(date)}` }] : []),
              ...(people > 1 ? [{ param: "people", label: `${people} people` }] : []),
              ...(sp.q ? [{ param: "q", label: `“${sp.q}”` }] : []),
            ]}
          />
        </Suspense>

        <div className="mt-6">
          {items.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((e, i) => (
                <ExperienceCard key={e.id} experience={e} destinationName={destinationName(e.destinationId)} priority={i < 4} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Sparkles className="size-6" aria-hidden />}
              title="No experiences found"
              description="Nothing matches these filters yet. Try a different date or category, or browse everything on offer."
              action={<ButtonLink href="/experiences">Show all experiences</ButtonLink>}
            />
          )}
        </div>
      </div>
    </>
  );
}
