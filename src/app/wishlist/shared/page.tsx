import { Heart } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { destinationName, destinationStats, getDestinationById, getExperience, getHotelById, listExperiences, listTrips } from "@/server/catalog";
import { DestinationCard, ExperienceCard, TripCard } from "@/components/cards/cards";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { RatingBadge, Stars } from "@/components/ui/rating";

type Props = { searchParams: Promise<{ items?: string; title?: string }> };

export const metadata = buildMetadata({ title: "Shared wishlist", description: "A collection of places saved on Oriel.", path: "/wishlist/shared", noIndex: true });

/** Read-only view of a shared wishlist. Items are resolved from the catalogue server-side. */
export default async function SharedWishlistPage({ searchParams }: Props) {
  const { items = "", title } = await searchParams;
  const refs = items
    .split(",")
    .map((s) => s.split(":"))
    .filter((p) => p.length === 2)
    .slice(0, 40);
  const hotels = refs.filter(([t]) => t === "hotel").map(([, id]) => getHotelById(id)).filter((x) => x !== undefined);
  const dests = refs.filter(([t]) => t === "destination").map(([, id]) => getDestinationById(id)).filter((x) => x !== undefined);
  const trips = refs.filter(([t]) => t === "trip").map(([, id]) => listTrips().find((x) => x.id === id)).filter((x) => x !== undefined);
  const exps = refs.filter(([t]) => t === "experience").map(([, id]) => listExperiences().find((x) => x.id === id) ?? getExperience(id)).filter((x) => x !== undefined);
  const count = hotels.length + dests.length + trips.length + exps.length;

  return (
    <div className="container-page pt-10">
      <p className="eyebrow">Shared with you</p>
      <h1 className="mt-2 font-display text-5xl text-ink">{title?.slice(0, 80) || "A shared wishlist"}</h1>
      <p className="mt-2 text-muted">{count} saved places. Save your favourites to your own wishlist with the heart icon.</p>
      {count === 0 ? (
        <EmptyState className="mt-8" icon={<Heart className="size-6" aria-hidden />} title="This shared list is empty" description="The link may be incomplete or the items are no longer available." action={<ButtonLink href="/">Explore Oriel</ButtonLink>} />
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((h) => (
            <article key={h.id} className="group relative overflow-hidden rounded-lg border border-line bg-surface">
              <div className="relative aspect-[4/3] bg-sand">
                <Image src={h.images[0].src} alt={h.images[0].alt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
              </div>
              <div className="p-5">
                <Stars count={h.stars} />
                <h2 className="mt-1 font-display text-2xl text-ink">
                  <Link href={`/hotels/${h.slug}`} className="after:absolute after:inset-0">
                    {h.name}
                  </Link>
                </h2>
                <p className="text-sm text-muted">
                  {h.neighborhood}, {destinationName(h.destinationId)}
                </p>
                <RatingBadge rating={h.rating} reviews={h.reviewCount} size="sm" className="mt-3" />
              </div>
            </article>
          ))}
          {dests.map((d) => (
            <DestinationCard key={d.id} destination={d} stats={destinationStats(d.id)} />
          ))}
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} destinationName={destinationName(t.destinationId)} />
          ))}
          {exps.map((e) => (
            <ExperienceCard key={e.id} experience={e} destinationName={destinationName(e.destinationId)} />
          ))}
        </div>
      )}
    </div>
  );
}
