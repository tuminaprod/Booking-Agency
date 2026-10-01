import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Clock, MapPin, Phone, Mail, Sparkles, Check } from "lucide-react";
import { AMENITIES, PROPERTY_TYPE_LABEL } from "@/lib/data/catalog";
import { defaultStay } from "@/lib/dates";
import type { HotelAmenity } from "@/lib/models";
import { buildMetadata, breadcrumbJsonLd, hotelJsonLd } from "@/lib/seo";
import { getDestinationById, hotelStartingPrice, hotelsInDestination, reviewsFor, getHotel } from "@/server/catalog";
import { searchHotels } from "@/server/hotel-search";
import { JsonLd } from "@/components/seo/json-ld";
import { Gallery } from "@/components/detail/gallery";
import { Breadcrumbs, DetailSection, ReviewsBlock, SectionNav } from "@/components/detail/parts";
import { ShareButton, TrackRecentlyViewed } from "@/components/detail/client-parts";
import { BookingSidebar, HotelBookingProvider, MobileBookingBar, RoomList } from "@/components/hotels/hotel-booking";
import { HotelResultCard } from "@/components/cards/hotel-card";
import { MapView } from "@/components/map";
import { RatingBadge, Stars } from "@/components/ui/rating";
import { SaveButton } from "@/components/ui/save-button";
import { HotelBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/feedback";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hotel = getHotel((await params).slug);
  if (!hotel) return {};
  const dest = getDestinationById(hotel.destinationId)!;
  return buildMetadata({
    title: `${hotel.name} — ${hotel.stars}-star ${PROPERTY_TYPE_LABEL[hotel.propertyType].toLowerCase()} in ${dest.name}`,
    description: `${hotel.shortDescription} Rated ${hotel.rating}/10 by ${hotel.reviewCount.toLocaleString("en-US")} guests. See rooms and total prices.`,
    path: `/hotels/${hotel.slug}`,
    image: hotel.images[0].src,
  });
}

const GROUP_LABEL: Record<HotelAmenity["group"], string> = { essentials: "Essentials", wellness: "Wellness", dining: "Food & drink", services: "Services", family: "Family", outdoors: "Outdoors" };
const NEARBY_LABEL = { attraction: "Attraction", beach: "Beach", transport: "Transport", dining: "Dining", shopping: "Shopping", nature: "Nature" } as const;

