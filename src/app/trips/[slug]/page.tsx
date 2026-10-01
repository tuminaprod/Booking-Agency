import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, BedDouble, CalendarDays, Clock, Coffee, MapPin, Sparkles, Users, UtensilsCrossed } from "lucide-react";
import { TRIP_CATEGORY_LABEL } from "@/lib/data/catalog";
import { addDays, todayISO } from "@/lib/dates";
import { formatDateRange, plural } from "@/lib/format";
import { buildMetadata, breadcrumbJsonLd, tripJsonLd } from "@/lib/seo";
import { destinationName, getDestinationById, getTrip, listTrips, reviewsFor } from "@/server/catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { Gallery } from "@/components/detail/gallery";
import { Breadcrumbs, DetailSection, IncludedList, ReviewsBlock, SectionNav } from "@/components/detail/parts";
import { ShareButton, TrackRecentlyViewed } from "@/components/detail/client-parts";
import { TripBookingCard } from "@/components/trips/trip-booking";
import { TripCard } from "@/components/cards/cards";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { RatingBadge } from "@/components/ui/rating";
import { SaveButton } from "@/components/ui/save-button";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;
// Only known slugs exist; anything else is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return listTrips().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = getTrip((await params).slug);
  if (!trip) return {};
  return buildMetadata({ title: `${trip.title} — ${trip.durationDays}-day trip`, description: trip.summary, path: `/trips/${trip.slug}`, image: trip.images[0].src });
}

const MEAL_LABEL = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

