import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import type { GuideCategory } from "@/lib/models";
import { GUIDE_CATEGORY_LABEL } from "@/lib/data/catalog";
import { photoUrl } from "@/lib/data/photos";
import { buildMetadata } from "@/lib/seo";
import { listGuides } from "@/server/catalog";
import { GuideCard, SectionHeader } from "@/components/cards/cards";
import { ListingToolbar } from "@/components/listing/listing-toolbar";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";

type Props = { searchParams: Promise<{ category?: string }> };

export const metadata = buildMetadata({
  title: "Travel guides & inspiration",
  description: "Destination guides, things to do, food guides, weekend itineraries and luxury travel advice from the Oriel editors.",
  path: "/guides",
  image: photoUrl("travelFlatlay"),
});

export default async function GuidesPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const guides = listGuides().filter((g) => !category || g.category === (category as GuideCategory));
  const [featured, ...rest] = guides;
  return (
    <div className="container-page pt-10">
      <SectionHeader as="h1" eyebrow="The Oriel Journal" title="Travel guides" description="Honest, well-travelled advice from our editors — where to stay, what to eat and how to see a place properly." />
      <Suspense>
        <ListingToolbar categories={Object.entries(GUIDE_CATEGORY_LABEL).map(([id, label]) => ({ id, label }))} total={guides.length} noun={["guide", "guides"]} />
      </Suspense>
      {featured ? (
        <div className="mt-6 space-y-5">
          <GuideCard guide={featured} featured />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState className="mt-6" icon={<BookOpen className="size-6" aria-hidden />} title="No guides in this category yet" description="Our editors are on the road. Browse all guides in the meantime." action={<ButtonLink href="/guides">All guides</ButtonLink>} />
      )}
    </div>
  );
}
