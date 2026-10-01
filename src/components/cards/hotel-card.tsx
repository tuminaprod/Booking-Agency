import Image from "next/image";
import Link from "next/link";
import { Check, Coffee, MapPin, ShieldCheck, Waves, Wifi, Sparkles as SpaIcon, Car, Umbrella, Baby, CarTaxiFront } from "lucide-react";
import type { AmenityId } from "@/lib/models";
import { cn } from "@/lib/cn";
import { PROPERTY_TYPE_LABEL } from "@/lib/data/catalog";
import { plural } from "@/lib/format";
import type { HotelSearchItem } from "@/lib/search/hotel-query";
import { HotelBadge, DealBadge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { RatingBadge, Stars } from "@/components/ui/rating";
import { SaveButton } from "@/components/ui/save-button";
import { buttonClasses } from "@/components/ui/button";

const AMENITY_ICON: Partial<Record<AmenityId, typeof Wifi>> = {
  pool: Waves,
  spa: SpaIcon,
  wifi: Wifi,
  breakfast: Coffee,
  parking: Car,
  beachfront: Umbrella,
  "family-friendly": Baby,
  "airport-transfer": CarTaxiFront,
};
const AMENITY_SHORT: Partial<Record<AmenityId, string>> = {
  pool: "Pool",
  spa: "Spa",
  wifi: "Wi-Fi",
  breakfast: "Breakfast",
  parking: "Parking",
  beachfront: "Beachfront",
  "family-friendly": "Family",
  "airport-transfer": "Transfers",
};
const SHOWN: AmenityId[] = ["pool", "spa", "beachfront", "breakfast", "family-friendly", "airport-transfer", "parking", "wifi"];

export function hotelSnapshot(item: HotelSearchItem) {
  return {
    title: item.name,
    subtitle: `${item.neighborhood}, ${item.destinationName}`,
    href: `/hotels/${item.slug}`,
    image: item.images[0],
    priceFrom: item.price.perNight,
    priceUnit: "night",
    rating: item.rating,
    reviewCount: item.reviewCount,
    stars: item.stars,
    compare: {
      propertyType: PROPERTY_TYPE_LABEL[item.propertyType],
      neighborhood: item.neighborhood,
      amenities: item.amenities,
      cancellation: item.room.cancellationSummary,
      breakfast: item.room.breakfastIncluded,
      distanceKm: item.distanceKm,
    },
  };
}

interface Props {
  item: HotelSearchItem;
  href: string;
  highlighted?: boolean;
  priority?: boolean;
  onHover?: (id: string | null) => void;
  layout?: "row" | "stack";
}

/** Search-result hotel card with the full, transparent price summary. */
export function HotelResultCard({ item, href, highlighted, priority, onHover, layout = "row" }: Props) {
  const amenities = SHOWN.filter((a) => item.amenities.includes(a)).slice(0, 4);
  const badges = item.badges.filter((b) => b !== "free-cancellation" && b !== "breakfast").slice(0, 2);
  const stack = layout === "stack";
  return (
    <article
      id={`hotel-${item.id}`}
      onMouseEnter={onHover ? () => onHover(item.id) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      onFocus={onHover ? () => onHover(item.id) : undefined}
      className={cn(
        "group relative grid overflow-hidden rounded-lg border bg-surface transition-[box-shadow,border-color] duration-200 hover:shadow-card",
        stack ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-[minmax(0,17rem)_1fr] xl:grid-cols-[minmax(0,19rem)_1fr]",
        highlighted ? "border-gold shadow-card ring-1 ring-gold" : "border-line",
      )}
    >
      <div className={cn("relative overflow-hidden bg-sand", stack ? "aspect-[4/3]" : "aspect-[4/3] sm:aspect-auto sm:min-h-full")}>
        <Image
          src={item.images[0].src}
          alt={item.images[0].alt}
          fill
          priority={priority}
          sizes={stack ? "(min-width: 1024px) 33vw, 100vw" : "(min-width: 640px) 19rem, 100vw"}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <HotelBadge key={b} badge={b} />
          ))}
        </div>
        <div className="absolute right-3 top-3 z-10">
          <SaveButton type="hotel" entityId={item.id} snapshot={hotelSnapshot(item)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[0.8125rem] text-muted">
            <span>{PROPERTY_TYPE_LABEL[item.propertyType]}</span>
            <Stars count={item.stars} />
          </div>
          <h3 className="mt-1 font-display text-[1.6rem] leading-tight text-ink">
            <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {item.name}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {item.neighborhood}, {item.destinationName} · {item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)} m` : `${item.distanceKm} km`} from centre
            </span>
          </p>
          <div className="mt-3">
            <RatingBadge rating={item.rating} reviews={item.reviewCount} size="sm" />
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.8125rem] text-ink-soft" aria-label="Key amenities">
            {amenities.map((a) => {
              const Icon = AMENITY_ICON[a] ?? Check;
              return (
                <li key={a} className="inline-flex items-center gap-1">
                  <Icon className="size-3.5 text-muted" aria-hidden />
                  {AMENITY_SHORT[a]}
                </li>
              );
            })}
          </ul>
          <div className="mt-3 border-l-2 border-line pl-3 text-[0.8125rem]">
            <p className="font-medium text-ink">{item.room.name}</p>
            <p className="text-muted">{item.room.bedsLabel}</p>
            {item.room.cancellation === "free" ? (
              <p className="mt-0.5 inline-flex items-center gap-1 font-medium text-success">
                <ShieldCheck className="size-3.5" aria-hidden /> {item.room.cancellationSummary}
              </p>
            ) : (
              <p className="mt-0.5 text-muted">{item.room.cancellationSummary}</p>
            )}
            {item.room.breakfastIncluded && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-ink-soft">
                <Coffee className="size-3.5" aria-hidden /> Breakfast included
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col justify-between gap-3 border-t border-line pt-4 lg:w-48 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 lg:text-right">
          <div className="flex flex-wrap gap-1.5 lg:justify-end">
            {item.dealLabel && <DealBadge label={item.dealLabel.replace(/\s*\(.*\)/, "")} />}
            {item.availableUnits <= 2 && <span className="text-[0.8125rem] font-semibold text-warning">Only {plural(item.availableUnits, "room")} left</span>}
          </div>
          <div>
            {item.price.originalPerNight && (
              <p className="text-sm text-muted line-through">
                <span className="sr-only">Was </span>
                <Money usd={item.price.originalPerNight} />
              </p>
            )}
            <p className="text-2xl font-semibold tabular-nums text-ink">
              <Money usd={item.price.perNight} />
              <span className="text-sm font-normal text-muted"> / night</span>
            </p>
            <p className="text-sm font-medium text-ink">
              <Money usd={item.price.total} /> total
            </p>
            <p className="text-[0.8125rem] leading-snug text-muted">
              {plural(item.price.nights, "night")}, incl. <Money usd={item.price.taxesAndFees} /> taxes & fees
              {item.price.dueAtProperty > 0 && (
                <>
                  {" "}
                  (<Money usd={item.price.dueAtProperty} /> paid at property)
                </>
              )}
            </p>
          </div>
          <span className={buttonClasses("primary", "md", "pointer-events-none w-full")} aria-hidden>
            View rooms
          </span>
        </div>
      </div>
    </article>
  );
}