export default async function HotelPage({ params, searchParams }: Props) {
  // Reading searchParams renders the page per request, so room prices and the
  // booking panel are server-rendered for the requested dates.
  await searchParams;
  const hotel = getHotel((await params).slug);
  if (!hotel) notFound();
  const dest = getDestinationById(hotel.destinationId)!;
  const reviews = reviewsFor("hotel", hotel.id);
  const stay = defaultStay();
  const amenityGroups = Object.entries(
    hotel.amenities.reduce<Record<string, string[]>>((acc, a) => {
      const am = AMENITIES[a];
      (acc[am.group] ??= []).push(am.label);
      return acc;
    }, {}),
  );
  const neighbours = hotelsInDestination(hotel.destinationId);
  const similar = searchHotels({ destination: dest.slug, q: "", ...stay, adults: 2, children: 0, rooms: 1, stars: [], types: [], amenities: [], features: [], neighborhoods: [], sort: "rating" })
    .items.filter((i) => i.id !== hotel.id)
    .slice(0, 2);

  const snapshot = {
    title: hotel.name,
    subtitle: `${hotel.neighborhood}, ${dest.name}`,
    href: `/hotels/${hotel.slug}`,
    image: { src: hotel.images[0].src, alt: hotel.images[0].alt },
    priceFrom: hotelStartingPrice(hotel),
    priceUnit: "night",
    rating: hotel.rating,
    reviewCount: hotel.reviewCount,
    stars: hotel.stars,
    compare: {
      propertyType: PROPERTY_TYPE_LABEL[hotel.propertyType],
      neighborhood: hotel.neighborhood,
      amenities: hotel.amenities,
      cancellation: hotel.rooms[0].cancellation.summary,
      breakfast: hotel.rooms.some((r) => r.breakfastIncluded),
      distanceKm: hotel.distanceFromCenterKm,
    },
  };

  return (
    <div className="pb-24 lg:pb-0">
      <JsonLd data={[hotelJsonLd(hotel, dest, reviews, hotelStartingPrice(hotel)), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Hotels", path: "/hotels" }, { name: dest.name, path: `/hotels?destination=${dest.slug}` }, { name: hotel.name, path: `/hotels/${hotel.slug}` }])]} />
      <TrackRecentlyViewed type="hotel" entityId={hotel.id} snapshot={snapshot} />

      <div className="container-page pt-6">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Hotels", href: "/hotels" }, { name: dest.name, href: `/hotels?destination=${dest.slug}` }, { name: hotel.name }]} />

        <header className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{PROPERTY_TYPE_LABEL[hotel.propertyType]}</span>
              <Stars count={hotel.stars} size="md" />
              {hotel.badges.map((b) => (
                <HotelBadge key={b} badge={b} />
              ))}
            </div>
            <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{hotel.name}</h1>
            <p className="mt-2 flex items-start gap-1.5 text-[0.9375rem] text-ink-soft">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              {hotel.address}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="#reviews" className="rounded-md">
              <RatingBadge rating={hotel.rating} reviews={hotel.reviewCount} />
            </a>
            <ShareButton title={hotel.name} />
            <SaveButton type="hotel" entityId={hotel.id} snapshot={snapshot} variant="outline" />
          </div>
        </header>

        <Gallery images={hotel.images} className="mt-6" />
      </div>

      <Suspense fallback={<div className="container-page mt-10"><Skeleton className="h-96" /></div>}>
        <HotelBookingProvider hotel={hotel} defaults={stay}>
          <div className="container-page mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0">
              <SectionNav items={[{ id: "overview", label: "Overview" }, { id: "rooms", label: "Rooms" }, { id: "amenities", label: "Amenities" }, { id: "location", label: "Location" }, { id: "policies", label: "Policies" }, { id: "reviews", label: "Reviews" }]} />
              <div className="pt-8">
                <DetailSection id="overview" title="About the stay">
                  <p className="text-lg text-ink">{hotel.shortDescription}</p>
                  <div className="prose-oriel mt-4">
                    {hotel.description.map((p) => (
                      <p key={p.slice(0, 20)}>{p}</p>
                    ))}
                  </div>
                  <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                    {hotel.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4 text-[0.9375rem] text-ink">
                        <Sparkles className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                        {h}
                      </li>
                    ))}
                  </ul>
                </DetailSection>

                <DetailSection id="rooms" title="Choose your room">
                  <RoomList />
                </DetailSection>

                <DetailSection id="amenities" title="Amenities">
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {amenityGroups.map(([group, labels]) => (
                      <div key={group}>
                        <h3 className="mb-2 font-semibold text-ink">{GROUP_LABEL[group as HotelAmenity["group"]]}</h3>
                        <ul className="space-y-1.5">
                          {labels.map((l) => (
                            <li key={l} className="flex items-center gap-2 text-[0.9375rem] text-ink-soft">
                              <Check className="size-4 text-success" aria-hidden />
                              {l}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </DetailSection>

                <DetailSection id="location" title="Location">
                  <p className="mb-4 text-[0.9375rem] text-ink-soft">
                    {hotel.neighborhood}, {dest.name} · {hotel.distanceFromCenterKm} km from the centre
                  </p>
                  <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <MapView
                      label={`${hotel.name} and nearby hotels`}
                      markers={neighbours.map((h) => ({ id: h.id, position: h.coordinates, label: h.id === hotel.id ? "You're here" : h.name, title: h.name }))}
                      selectedId={hotel.id}
                      className="h-80"
                    />
                    <div>
                      <h3 className="mb-3 font-semibold text-ink">Nearby</h3>
                      <ul className="divide-y divide-line">
                        {hotel.nearby.map((n) => (
                          <li key={n.name} className="flex items-center justify-between gap-3 py-2.5 text-[0.9375rem]">
                            <span>
                              <span className="block text-ink">{n.name}</span>
                              <span className="text-[0.8125rem] text-muted">{NEARBY_LABEL[n.type]}</span>
                            </span>
                            <span className="shrink-0 tabular-nums text-muted">{n.distanceKm < 1 ? `${Math.round(n.distanceKm * 1000)} m` : `${n.distanceKm} km`}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </DetailSection>

                <DetailSection id="policies" title="Policies">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4">
                      <Clock className="size-6 text-gold" aria-hidden />
                      <div>
                        <p className="text-sm text-muted">Check-in</p>
                        <p className="text-lg font-semibold text-ink">From {hotel.policies.checkIn}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4">
                      <Clock className="size-6 text-gold" aria-hidden />
                      <div>
                        <p className="text-sm text-muted">Check-out</p>
                        <p className="text-lg font-semibold text-ink">Until {hotel.policies.checkOut}</p>
                      </div>
                    </div>
                  </div>
                  <dl className="mt-6 divide-y divide-line rounded-lg border border-line bg-surface">
                    {[
                      ["Cancellation", "Each room shows its own cancellation terms. The policy for your chosen room is confirmed before payment."],
                      ["Children", hotel.policies.children],
                      ["Pets", hotel.policies.pets],
                      ["Smoking", hotel.policies.smoking],
                      ["Payment", hotel.policies.payment],
                      ["Taxes & fees", `${Math.round(hotel.taxRate * 100)}% taxes are included in every price.${hotel.fees.length ? ` Mandatory fees: ${hotel.fees.map((f) => `${f.label} ($${f.amount} per ${f.per.replace("-", " ")}${f.payableAt === "property" ? ", paid at the property" : ""})`).join("; ")}.` : ""}`],
                      ...(hotel.policies.extraNotes?.map((n) => ["Good to know", n]) ?? []),
                    ].map(([k, v], i) => (
                      <div key={i} className="grid gap-1 p-4 sm:grid-cols-[10rem_1fr]">
                        <dt className="font-semibold text-ink">{k}</dt>
                        <dd className="text-[0.9375rem] text-ink-soft">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
                    <a href={`tel:${hotel.contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-navy hover:underline">
                      <Phone className="size-4" aria-hidden /> {hotel.contact.phone}
                    </a>
                    <a href={`mailto:${hotel.contact.email}`} className="inline-flex items-center gap-2 text-navy hover:underline">
                      <Mail className="size-4" aria-hidden /> {hotel.contact.email}
                    </a>
                  </div>
                </DetailSection>

                <DetailSection id="reviews" title="Guest reviews">
                  <ReviewsBlock rating={hotel.rating} count={hotel.reviewCount} reviews={reviews} />
                </DetailSection>
              </div>
            </div>

            <aside className="hidden lg:block" aria-label="Booking summary">
              <div className="sticky top-24">
                <BookingSidebar />
              </div>
            </aside>
          </div>
          <MobileBookingBar />
        </HotelBookingProvider>
      </Suspense>

      {similar.length > 0 && (
        <section className="container-page mt-16" aria-labelledby="similar-title">
          <h2 id="similar-title" className="mb-6 font-display text-3xl text-ink">
            More stays in {dest.name}
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {similar.map((i) => (
              <HotelResultCard key={i.id} item={i} layout="stack" href={`/hotels/${i.slug}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
