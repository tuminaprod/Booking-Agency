"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Star } from "lucide-react";
import type { AmenityId, PropertyType } from "@/lib/models";
import { cn } from "@/lib/cn";
import { AMENITIES, PROPERTY_TYPE_LABEL } from "@/lib/data/catalog";
import { FEATURE_FILTERS, type FeatureFilter, type HotelSearchFacets, type HotelSearchQuery } from "@/lib/search/hotel-query";
import { Checkbox, Radio } from "@/components/ui/field";
import { PriceRange } from "@/components/ui/range-slider";

const EXTRA_AMENITIES: AmenityId[] = ["wifi", "gym", "restaurant", "bar", "room-service", "kids-club", "pet-friendly", "hot-tub", "ev-charging", "butler"];

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <fieldset className="border-b border-line py-5 first:pt-0 last:border-0">
      <legend className="contents">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between text-left text-[0.9375rem] font-semibold text-ink">
          {title}
          <ChevronDown className={cn("size-4 text-muted transition-transform duration-200", open && "rotate-180")} aria-hidden />
        </button>
      </legend>
      {open && <div className="mt-3">{children}</div>}
    </fieldset>
  );
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function activeFilterCount(q: HotelSearchQuery): number {
  return (
    (q.priceMin !== undefined || q.priceMax !== undefined ? 1 : 0) +
    q.stars.length +
    (q.minRating !== undefined ? 1 : 0) +
    q.types.length +
    q.amenities.length +
    q.features.length +
    q.neighborhoods.length
  );
}

export function FiltersPanel({ query, facets, onChange }: { query: HotelSearchQuery; facets: HotelSearchFacets; onChange: (patch: Partial<HotelSearchQuery>) => void }) {
  const featureCount = (id: FeatureFilter) => facets.features.find((f) => f.id === id)?.count ?? 0;
  const [lo, hi] = facets.priceRange;
  return (
    <div>
      <Group title="Price per night">
        <PriceRange key={`${lo}-${hi}`} min={lo} max={Math.max(hi, lo + 20)} value={[query.priceMin, query.priceMax]} onCommit={([priceMin, priceMax]) => onChange({ priceMin, priceMax })} />
      </Group>

      <Group title="Popular filters">
        {FEATURE_FILTERS.map((f) => (
          <Checkbox key={f.id} label={f.label} count={featureCount(f.id)} checked={query.features.includes(f.id)} onChange={() => onChange({ features: toggle(query.features, f.id) })} />
        ))}
      </Group>

      <Group title="Star rating">
        <div className="flex flex-wrap gap-2">
          {facets.stars.map(({ value, count }) => {
            const on = query.stars.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ stars: toggle(query.stars, value) })}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-md border px-3.5 text-sm font-medium transition-colors",
                  on ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-ink hover:border-ink/50",
                )}
              >
                {value}
                <Star className="size-3.5" fill="currentColor" strokeWidth={0} aria-hidden />
                <span className={cn("text-xs", on ? "text-white/75" : "text-muted")}>({count})</span>
                <span className="sr-only">{value}-star hotels</span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Guest rating">
        {[
          { v: undefined, label: "Any rating" },
          { v: 9.5, label: "Exceptional 9.5+" },
          { v: 9, label: "Superb 9+" },
          { v: 8.5, label: "Excellent 8.5+" },
          { v: 8, label: "Very good 8+" },
        ].map((o) => (
          <Radio key={o.label} name="minRating" label={o.label} checked={query.minRating === o.v} onChange={() => onChange({ minRating: o.v })} />
        ))}
      </Group>

      {facets.types.length > 1 && (
        <Group title="Property type">
          {facets.types.map(({ id, count }) => (
            <Checkbox key={id} label={PROPERTY_TYPE_LABEL[id as PropertyType]} count={count} checked={query.types.includes(id)} onChange={() => onChange({ types: toggle(query.types, id) })} />
          ))}
        </Group>
      )}

      {facets.neighborhoods.length > 1 && (
        <Group title="Location">
          {facets.neighborhoods.slice(0, 10).map(({ name, count }) => (
            <Checkbox key={name} label={name} count={count} checked={query.neighborhoods.includes(name)} onChange={() => onChange({ neighborhoods: toggle(query.neighborhoods, name) })} />
          ))}
        </Group>
      )}

      <Group title="Amenities" defaultOpen={false}>
        {EXTRA_AMENITIES.map((a) => (
          <Checkbox key={a} label={AMENITIES[a].label} checked={query.amenities.includes(a)} onChange={() => onChange({ amenities: toggle(query.amenities, a) })} />
        ))}
      </Group>
    </div>
  );
}
