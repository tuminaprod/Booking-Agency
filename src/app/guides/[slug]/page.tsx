import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lightbulb } from "lucide-react";
import type { GuideBlock } from "@/lib/models";
import { GUIDE_CATEGORY_LABEL } from "@/lib/data/catalog";
import { defaultStay } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { destinationName, destinationStats, getDestinationById, getExperience, getGuide, getHotelById, listExperiences, listGuides } from "@/server/catalog";
import { searchHotels } from "@/server/hotel-search";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/detail/parts";
import { ShareButton } from "@/components/detail/client-parts";
import { DestinationCard, ExperienceCard, GuideCard } from "@/components/cards/cards";
import { HotelResultCard } from "@/components/cards/hotel-card";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;
// Only known slugs exist; anything else is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return listGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = getGuide((await params).slug);
  if (!g) return {};
  const meta = buildMetadata({ title: g.title, description: g.excerpt, path: `/guides/${g.slug}`, image: g.heroImage.src });
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: g.publishedAt, modifiedTime: g.updatedAt ?? g.publishedAt, authors: [g.author.name] } };
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "list":
      return (
        <ul>
          {block.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );
    case "tip":
      return (
        <aside className="my-6 flex gap-3 rounded-lg border border-gold/30 bg-gold-tint p-5">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
          <div>
            <p className="font-semibold text-ink">{block.title}</p>
            <p className="!mb-0 mt-1 !text-[0.9375rem]">{block.text}</p>
          </div>
        </aside>
      );
    case "quote":
      return (
        <blockquote className="my-8 border-l-2 border-gold pl-6">
          <p className="!mb-2 font-display !text-3xl !leading-snug !text-ink">“{block.text}”</p>
          {block.cite && <cite className="text-sm not-italic text-muted">— {block.cite}</cite>}
        </blockquote>
      );
    case "image":
      return (
        <figure className="my-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-sand">
            <Image src={block.image.src} alt={block.image.alt} fill sizes="(min-width: 1024px) 720px, 100vw" className="object-cover" />
          </div>
          {block.caption && <figcaption className="mt-2 text-sm text-muted">{block.caption}</figcaption>}
        </figure>
      );
  }
}

export default async function GuidePage({ params }: Props) {
  const g = getGuide((await params).slug);
  if (!g) notFound();
  const stay = defaultStay();
  const destinations = g.relatedDestinationIds.map(getDestinationById).filter((x) => x !== undefined);
  const hotelIds = new Set(g.relatedHotelIds);
  const hotels = searchHotels({ destination: "", q: "", ...stay, adults: 2, children: 0, rooms: 1, stars: [], types: [], amenities: [], features: [], neighborhoods: [], sort: "rating" }).items.filter((i) => hotelIds.has(i.id));
  const fallbackHotels = g.relatedHotelIds.map(getHotelById).filter((h) => h && !hotels.some((x) => x.id === h.id));
  const experiences = g.relatedExperienceIds.map(getExperience).filter((x) => x !== undefined);
  const expFallback = experiences.length ? experiences : listExperiences().filter((e) => g.relatedDestinationIds.includes(e.destinationId)).slice(0, 2);
  const more = listGuides().filter((x) => x.id !== g.id).slice(0, 3);

  return (
    <article>
      <JsonLd data={[articleJsonLd(g), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }, { name: g.title, path: `/guides/${g.slug}` }])]} />
      <header className="container-page max-w-5xl pt-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Guides", href: "/guides" }, { name: GUIDE_CATEGORY_LABEL[g.category], href: `/guides?category=${g.category}` }]} />
        <p className="eyebrow mt-8">{GUIDE_CATEGORY_LABEL[g.category]}</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] text-ink sm:text-6xl">{g.title}</h1>
        <p className="mt-4 max-w-3xl text-xl text-ink-soft">{g.excerpt}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-navy font-semibold text-white" aria-hidden>
              {g.author.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
            <div className="text-sm">
              <p className="font-semibold text-ink">{g.author.name}</p>
              <p className="text-muted">
                {g.author.role} · <time dateTime={g.publishedAt}>{formatDate(g.publishedAt)}</time>
                {g.updatedAt && (
                  <>
                    {" "}
                    · Updated <time dateTime={g.updatedAt}>{formatDate(g.updatedAt)}</time>
                  </>
                )}{" "}
                · {g.readingMinutes} min read
              </p>
            </div>
          </div>
          <ShareButton title={g.title} />
        </div>
      </header>

      <div className="container-page mt-8 max-w-6xl">
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-sand sm:aspect-[21/9]">
          <Image src={g.heroImage.src} alt={g.heroImage.alt} fill priority sizes="(min-width: 1280px) 1152px, 100vw" quality={85} className="object-cover" />
        </div>
      </div>

      <div className="container-page mt-12 grid max-w-6xl gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Table of contents" className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">In this guide</p>
          <ol className="mt-3 space-y-1 border-l border-line">
            {g.sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px flex gap-2 border-l-2 border-transparent py-1.5 pl-4 text-[0.9375rem] text-ink-soft hover:border-gold hover:text-ink">
                  <span className="tabular-nums text-muted">{i + 1}.</span> {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="prose-oriel max-w-[44rem]">
          {g.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="!mb-4 mt-10 font-display text-3xl text-ink first:mt-0">{s.heading}</h2>
              {s.blocks.map((b, i) => (
                <Block key={i} block={b} />
              ))}
            </section>
          ))}
        </div>
      </div>

      <div className="container-page mt-20 max-w-6xl space-y-16">
        {destinations.length > 0 && (
          <section>
            <h2 className="mb-6 font-display text-3xl text-ink">Related destinations</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((d) => (
                <DestinationCard key={d.id} destination={d} stats={destinationStats(d.id)} />
              ))}
            </div>
          </section>
        )}
        {(hotels.length > 0 || fallbackHotels.length > 0) && (
          <section>
            <h2 className="mb-6 font-display text-3xl text-ink">Hotels in this guide</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {hotels.map((h) => (
                <HotelResultCard key={h.id} item={h} layout="stack" href={`/hotels/${h.slug}`} />
              ))}
            </div>
            {fallbackHotels.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {fallbackHotels.map((h) => (
                  <li key={h!.id}>
                    <Link href={`/hotels/${h!.slug}`} className="text-navy hover:underline">
                      {h!.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {expFallback.length > 0 && (
          <section>
            <h2 className="mb-6 font-display text-3xl text-ink">Related experiences</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {expFallback.map((e) => (
                <ExperienceCard key={e.id} experience={e} destinationName={destinationName(e.destinationId)} />
              ))}
            </div>
          </section>
        )}
        <section>
          <h2 className="mb-6 font-display text-3xl text-ink">Keep reading</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {more.map((x) => (
              <GuideCard key={x.id} guide={x} />
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
