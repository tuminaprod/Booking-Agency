import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarRange, Clock, Coins, Languages, Lightbulb, MapPin, Route } from "lucide-react";
import { defaultStay } from "@/lib/dates";
import { buildMetadata, breadcrumbJsonLd, destinationJsonLd } from "@/lib/seo";
import { serializeHotelQuery } from "@/lib/search/hotel-query";
import { destinationName, destinationStats, experiencesInDestination, getDestination, getDestinationById, listDestinations, listGuides, tripsInDestination } from "@/server/catalog";
import { searchHotels } from "@/server/hotel-search";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/detail/parts";
import { TrackRecentlyViewed } from "@/components/detail/client-parts";
import { DestinationCard, ExperienceCard, GuideCard, SectionHeader, TripCard } from "@/components/cards/cards";
import { HotelResultCard } from "@/components/cards/hotel-card";
import { ButtonLink } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;
// Only known slugs exist; anything else is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return listDestinations().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = getDestination((await params).slug);
  if (!d) return {};
  return buildMetadata({ title: `${d.name} travel guide — hotels, trips & things to do`, description: `${d.tagline}. Best time to visit, where to stay, top experiences and itineraries for ${d.name}, ${d.country}.`, path: `/destinations/${d.slug}`, image: d.heroImage.src });
}