export default async function TripPage({ params }: Props) {
  const trip = getTrip((await params).slug);
  if (!trip) notFound();
  const dest = getDestinationById(trip.destinationId)!;
  const reviews = reviewsFor("trip", trip.id);
  const today = todayISO();
  const upcoming = trip.departures.filter((d) => d.startDate > today);
  const activities = trip.days.reduce((n, d) => n + d.activities.length, 0);
  const meals = trip.days.reduce((n, d) => n + d.meals.length, 0);
  const related = listTrips()
    .filter((t) => t.id !== trip.id && (t.category === trip.category || t.secondaryCategories.includes(trip.category)))
    .slice(0, 3);
  const snapshot = { title: trip.title, subtitle: `${trip.durationDays} days · ${dest.name}`, href: `/trips/${trip.slug}`, image: trip.images[0], priceFrom: trip.priceFrom, priceUnit: "person", rating: trip.rating, reviewCount: trip.reviewCount };

  return (
    <div className="pb-24 lg:pb-0">
      <JsonLd data={[tripJsonLd(trip), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Trips", path: "/trips" }, { name: trip.title, path: `/trips/${trip.slug}` }])]} />
      <TrackRecentlyViewed type="trip" entityId={trip.id} snapshot={snapshot} />
      <div className="container-page pt-6">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Trips", href: "/trips" }, { name: dest.name, href: `/trips?destination=${dest.slug}` }, { name: trip.title }]} />
        <header className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold">{TRIP_CATEGORY_LABEL[trip.category]}</Badge>
              <span className="flex items-center gap-1 text-sm text-muted">
                <MapPin className="size-3.5" aria-hidden /> {trip.stops.join(" · ")}
              </span>
            </div>
            <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{trip.title}</h1>
            <p className="mt-2 text-lg text-ink-soft">{trip.summary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="#reviews">
              <RatingBadge rating={trip.rating} reviews={trip.reviewCount} />
            </a>
            <ShareButton title={trip.title} />
            <SaveButton type="trip" entityId={trip.id} snapshot={snapshot} variant="outline" />
          </div>
        </header>
        <Gallery images={trip.images} className="mt-6" />
      </div>

      <div className="container-page mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <SectionNav items={[{ id: "overview", label: "Overview" }, { id: "itinerary", label: "Itinerary" }, { id: "included", label: "What's included" }, { id: "meeting", label: "Meeting point" }, { id: "availability", label: "Dates & prices" }, { id: "reviews", label: "Reviews" }]} />
          <div className="pt-8">
            <DetailSection id="overview" title="Overview">
              <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: CalendarDays, label: "Duration", value: `${trip.durationDays} days` },
                  { icon: Sparkles, label: "Activities", value: String(activities) },
                  { icon: UtensilsCrossed, label: "Meals", value: `${meals} included` },
                  { icon: Users, label: "Group size", value: `${trip.groupSize.min}–${trip.groupSize.max}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-lg border border-line bg-surface p-4">
                    <Icon className="size-5 text-gold" aria-hidden />
                    <dt className="mt-2 text-xs uppercase tracking-[0.12em] text-muted">{label}</dt>
                    <dd className="font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="prose-oriel">
                {trip.overview.map((p) => (
                  <p key={p.slice(0, 16)}>{p}</p>
                ))}
              </div>
              <h3 className="mb-3 mt-2 font-semibold text-ink">Highlights</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {trip.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5 text-[0.9375rem] text-ink-soft">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </DetailSection>

            <DetailSection id="itinerary" title="Day-by-day itinerary">
              <ol className="relative space-y-3 before:absolute before:bottom-6 before:left-[19px] before:top-6 before:w-px before:bg-line">
                {trip.days.map((day) => (
                  <li key={day.day} className="relative pl-14">
                    <span className="absolute left-0 top-3 inline-flex size-10 items-center justify-center rounded-full border border-gold/40 bg-gold-tint text-sm font-semibold text-gold-600" aria-hidden>
                      {day.day}
                    </span>
                    <details className="group rounded-lg border border-line bg-surface" open={day.day <= 2}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                        <span>
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Day {day.day}</span>
                          <span className="block font-semibold text-ink">{day.title}</span>
                        </span>
                        <span className="text-muted transition-transform group-open:rotate-180" aria-hidden>
                          ▾
                        </span>
                      </summary>
                      <div className="border-t border-line px-4 pb-4 pt-3">
                        <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{day.description}</p>
                        {day.activities.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Activities">
                            {day.activities.map((a) => (
                              <li key={a} className="rounded-xs bg-sand px-2 py-1 text-xs text-ink-soft">
                                {a}
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.8125rem] text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <Coffee className="size-3.5" aria-hidden />
                            {day.meals.length ? day.meals.map((m) => MEAL_LABEL[m]).join(", ") : "Meals at leisure"}
                          </span>
                          {day.overnight && (
                            <span className="inline-flex items-center gap-1.5">
                              <BedDouble className="size-3.5" aria-hidden />
                              {day.overnight}
                            </span>
                          )}
                        </div>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
              <h3 className="mb-3 mt-10 font-semibold text-ink">Accommodation</h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {trip.accommodation.map((a) => (
                  <li key={a.name} className="rounded-lg border border-line bg-surface p-4">
                    <p className="font-semibold text-ink">{a.hotelSlug ? <Link href={`/hotels/${a.hotelSlug}`} className="hover:underline">{a.name}</Link> : a.name}</p>
                    <p className="text-sm text-muted">
                      {plural(a.nights, "night")} · {a.description}
                    </p>
                  </li>
                ))}
              </ul>
            </DetailSection>

            <DetailSection id="included" title="What's included">
              <IncludedList included={trip.included} excluded={trip.excluded} />
            </DetailSection>

            <DetailSection id="meeting" title="Meeting point & important information">
              <div className="rounded-lg border border-line bg-surface p-5">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <MapPin className="size-4 text-gold" aria-hidden /> {trip.meetingPoint.name}
                </p>
                <p className="mt-1 text-[0.9375rem] text-ink-soft">{trip.meetingPoint.address}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Clock className="size-3.5" aria-hidden /> {trip.meetingPoint.time}
                </p>
                <p className="mt-2 text-sm text-ink-soft">{trip.meetingPoint.notes}</p>
              </div>
              <ul className="mt-5 space-y-2">
                {trip.importantInfo.map((i) => (
                  <li key={i} className="flex gap-2.5 text-[0.9375rem] text-ink-soft">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    {i}
                  </li>
                ))}
              </ul>
            </DetailSection>

            <DetailSection id="availability" title="Dates & prices">
              {upcoming.length ? (
                <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                  {upcoming.map((d) => (
                    <li key={d.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-ink">{formatDateRange(d.startDate, addDays(d.startDate, trip.durationDays - 1))}</p>
                        <p className={d.seatsLeft === 0 ? "text-sm text-danger" : d.seatsLeft <= 3 ? "text-sm font-medium text-warning" : "text-sm text-muted"}>
                          {d.seatsLeft === 0 ? "Sold out" : d.seatsLeft <= 3 ? `Only ${plural(d.seatsLeft, "place")} left` : "Available"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-5 sm:justify-end">
                        <p className="text-right">
                          <span className="block text-lg font-semibold tabular-nums text-ink">
                            <Money usd={d.price} />
                          </span>
                          <span className="text-xs text-muted">per person, before taxes</span>
                        </p>
                        {d.seatsLeft > 0 ? (
                          <ButtonLink href={`/book/trip/${trip.slug}?departure=${d.id}&adults=${Math.min(2, d.seatsLeft)}`} size="sm" variant="secondary">
                            Select
                          </ButtonLink>
                        ) : (
                          <span className="inline-flex h-9 items-center px-3 text-sm text-muted">Unavailable</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No upcoming departures. Save this trip and we&apos;ll let you know when dates are released.</p>
              )}
              <p className="mt-3 text-sm text-muted">Children under 12 receive 25% off. Taxes and our service fee are itemised at checkout before you pay.</p>
            </DetailSection>

            <DetailSection id="reviews" title="Traveller reviews">
              <ReviewsBlock rating={trip.rating} count={trip.reviewCount} reviews={reviews} />
            </DetailSection>
          </div>
        </div>
        <aside className="hidden lg:block" aria-label="Book this trip">
          <div className="sticky top-24">
            <TripBookingCard trip={trip} />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-page mt-16">
          <h2 className="mb-6 font-display text-3xl text-ink">You might also like</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <TripCard key={t.id} trip={t} destinationName={destinationName(t.destinationId)} />
            ))}
          </div>
        </section>
      )}

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="container-page flex h-[72px] items-center justify-between gap-4">
          <p>
            <span className="block text-xs text-muted">From</span>
            <span className="text-lg font-semibold tabular-nums text-ink">
              <Money usd={trip.priceFrom} />
            </span>
            <span className="text-sm text-muted"> / person</span>
          </p>
          <ButtonLink href="#availability" className="px-6">
            Check dates
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
