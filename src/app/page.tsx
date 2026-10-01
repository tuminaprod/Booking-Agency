import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headphones, ShieldCheck, Sparkles, Tag } from "lucide-react";
import { HeroSearch } from "@/components/search/hero-search";
import { DestinationCard, ExperienceCard, GuideCard, SectionHeader, TripCard } from "@/components/cards/cards";
import { HotelResultCard } from "@/components/cards/hotel-card";
import { ButtonLink } from "@/components/ui/button";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { TRAVEL_CATEGORIES } from "@/lib/data/catalog";
import { photoUrl } from "@/lib/data/photos";
import { defaultStay } from "@/lib/dates";
import { formatDateShort } from "@/lib/format";
import { serializeHotelQuery, type HotelSearchQuery } from "@/lib/search/hotel-query";
import { buildMetadata } from "@/lib/seo";
import { destinationName, destinationStats, listDestinations, listExperiences, listGuides, listPromotions, listTrips } from "@/server/catalog";
import { searchHotels } from "@/server/hotel-search";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Oriel — Luxury hotels, trips & experiences",
  description: "Handpicked luxury hotels, curated multi-day trips and unforgettable experiences in the world's most beautiful places. Total price shown upfront.",
  path: "/",
  image: photoUrl("cliffsideSunset"),
});

const CATEGORY_LINK: Record<string, string> = {
  beach: "/hotels?category=beach",
  luxury: "/hotels?category=luxury&stars=5",
  city: "/hotels?category=city",
  family: "/hotels?category=family&features=family-friendly",
  romantic: "/trips?category=romantic",
  adventure: "/trips?category=adventure",
  weekend: "/trips?category=weekend",
  cultural: "/trips?category=cultural",
};

