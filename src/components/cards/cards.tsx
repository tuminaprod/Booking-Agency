import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, Clock, MapPin, Sparkles, TrendingUp, Users } from "lucide-react";
import type { Destination, Experience, TravelGuide, Trip } from "@/lib/models";
import { EXPERIENCE_CATEGORIES, GUIDE_CATEGORY_LABEL, TRIP_CATEGORY_LABEL } from "@/lib/data/catalog";
import { formatDate, formatDuration, plural } from "@/lib/format";
import type { DestinationStats } from "@/server/catalog";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { RatingBadge } from "@/components/ui/rating";
import { SaveButton } from "@/components/ui/save-button";
import { cn } from "@/lib/cn";

const cardBase = "group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card focus-within:shadow-card";
const stretched = "after:absolute after:inset-0 after:content-[''] focus-visible:outline-none";
const imgZoom = "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]";

/* ------------------------------------------------------------------ */

export function DestinationCard({ destination, stats, size = "md", priority }: { destination: Destination; stats: DestinationStats; size?: "md" | "lg"; priority?: boolean }) {
  return (
    <article className={cardBase}>
      <div className={cn("relative overflow-hidden bg-sand", size === "lg" ? "aspect-[4/5]" : "aspect-[4/3]")}>
        <Image src={destination.heroImage.src} alt={destination.heroImage.alt} fill priority={priority} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className={imgZoom} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="absolute right-3 top-3 z-10">
          <SaveButton
            type="destination"
            entityId={destination.id}
            snapshot={{
              title: destination.name,
              subtitle: `${destination.region}, ${destination.country}`,
              href: `/destinations/${destination.slug}`,
              image: destination.heroImage,
              priceFrom: stats.startingHotelPrice ?? undefined,
              priceUnit: "night",
            }}
          />
        </div>
        {destination.popularity >= 95 && (
          <Badge tone="overlay" className="absolute left-3 top-3" icon={<TrendingUp className="size-3" aria-hidden />}>
            Trending
          </Badge>
        )}
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-white/85">{destination.country}</p>
          <h3 className="font-display text-[2rem] leading-none">
            <Link href={`/destinations/${destination.slug}`} className={stretched}>
              {destination.name}
            </Link>
          </h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="line-clamp-2 text-[0.9375rem] text-ink-soft">{destination.tagline}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-muted">
          <span className="inline-flex items-center gap-1">
            <Building2 className="size-3.5" aria-hidden />
            {plural(stats.hotelCount, "hotel")}
          </span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="size-3.5" aria-hidden />
            {plural(stats.experienceCount, "experience")}
          </span>
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="size-3.5" aria-hidden />
            {destination.popularity}% popularity
          </span>
        </div>
        {stats.startingHotelPrice !== null && (
          <p className="border-t border-line pt-3 text-sm text-muted">
            Hotels from <span className="font-semibold text-ink"><Money usd={stats.startingHotelPrice} /></span> / night
          </p>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */

export function TripCard({ trip, destinationName, priority }: { trip: Trip; destinationName: string; priority?: boolean }) {
  const activities = trip.days.reduce((n, d) => n + d.activities.length, 0);
  return (
    <article className={cardBase}>
      <div className="relative aspect-[3/2] overflow-hidden bg-sand">
        <Image src={trip.images[0].src} alt={trip.images[0].alt} fill priority={priority} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className={imgZoom} />
        <Badge tone="overlay" className="absolute left-3 top-3">
          {TRIP_CATEGORY_LABEL[trip.category]}
        </Badge>
        <div className="absolute right-3 top-3 z-10">
          <SaveButton type="trip" entityId={trip.id} snapshot={{ title: trip.title, subtitle: `${trip.durationDays} days · ${destinationName}`, href: `/trips/${trip.slug}`, image: trip.images[0], priceFrom: trip.priceFrom, priceUnit: "person", rating: trip.rating, reviewCount: trip.reviewCount }} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-[0.8125rem] text-muted">
          <MapPin className="size-3.5" aria-hidden />
          {destinationName}
          {trip.stops.length > 1 && <span className="truncate"> · {trip.stops.slice(0, 3).join(", ")}</span>}
        </p>
        <h3 className="mt-1.5 font-display text-2xl leading-tight text-ink">
          <Link href={`/trips/${trip.slug}`} className={stretched}>
            {trip.title}
          </Link>
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5 text-muted" aria-hidden />
            {trip.durationDays} days
          </span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="size-3.5 text-muted" aria-hidden />
            {activities} activities
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5 text-muted" aria-hidden />
            Up to {trip.groupSize.max}
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <RatingBadge rating={trip.rating} reviews={trip.reviewCount} size="sm" showLabel={false} />
          <div className="text-right">
            <p className="text-xs text-muted">From</p>
            <p className="text-xl font-semibold tabular-nums text-ink">
              <Money usd={trip.priceFrom} />
            </p>
            <p className="text-xs text-muted">per person</p>
          </div>
        </div>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-navy">
          View trip <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */

export function ExperienceCard({ experience, destinationName, priority }: { experience: Experience; destinationName: string; priority?: boolean }) {
  const category = EXPERIENCE_CATEGORIES.find((c) => c.id === experience.category);
  return (
    <article className={cardBase}>
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <Image src={experience.images[0].src} alt={experience.images[0].alt} fill priority={priority} sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className={imgZoom} />
        {category && (
          <Badge tone="overlay" className="absolute left-3 top-3">
            {category.label}
          </Badge>
        )}
        <div className="absolute right-3 top-3 z-10">
          <SaveButton
            type="experience"
            entityId={experience.id}
            snapshot={{ title: experience.title, subtitle: `${formatDuration(experience.durationHours)} · ${destinationName}`, href: `/experiences/${experience.slug}`, image: experience.images[0], priceFrom: experience.priceFrom, priceUnit: "person", rating: experience.rating, reviewCount: experience.reviewCount }}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-3 text-[0.8125rem] text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {destinationName}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {formatDuration(experience.durationHours)}
          </span>
        </p>
        <h3 className="mt-1.5 text-[1.0625rem] font-semibold leading-snug text-ink">
          <Link href={`/experiences/${experience.slug}`} className={stretched}>
            {experience.title}
          </Link>
        </h3>
        <div className="mt-2">
          <RatingBadge rating={experience.rating} reviews={experience.reviewCount} size="sm" showLabel={false} />
        </div>
        <div className="mt-auto flex items-end justify-between pt-4">
          <p className="text-sm text-muted">
            From <span className="text-lg font-semibold tabular-nums text-ink"><Money usd={experience.priceFrom} /></span> / person
          </p>
          <span className="pointer-events-none inline-flex h-9 items-center rounded-md bg-navy px-3.5 text-sm font-medium text-white transition-colors group-hover:bg-navy-700" aria-hidden>
            Book now
          </span>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */

export function GuideCard({ guide, featured }: { guide: TravelGuide; featured?: boolean }) {
  return (
    <article className={cn(cardBase, "hover:translate-y-0", featured && "lg:flex-row")}>
      <div className={cn("relative overflow-hidden bg-sand", featured ? "aspect-[16/10] lg:aspect-auto lg:w-3/5" : "aspect-[16/10]")}>
        <Image src={guide.heroImage.src} alt={guide.heroImage.alt} fill sizes={featured ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"} className={imgZoom} />
      </div>
      <div className={cn("flex flex-1 flex-col p-5", featured && "lg:justify-center lg:p-10")}>
        <p className="eyebrow">{GUIDE_CATEGORY_LABEL[guide.category]}</p>
        <h3 className={cn("mt-2 font-display leading-tight text-ink", featured ? "text-3xl lg:text-4xl" : "text-2xl")}>
          <Link href={`/guides/${guide.slug}`} className={stretched}>
            {guide.title}
          </Link>
        </h3>
        <p className={cn("mt-2 text-[0.9375rem] text-ink-soft", !featured && "line-clamp-2")}>{guide.excerpt}</p>
        <p className="mt-auto pt-4 text-[0.8125rem] text-muted">
          {guide.author.name} · {formatDate(guide.publishedAt)} · {guide.readingMinutes} min read
        </p>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */

export function SectionHeader({ eyebrow, title, description, action, className, as: As = "h2" }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode; className?: string; as?: "h1" | "h2" }) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <As className="font-display text-[2.125rem] text-ink sm:text-[2.625rem]">{title}</As>
        {description && <p className="mt-3 text-[1.0625rem] text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
