import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertCircle, Clock, Globe2, MapPin, Sparkles, Users } from "lucide-react";
import { EXPERIENCE_CATEGORIES } from "@/lib/data/catalog";
import { formatDuration } from "@/lib/format";
import { buildMetadata, breadcrumbJsonLd, experienceJsonLd } from "@/lib/seo";
import { destinationName, getDestinationById, getExperience, listExperiences, reviewsFor } from "@/server/catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { Gallery } from "@/components/detail/gallery";
import { Breadcrumbs, DetailSection, IncludedList, ReviewsBlock, SectionNav } from "@/components/detail/parts";
import { ShareButton, TrackRecentlyViewed } from "@/components/detail/client-parts";
import { ExperienceBookingCard } from "@/components/experiences/experience-booking";
import { ExperienceCard } from "@/components/cards/cards";
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
  return listExperiences().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = getExperience((await params).slug);
  if (!e) return {};
  return buildMetadata({ title: `${e.title} in ${destinationName(e.destinationId)}`, description: e.summary, path: `/experiences/${e.slug}`, image: e.images[0].src });
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ExperiencePage({ params }: Props) {
  const exp = getExperience((await params).slug);
  if (!exp) notFound();
  const dest = getDestinationById(exp.destinationId)!;
  const reviews = reviewsFor("experience", exp.id);
  const category = EXPERIENCE_CATEGORIES.find((c) => c.id === exp.category);
  const related = listExperiences()
    .filter((e) => e.id !== exp.id && (e.destinationId === exp.destinationId || e.category === exp.category))
    .slice(0, 4);
  const snapshot = { title: exp.title, subtitle: `${formatDuration(exp.durationHours)} · ${dest.name}`, href: `/experiences/${exp.slug}`, image: exp.images[0], priceFrom: exp.priceFrom, priceUnit: "person", rating: exp.rating, reviewCount: exp.reviewCount };

  return (
    <div className="pb-24 lg:pb-0">
      <JsonLd data={[experienceJsonLd(exp, dest), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Experiences", path: "/experiences" }, { name: exp.title, path: `/experiences/${exp.slug}` }])]} />
      <TrackRecentlyViewed type="experience" entityId={exp.id} snapshot={snapshot} />
      <div className="container-page pt-6">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Experiences", href: "/experiences" }, { name: dest.name, href: `/experiences?destination=${dest.slug}` }, { name: exp.title }]} />
        <header className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              {category && <Badge tone="gold">{category.label}</Badge>}
              <span className="flex items-center gap-1 text-sm text-muted">
                <MapPin className="size-3.5" aria-hidden /> {dest.name}, {dest.country}
              </span>
            </div>
            <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{exp.title}</h1>
            <p className="mt-2 text-lg text-ink-soft">{exp.summary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="#reviews">
              <RatingBadge rating={exp.rating} reviews={exp.reviewCount} />
            </a>
            <ShareButton title={exp.title} />
            <SaveButton type="experience" entityId={exp.id} snapshot={snapshot} variant="outline" />
          </div>
        </header>
        <Gallery images={exp.images} className="mt-6" />
      </div>

      <div className="container-page mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <SectionNav items={[{ id: "about", label: "About" }, { id: "itinerary", label: "Itinerary" }, { id: "included", label: "Included" }, { id: "meeting", label: "Meeting point" }, { id: "availability", label: "Availability" }, { id: "reviews", label: "Reviews" }]} />
          <div className="pt-8">
            <DetailSection id="about" title="About this experience">
              <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Clock, label: "Duration", value: formatDuration(exp.durationHours) },
                  { icon: Users, label: "Group", value: exp.groupSize.private ? "Private" : `Max ${exp.groupSize.max}` },
                  { icon: Globe2, label: "Languages", value: exp.languages.join(", ") },
                  { icon: Sparkles, label: "Confirmation", value: "Instant" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-lg border border-line bg-surface p-4">
                    <Icon className="size-5 text-gold" aria-hidden />
                    <dt className="mt-2 text-xs uppercase tracking-[0.12em] text-muted">{label}</dt>
                    <dd className="font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="prose-oriel">
                {exp.description.map((p) => (
                  <p key={p.slice(0, 16)}>{p}</p>
                ))}
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {exp.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5 text-[0.9375rem] text-ink-soft">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </DetailSection>

            <DetailSection id="itinerary" title="What you'll do">
              <ol className="relative space-y-5 border-l border-line pl-6">
                {exp.itinerary.map((step) => (
                  <li key={step.title} className="relative">
                    <span className="absolute -left-[31px] top-1 size-3.5 rounded-full border-2 border-gold bg-surface" aria-hidden />
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{step.time.startsWith("0:") ? `+${step.time}` : step.time}</p>
                    <p className="font-semibold text-ink">{step.title}</p>
                    <p className="text-[0.9375rem] text-ink-soft">{step.description}</p>
                  </li>
                ))}
              </ol>
            </DetailSection>

            <DetailSection id="included" title="Included & requirements">
              <IncludedList included={exp.included} excluded={exp.excluded} />
              {exp.requirements.length > 0 && (
                <>
                  <h3 className="mb-3 mt-8 font-semibold text-ink">Know before you go</h3>
                  <ul className="space-y-2">
                    {exp.requirements.map((r) => (
                      <li key={r} className="flex gap-2.5 text-[0.9375rem] text-ink-soft">
                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                        {r}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </DetailSection>

            <DetailSection id="meeting" title="Meeting point">
              <div className="rounded-lg border border-line bg-surface p-5">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <MapPin className="size-4 text-gold" aria-hidden /> {exp.meetingPoint.name}
                </p>
                <p className="mt-1 text-[0.9375rem] text-ink-soft">{exp.meetingPoint.address}</p>
                <p className="mt-2 text-sm text-muted">{exp.meetingPoint.notes}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(exp.meetingPoint.address)}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-navy hover:underline">
                  Open in maps ↗
                </a>
              </div>
            </DetailSection>

            <DetailSection id="availability" title="Availability">
              <p className="text-[0.9375rem] text-ink-soft">
                Runs {exp.runsOn.length === 7 ? "every day" : `on ${exp.runsOn.map((d) => DAYS[d]).join(", ")}`} at {exp.timeSlots.join(" and ")}. {exp.cancellation.summary}.
              </p>
              <div className="mt-5 lg:hidden">
                <ExperienceBookingCard experience={exp} />
              </div>
            </DetailSection>

            <DetailSection id="reviews" title="Reviews">
              <ReviewsBlock rating={exp.rating} count={exp.reviewCount} reviews={reviews} />
            </DetailSection>
          </div>
        </div>
        <aside className="hidden lg:block" aria-label="Book this experience">
          <div className="sticky top-24">
            <ExperienceBookingCard experience={exp} />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-page mt-16">
          <h2 className="mb-6 font-display text-3xl text-ink">Related experiences</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((e) => (
              <ExperienceCard key={e.id} experience={e} destinationName={destinationName(e.destinationId)} />
            ))}
          </div>
        </section>
      )}

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="container-page flex h-[72px] items-center justify-between gap-4">
          <p>
            <span className="block text-xs text-muted">From</span>
            <span className="text-lg font-semibold tabular-nums text-ink">
              <Money usd={exp.priceFrom} />
            </span>
            <span className="text-sm text-muted"> / person</span>
          </p>
          <ButtonLink href="#availability" className="px-6">
            Check availability
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