export default function HomePage() {
  const stay = defaultStay();
  const destinations = [...listDestinations()].sort((a, b) => b.popularity - a.popularity);
  const featuredQuery: HotelSearchQuery = { destination: "", q: "", ...stay, adults: 2, children: 0, rooms: 1, stars: [], types: [], amenities: [], features: [], neighborhoods: [], sort: "popularity" };
  const featured = searchHotels(featuredQuery).items.slice(0, 4);
  const trips = [...listTrips()].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const experiences = [...listExperiences()].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 4);
  const guides = listGuides().slice(0, 3);
  const promos = listPromotions().filter((p) => p.active).slice(0, 3);
  const stayQs = serializeHotelQuery(stay);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[640px] items-end pb-12 pt-28 sm:min-h-[720px] lg:min-h-[min(88vh,860px)] lg:items-center lg:pb-16">
        <Image src={photoUrl("cliffsideSunset")} alt="Cliffside infinity pool at sunset overlooking the sea" fill priority sizes="100vw" quality={85} className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/80 via-ink/35 to-ink/45" />
        <div className="container-page">
          <div className="max-w-3xl text-white">
            <p className="eyebrow !text-gold-soft">Hotels · Trips · Experiences</p>
            <h1 className="mt-3 font-display text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl">Stay somewhere worth remembering.</h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">Handpicked hotels, thoughtfully planned journeys and experiences led by locals — with the full price shown before you book.</p>
          </div>
          <div className="mt-10 max-w-6xl">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section aria-label="Why book with Oriel" className="border-b border-line bg-surface">
        <div className="container-page grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Tag, title: "Total price, no surprises", text: "Taxes and fees itemised upfront" },
            { icon: ShieldCheck, title: "Flexible bookings", text: "Free cancellation on most stays" },
            { icon: Sparkles, title: "Handpicked, not listed", text: "Every property visited by our team" },
            { icon: Headphones, title: "24/7 concierge", text: "Before, during and after your trip" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-tint text-gold">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">{title}</p>
                <p className="text-sm text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Destinations */}
      <section className="container-page pt-20">
        <SectionHeader eyebrow="Popular destinations" title="Where our travellers are going" description="From caldera sunsets to Arctic skies — destinations our editors return to again and again." action={<ButtonLink href="/destinations" variant="secondary" iconRight={<ArrowRight className="size-4" aria-hidden />}>All destinations</ButtonLink>} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.slice(0, 6).map((d, i) => (
            <DestinationCard key={d.id} destination={d} stats={destinationStats(d.id)} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page pt-24">
        <SectionHeader eyebrow="Travel your way" title="Find your kind of escape" />
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {TRAVEL_CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link href={CATEGORY_LINK[c.id]} className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-sand sm:aspect-[5/4]">
                <Image src={photoUrl(c.image)} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                  <span className="block font-display text-xl leading-tight sm:text-2xl">{c.label}</span>
                  <span className="hidden text-sm text-white/80 sm:block">{c.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured hotels */}
      <section className="container-page pt-24">
        <SectionHeader
          eyebrow="Featured stays"
          title="Hotels our guests love"
          description={`Prices shown for 2 adults, ${formatDateShort(stay.checkIn)} – ${formatDateShort(stay.checkOut)}, including all taxes and fees.`}
          action={<ButtonLink href={`/hotels?${stayQs}`} variant="secondary" iconRight={<ArrowRight className="size-4" aria-hidden />}>Browse all hotels</ButtonLink>}
        />
        <div className="grid gap-5 md:grid-cols-2">
          {featured.map((item) => (
            <HotelResultCard key={item.id} item={item} layout="stack" href={`/hotels/${item.slug}?${stayQs}`} />
          ))}
        </div>
      </section>

      {/* Trips */}
      <section className="mt-24 bg-sand py-20">
        <div className="container-page">
          <SectionHeader eyebrow="Curated journeys" title="Trips planned down to the last detail" description="Multi-day itineraries with hand-chosen hotels, expert guides and time to simply be." action={<ButtonLink href="/trips" variant="secondary" iconRight={<ArrowRight className="size-4" aria-hidden />}>Explore trips</ButtonLink>} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((t) => (
              <TripCard key={t.id} trip={t} destinationName={destinationName(t.destinationId)} />
            ))}
          </div>
        </div>
      </section>

      {/* Experiences */}
      <section className="container-page pt-20">
        <SectionHeader eyebrow="Experiences" title="Moments you'll talk about for years" action={<ButtonLink href="/experiences" variant="secondary" iconRight={<ArrowRight className="size-4" aria-hidden />}>All experiences</ButtonLink>} />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {experiences.map((e) => (
            <ExperienceCard key={e.id} experience={e} destinationName={destinationName(e.destinationId)} />
          ))}
        </div>
      </section>

      {/* Deals */}
      <section className="container-page pt-24">
        <div className="relative isolate overflow-hidden rounded-xl bg-navy px-6 py-12 text-white sm:px-12 lg:py-16">
          <Image src={photoUrl("maldivesAerial")} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-25" />
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="eyebrow !text-gold-soft">Member offers</p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl">Savings, clearly stated.</h2>
              <p className="mt-4 max-w-md text-white/80">Our offers show exactly what you save on the itemised price — no inflated &ldquo;was&rdquo; prices, no small print.</p>
              <ButtonLink href="/deals" variant="inverse" className="mt-8" iconRight={<ArrowRight className="size-4" aria-hidden />}>
                See all deals
              </ButtonLink>
            </div>
            <ul className="grid gap-3">
              {promos.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 rounded-lg border border-white/15 bg-white/[0.06] p-4">
                  <div>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-sm text-white/70">{p.description}</p>
                  </div>
                  <code className="shrink-0 rounded-sm border border-gold-soft/60 px-2.5 py-1 font-mono text-sm tracking-wider text-gold-soft">{p.code}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="container-page pt-24">
        <SectionHeader eyebrow="Travel guides" title="Inspiration from our editors" action={<ButtonLink href="/guides" variant="secondary" iconRight={<ArrowRight className="size-4" aria-hidden />}>Read the journal</ButtonLink>} />
        <div className="grid gap-5 md:grid-cols-3">
          {guides.map((g) => (
            <GuideCard key={g.id} guide={g} />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="container-page pt-24">
        <div className="grid gap-8 rounded-xl border border-line bg-surface p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-4xl text-ink">Travel notes, once a month.</h2>
            <p className="mt-3 text-muted">New hotels, quiet-season secrets and member-only offers. Unsubscribe any time.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