export default async function DestinationPage({ params }: Props) {
  const d = getDestination((await params).slug);
  if (!d) notFound();
  const stats = destinationStats(d.id);
  const stay = defaultStay();
  const hotels = searchHotels({ destination: d.slug, q: "", ...stay, adults: 2, children: 0, rooms: 1, stars: [], types: [], amenities: [], features: [], neighborhoods: [], sort: "popularity" }).items.slice(0, 4);
  const experiences = experiencesInDestination(d.id).slice(0, 4);
  const trips = tripsInDestination(d.id);
  const related = d.relatedIds.map(getDestinationById).filter((x) => x !== undefined);
  const guides = listGuides().filter((g) => g.relatedDestinationIds.includes(d.id));
  const stayQs = serializeHotelQuery(stay);

  return (
    <>
      <JsonLd data={[destinationJsonLd(d), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Destinations", path: "/destinations" }, { name: d.name, path: `/destinations/${d.slug}` }])]} />
      <TrackRecentlyViewed type="destination" entityId={d.id} snapshot={{ title: d.name, subtitle: `${d.region}, ${d.country}`, href: `/destinations/${d.slug}`, image: d.heroImage, priceFrom: stats.startingHotelPrice ?? undefined, priceUnit: "night" }} />

      <section className="relative isolate flex min-h-[460px] items-end sm:min-h-[560px]">
        <Image src={d.heroImage.src} alt={d.heroImage.alt} fill priority sizes="100vw" quality={85} className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/10" />
        <div className="container-page pb-10 text-white">
          <p className="eyebrow !text-gold-soft">
            {d.region}, {d.country}
          </p>
          <h1 className="mt-2 font-display text-5xl sm:text-7xl">{d.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/90">{d.tagline}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink href={`/hotels?destination=${d.slug}&${stayQs}`} variant="inverse">
              Find hotels in {d.name}
            </ButtonLink>
            <SaveButton type="destination" entityId={d.id} snapshot={{ title: d.name, subtitle: `${d.region}, ${d.country}`, href: `/destinations/${d.slug}`, image: d.heroImage, priceFrom: stats.startingHotelPrice ?? undefined, priceUnit: "night" }} />
          </div>
        </div>
      </section>

      <div className="container-page">
        <div className="pt-6">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Destinations", href: "/destinations" }, { name: d.name }]} />
        </div>

        <section className="grid gap-10 pt-10 lg:grid-cols-[1.4fr_1fr]" aria-labelledby="overview-title">
          <div>
            <h2 id="overview-title" className="font-display text-3xl text-ink sm:text-4xl">
              Discover {d.name}
            </h2>
            <div className="prose-oriel mt-4">
              {d.description.map((p) => (
                <p key={p.slice(0, 16)}>{p}</p>
              ))}
            </div>
          </div>
          <aside className="space-y-4">
            <div className="rounded-lg border border-gold/30 bg-gold-tint p-5">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <CalendarRange className="size-5 text-gold" aria-hidden /> Best time to visit
              </p>
              <p className="mt-1 font-display text-2xl text-ink">{d.bestTimeToVisit.months}</p>
              <p className="mt-1 text-[0.9375rem] text-ink-soft">{d.bestTimeToVisit.summary}</p>
            </div>
            <dl className="grid grid-cols-1 gap-3 rounded-lg border border-line bg-surface p-5 text-[0.9375rem] sm:grid-cols-3 lg:grid-cols-1">
              {[
                { icon: Coins, k: "Currency", v: d.facts.currency },
                { icon: Languages, k: "Language", v: d.facts.language },
                { icon: Clock, k: "Time zone", v: d.facts.timezone },
              ].map(({ icon: Icon, k, v }) => (
                <div key={k} className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-4 text-muted" aria-hidden />
                  <div>
                    <dt className="text-sm text-muted">{k}</dt>
                    <dd className="text-ink">{v}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted">
              {stats.hotelCount} hotels · {stats.experienceCount} experiences · {stats.tripCount} trips
            </p>
          </aside>
        </section>

        {hotels.length > 0 && (
          <section className="pt-20">
            <SectionHeader eyebrow="Where to stay" title={`Popular hotels in ${d.name}`} action={<ButtonLink href={`/hotels?destination=${d.slug}&${stayQs}`} variant="secondary" iconRight={<ArrowRight className="size-4" aria-hidden />}>See all {stats.hotelCount}</ButtonLink>} />
            <div className="grid gap-5 md:grid-cols-2">
              {hotels.map((h) => (
                <HotelResultCard key={h.id} item={h} layout="stack" href={`/hotels/${h.slug}?${stayQs}`} />
              ))}
            </div>
          </section>
        )}

        {experiences.length > 0 && (
          <section className="pt-20">
            <SectionHeader eyebrow="Experiences" title={`Popular experiences in ${d.name}`} action={<ButtonLink href={`/experiences?destination=${d.slug}`} variant="secondary" iconRight={<ArrowRight className="size-4" aria-hidden />}>All experiences</ButtonLink>} />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {experiences.map((e) => (
                <ExperienceCard key={e.id} experience={e} destinationName={d.name} />
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-10 pt-20 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl text-ink">Things to do</h2>
            <ol className="mt-5 space-y-3">
              {d.thingsToDo.map((t, i) => (
                <li key={t} className="flex items-start gap-4 rounded-lg border border-line bg-surface p-4">
                  <span className="font-display text-2xl leading-none text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[0.9375rem] text-ink">{t}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="font-display text-3xl text-ink">Top attractions</h2>
            <ul className="mt-5 divide-y divide-line rounded-lg border border-line bg-surface">
              {d.attractions.map((a) => (
                <li key={a.name} className="p-4">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <MapPin className="size-4 text-gold" aria-hidden /> {a.name}
                  </p>
                  <p className="mt-0.5 pl-6 text-[0.9375rem] text-ink-soft">{a.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="pt-20" aria-labelledby="hoods">
          <h2 id="hoods" className="font-display text-3xl text-ink">
            Neighbourhoods
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.neighborhoods.map((n) => (
              <li key={n.name} className="rounded-lg border border-line bg-surface p-5">
                <p className="font-display text-xl text-ink">{n.name}</p>
                <p className="mt-1 text-[0.9375rem] text-ink-soft">{n.description}</p>
                <Link href={`/hotels?destination=${d.slug}&neighborhoods=${encodeURIComponent(n.name)}&${stayQs}`} className="mt-3 inline-block text-sm font-medium text-navy hover:underline">
                  Hotels in {n.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-10 pt-20 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl text-ink">Travel tips</h2>
            <ul className="mt-5 space-y-3">
              {d.travelTips.map((t) => (
                <li key={t} className="flex gap-3 rounded-lg bg-sand p-4 text-[0.9375rem] text-ink">
                  <Lightbulb className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-3xl text-ink">Recommended itineraries</h2>
            <ul className="mt-5 space-y-3">
              {d.itineraries.map((it) => (
                <li key={it.title} className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <Route className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
                    <div>
                      <p className="font-semibold text-ink">
                        {it.title} · {it.days} days
                      </p>
                      <p className="text-sm text-muted">{it.summary}</p>
                    </div>
                  </div>
                  {it.tripSlug && (
                    <ButtonLink href={`/trips/${it.tripSlug}`} size="sm" variant="secondary">
                      View trip
                    </ButtonLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {trips.length > 0 && (
          <section className="pt-20">
            <SectionHeader eyebrow="Trips" title={`Trips featuring ${d.name}`} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((t) => (
                <TripCard key={t.id} trip={t} destinationName={destinationName(t.destinationId)} />
              ))}
            </div>
          </section>
        )}

        {guides.length > 0 && (
          <section className="pt-20">
            <SectionHeader eyebrow="Read" title={`${d.name} travel guides`} />
            <div className="grid gap-5 md:grid-cols-3">
              {guides.map((g) => (
                <GuideCard key={g.id} guide={g} />
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="pt-20">
            <SectionHeader eyebrow="Explore more" title="Related destinations" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <DestinationCard key={r.id} destination={r} stats={destinationStats(r.id)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
