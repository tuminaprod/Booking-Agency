import Image from "next/image";
import { Suspense } from "react";
import { Compass } from "lucide-react";
import type { TravelCategory } from "@/lib/models";
import { TRIP_CATEGORY_LABEL } from "@/lib/data/catalog";
import { photoUrl } from "@/lib/data/photos";
import { isValidISODate } from "@/lib/dates";
import { formatDateShort } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { destinationName, getDestination, listDestinations, listTrips } from "@/server/catalog";
import { TripCard } from "@/components/cards/cards";
import { ListingToolbar } from "@/components/listing/listing-toolbar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export const metadata = buildMetadata({
  title: "Curated trips & multi-day itineraries",
  description: "Beach holidays, city trips, adventures and cultural journeys — multi-day trips with handpicked hotels, expert guides and transparent per-person pricing.",
  path: "/trips",
  image: photoUrl("oia"),
});

const SORTS = [
  { id: "recommended", label: "Recommended" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Top rated" },
  { id: "duration", label: "Shortest first" },
];

export default async function TripsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const category = sp.category as TravelCategory | undefined;
  const dest = sp.destination ? getDestination(sp.destination) : undefined;
  const text = (sp.q ?? "").toLowerCase().trim();
  const travelers = Math.max(1, Number(sp.travelers) || 1);
  const from = isValidISODate(sp.from) ? sp.from : undefined;
  const to = isValidISODate(sp.to) ? sp.to : undefined;

  let trips = listTrips().filter((t) => {
    if (category && t.category !== category && !t.secondaryCategories.includes(category)) return false;
    if (dest && t.destinationId !== dest.id) return false;
    if (text && !`${t.title} ${destinationName(t.destinationId)} ${t.stops.join(" ")}`.toLowerCase().includes(text)) return false;
    const deps = t.departures.filter((d) => (!from || d.startDate >= from) && (!to || d.startDate <= to) && d.seatsLeft >= travelers);
    return deps.length > 0;
  });
  const sort = sp.sort ?? "recommended";
  trips = [...trips].sort((a, b) =>
    sort === "price-asc" ? a.priceFrom - b.priceFrom : sort === "price-desc" ? b.priceFrom - a.priceFrom : sort === "rating" ? b.rating - a.rating : sort === "duration" ? a.durationDays - b.durationDays : b.rating * b.reviewCount - a.rating * a.reviewCount,
  );

  const destOptions = listDestinations()
    .filter((d) => listTrips().some((t) => t.destinationId === d.id))
    .map((d) => ({ id: d.slug, label: d.name }));

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <Image src={photoUrl("braiesBoat")} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-40" />
        <div className="container-page py-16 sm:py-20">
          <p className="eyebrow !text-gold-soft">Trips</p>
          <h1 className="mt-2 max-w-2xl font-display text-5xl sm:text-6xl">Journeys, beautifully arranged.</h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">Multi-day trips with handpicked hotels, private guides and room to breathe. One price per person, everything itemised.</p>
        </div>
      </section>

      <div className="container-page pt-8">
        <Suspense>
          <ListingToolbar
            categories={Object.entries(TRIP_CATEGORY_LABEL).map(([id, label]) => ({ id, label }))}
            sorts={SORTS}
            destinations={destOptions}
            total={trips.length}
            noun={["trip", "trips"]}
            extraChips={[
              ...(from || to ? [{ param: "from", label: `From ${from ? formatDateShort(from) : "any"}` }, ...(to ? [{ param: "to", label: `Until ${formatDateShort(to)}` }] : [])] : []),
              ...(sp.q ? [{ param: "q", label: `“${sp.q}”` }] : []),
              ...(travelers > 1 ? [{ param: "travelers", label: `${travelers} travelers` }] : []),
            ]}
          />
        </Suspense>

        <div className="mt-6">
          {trips.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((t, i) => (
                <TripCard key={t.id} trip={t} destinationName={destinationName(t.destinationId)} priority={i < 3} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Compass className="size-6" aria-hidden />}
              title="No trips match your search"
              description="Try another trip type, widen your travel dates, or explore all destinations. New departures are added every month."
              action={
                <>
                  <ButtonLink href="/trips">Show all trips</ButtonLink>
                  <ButtonLink href="/help" variant="secondary">
                    Ask our concierge
                  </ButtonLink>
                </>
              }
            />
          )}
        </div>
      </div>
    </>
  );
}
