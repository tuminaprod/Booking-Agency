import { Suspense } from "react";
import { MapPinned } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { photoUrl } from "@/lib/data/photos";
import { TRAVEL_CATEGORIES } from "@/lib/data/catalog";
import type { TravelCategory } from "@/lib/models";
import { destinationStats, listDestinations } from "@/server/catalog";
import { DestinationCard, SectionHeader } from "@/components/cards/cards";
import { ListingToolbar } from "@/components/listing/listing-toolbar";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export const metadata = buildMetadata({
  title: "Destinations — where to travel next",
  description: "Explore the world's most beautiful destinations with our editors' guides, handpicked hotels and local experiences.",
  path: "/destinations",
  image: photoUrl("santorini"),
});

const CONTINENTS = ["Europe", "Asia", "Middle East", "Africa", "Indian Ocean"];

export default async function DestinationsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const region = sp.region;
  const style = sp.style as TravelCategory | undefined;
  const sort = sp.sort ?? "popular";
  let items = listDestinations().filter((d) => (!region || d.continent === region) && (!style || d.categories.includes(style)));
  items = [...items].sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "price" ? (destinationStats(a.id).startingHotelPrice ?? 0) - (destinationStats(b.id).startingHotelPrice ?? 0) : b.popularity - a.popularity));

  return (
    <div className="container-page pt-10">
      <SectionHeader as="h1" eyebrow="Destinations" title="Where will you go next?" description="Sixteen places our editors know intimately — with the hotels, trips and experiences we'd book ourselves." />
      <Suspense>
        <ListingToolbar
          categories={CONTINENTS.map((c) => ({ id: c, label: c }))}
          categoryParam="region"
          sorts={[
            { id: "popular", label: "Most popular" },
            { id: "name", label: "A–Z" },
            { id: "price", label: "Lowest hotel price" },
          ]}
          total={items.length}
          noun={["destination", "destinations"]}
          extraChips={style ? [{ param: "style", label: TRAVEL_CATEGORIES.find((c) => c.id === style)?.label ?? style }] : []}
        />
      </Suspense>
      <div className="mt-6">
        {items.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d, i) => (
              <DestinationCard key={d.id} destination={d} stats={destinationStats(d.id)} priority={i < 3} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<MapPinned className="size-6" aria-hidden />} title="No destinations here yet" description="We're adding new places carefully. Try another region." action={<ButtonLink href="/destinations">All destinations</ButtonLink>} />
        )}
      </div>
    </div>
  );
}
