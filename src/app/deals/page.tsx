import Image from "next/image";
import { BadgePercent } from "lucide-react";
import { photoUrl } from "@/lib/data/photos";
import { defaultStay } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { serializeHotelQuery } from "@/lib/search/hotel-query";
import { destinationName, listExperiences, listPromotions, listTrips } from "@/server/catalog";
import { searchHotels } from "@/server/hotel-search";
import { ExperienceCard, SectionHeader, TripCard } from "@/components/cards/cards";
import { HotelResultCard } from "@/components/cards/hotel-card";
import { CopyCode } from "@/components/marketing/copy-code";
import { EmptyState } from "@/components/ui/feedback";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Hotel deals & travel offers",
  description: "Genuine savings on luxury hotels, trips and experiences — with the discount shown clearly in every price breakdown.",
  path: "/deals",
  image: photoUrl("maldivesAerial"),
});

export default function DealsPage() {
  const stay = defaultStay();
  const hotels = searchHotels({ destination: "", q: "", ...stay, adults: 2, children: 0, rooms: 1, stars: [], types: [], amenities: [], features: [], neighborhoods: [], sort: "recommended" }).items.filter((i) => i.dealLabel);
  const promos = listPromotions().filter((p) => p.active);
  const trips = [...listTrips()].sort((a, b) => b.priceFrom - a.priceFrom).filter((t) => t.priceFrom >= 2000).slice(0, 3);
  const experiences = [...listExperiences()].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const qs = serializeHotelQuery(stay);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <Image src={photoUrl("maldivesAerial")} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-35" />
        <div className="container-page py-16 sm:py-20">
          <p className="eyebrow !text-gold-soft">Deals</p>
          <h1 className="mt-2 max-w-2xl font-display text-5xl sm:text-6xl">Real savings, clearly shown.</h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">No inflated reference prices. Every discount appears as its own line in your price breakdown, before taxes are calculated.</p>
        </div>
      </section>

      <div className="container-page">
        <section className="pt-12" aria-labelledby="codes">
          <h2 id="codes" className="font-display text-3xl text-ink">
            Promo codes
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {promos.map((p) => (
              <li key={p.id} className="flex flex-col rounded-lg border border-line bg-surface p-5">
                <p className="font-semibold text-ink">{p.title}</p>
                <p className="mt-1 flex-1 text-[0.9375rem] text-ink-soft">{p.description}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <CopyCode code={p.code} />
                  <span className="text-xs text-muted">Until {formatDate(p.validTo)}</span>
                </div>
                <p className="mt-3 text-xs text-muted">Applies to {p.appliesTo.join(", ")} bookings{p.minNights ? ` · min ${p.minNights} nights` : ""}{p.minSpend ? ` · min spend $${p.minSpend}` : ""}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="pt-16">
          <SectionHeader eyebrow="Hotel offers" title="Stays on offer now" description={`Prices for 2 adults, 3 nights from ${formatDate(stay.checkIn)} — including taxes and fees, after the discount.`} />
          {hotels.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {hotels.map((h) => (
                <HotelResultCard key={h.id} item={h} layout="stack" href={`/hotels/${h.slug}?${qs}`} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<BadgePercent className="size-6" aria-hidden />} title="No hotel offers right now" description="New offers launch every week — check back soon or use a promo code above." />
          )}
        </section>

        <section className="pt-16">
          <SectionHeader eyebrow="Save with JOURNEY250" title="Trips worth the splurge" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((t) => (
              <TripCard key={t.id} trip={t} destinationName={destinationName(t.destinationId)} />
            ))}
          </div>
        </section>

        <section className="pt-16">
          <SectionHeader eyebrow="Save with EXPLORE20" title="Top-rated experiences" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {experiences.map((e) => (
              <ExperienceCard key={e.id} experience={e} destinationName={destinationName(e.destinationId)} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
