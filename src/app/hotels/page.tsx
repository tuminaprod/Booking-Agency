import { Suspense } from "react";
import type { Metadata } from "next";
import { ResultsView } from "@/components/hotels/results-view";
import { defaultStay } from "@/lib/dates";
import { parseHotelQuery } from "@/lib/search/hotel-query";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { getDestination } from "@/server/catalog";
import { searchHotels } from "@/server/hotel-search";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function toParams(sp: Record<string, string | string[] | undefined>) {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") out.set(k, v);
  return out;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const dest = typeof sp.destination === "string" ? getDestination(sp.destination) : undefined;
  const title = dest ? `Hotels in ${dest.name}, ${dest.country}` : "Luxury hotels worldwide";
  return buildMetadata({
    title,
    description: dest
      ? `Compare handpicked hotels in ${dest.name} with total prices including taxes and fees. Free cancellation on most stays.`
      : "Search handpicked luxury hotels, resorts and boutique stays with transparent total pricing.",
    // Canonicalise faceted URLs to the destination listing to avoid duplicate content.
    path: dest ? `/hotels?destination=${dest.slug}` : "/hotels",
    image: dest?.heroImage.src,
  });
}

export default async function HotelsPage({ searchParams }: Props) {
  const sp = toParams(await searchParams);
  const defaults = defaultStay();
  const query = parseHotelQuery(sp, defaults);
  const initial = searchHotels(query);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Hotels", path: "/hotels" }])} />
      <Suspense>
        <ResultsView initial={initial} initialKey={sp.toString()} defaults={defaults} />
      </Suspense>
    </>
  );
}
