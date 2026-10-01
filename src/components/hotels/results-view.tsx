"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpDown, List, Map as MapIcon, SearchX, SlidersHorizontal, X } from "lucide-react";
import type { ISODate } from "@/lib/models";
import { cn } from "@/lib/cn";
import { AMENITIES, PROPERTY_TYPE_LABEL } from "@/lib/data/catalog";
import { formatDateShort, guestsLabel, plural } from "@/lib/format";
import { FEATURE_FILTERS, parseHotelQuery, serializeHotelQuery, SORT_OPTIONS, type HotelSearchQuery, type HotelSearchResponse, type HotelSort } from "@/lib/search/hotel-query";
import { useCurrency } from "@/lib/stores";
import { formatMoney } from "@/lib/format";
import { HotelResultCard } from "@/components/cards/hotel-card";
import { MapView } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { Select } from "@/components/ui/field";
import { Money } from "@/components/ui/money";
import { RatingBadge } from "@/components/ui/rating";
import { SearchSummaryBar } from "./search-summary-bar";
import { activeFilterCount, FiltersPanel } from "./filters-panel";

type Result = { key: string; data: HotelSearchResponse } | { key: string; error: string };

function ResultSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-lg border border-line bg-surface sm:grid-cols-[17rem_1fr]" aria-hidden>
      <Skeleton className="aspect-[4/3] rounded-none sm:aspect-auto sm:h-full" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <div className="mt-2 flex justify-end">
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>
  );
}

export function ResultsView({ initial, initialKey, defaults }: { initial: HotelSearchResponse; initialKey: string; defaults: { checkIn: ISODate; checkOut: ISODate } }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  const query = useMemo(() => parseHotelQuery(new URLSearchParams(key), defaults), [key, defaults]);

  const [result, setResult] = useState<Result>({ key: initialKey, data: initial });
  const [retry, setRetry] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [mobileMap, setMobileMap] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const currency = useCurrency();

  const loading = result.key !== key;
  const data = "data" in result ? result.data : null;
  // Keep showing the last good results (dimmed) while the next page loads.
  const [lastData, setLastData] = useState(initial);
  if (data && data !== lastData) setLastData(data);
  const view = data ?? lastData;

  useEffect(() => {
    if (result.key === key && retry === 0) return;
    const ctrl = new AbortController();
    fetch(`/api/hotels/search?${key}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Search failed");
        return r.json() as Promise<HotelSearchResponse>;
      })
      .then((d) => setResult({ key, data: d }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setResult({ key, error: navigator.onLine ? e.message : "offline" });
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `result` is intentionally excluded; the key drives fetching
  }, [key, retry]);

  const update = useCallback(
    (patch: Partial<HotelSearchQuery>) => {
      const next = serializeHotelQuery({ ...query, ...patch });
      router.replace(`${pathname}?${next}`, { scroll: false });
    },
    [query, router, pathname],
  );

  const clearFilters = () => update({ priceMin: undefined, priceMax: undefined, stars: [], minRating: undefined, types: [], amenities: [], features: [], neighborhoods: [] });
  const filterCount = activeFilterCount(query);
  const stayQs = serializeHotelQuery({ checkIn: query.checkIn, checkOut: query.checkOut, adults: query.adults, children: query.children, rooms: query.rooms });

  const markers = useMemo(
    () => view.items.map((i) => ({ id: i.id, position: i.coordinates, label: formatMoney(i.price.perNight, currency), title: i.name, group: i.destinationName })),
    [view.items, currency],
  );

  const chips = [
    ...(query.priceMin !== undefined || query.priceMax !== undefined
      ? [{ id: "price", label: `${query.priceMin !== undefined ? formatMoney(query.priceMin, currency) : "Any"} – ${query.priceMax !== undefined ? formatMoney(query.priceMax, currency) : "Any"}`, clear: () => update({ priceMin: undefined, priceMax: undefined }) }]
      : []),
    ...query.stars.map((s) => ({ id: `s${s}`, label: `${s} stars`, clear: () => update({ stars: query.stars.filter((x) => x !== s) }) })),
    ...(query.minRating !== undefined ? [{ id: "rating", label: `Rating ${query.minRating}+`, clear: () => update({ minRating: undefined }) }] : []),
    ...query.features.map((f) => ({ id: f, label: FEATURE_FILTERS.find((x) => x.id === f)?.label ?? f, clear: () => update({ features: query.features.filter((x) => x !== f) }) })),
    ...query.types.map((t) => ({ id: t, label: PROPERTY_TYPE_LABEL[t], clear: () => update({ types: query.types.filter((x) => x !== t) }) })),
    ...query.neighborhoods.map((n) => ({ id: n, label: n, clear: () => update({ neighborhoods: query.neighborhoods.filter((x) => x !== n) }) })),
    ...query.amenities.map((a) => ({ id: a, label: AMENITIES[a]?.label ?? a, clear: () => update({ amenities: query.amenities.filter((x) => x !== a) }) })),
  ];

  const heading = view.destination ? `Hotels in ${view.destination.name}` : query.q ? `Hotels matching “${query.q}”` : "Hotels worldwide";
  const sortSelect = (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden whitespace-nowrap text-muted sm:inline">Sort by</span>
      <Select aria-label="Sort results" value={query.sort} onChange={(e) => update({ sort: e.target.value as HotelSort })} className="h-10 w-auto min-w-44 text-sm">
        {SORT_OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </Select>
    </label>
  );

  const selectedItem = view.items.find((i) => i.id === (selected ?? hovered)) ?? view.items[0];

  const list = (
    <div aria-busy={loading} className="relative">
      {"error" in result && !loading ? (
        <ErrorState
          offline={result.error === "offline"}
          title={result.error === "offline" ? "You're offline" : "We couldn't load hotels"}
          description={result.error === "offline" ? "Check your internet connection — we'll show results as soon as you're back." : "Our search service didn't respond. Your filters are saved — please try again."}
          action={<Button onClick={() => setRetry((r) => r + 1)}>Try again</Button>}
        />
      ) : loading && !lastData.items.length ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <ResultSkeleton key={i} />
          ))}
        </div>
      ) : view.items.length === 0 && !loading ? (
        <EmptyState
          icon={<SearchX className="size-6" aria-hidden />}
          title="No hotels match these filters"
          description="Try removing a filter or two, widening your price range, or searching a nearby destination."
          action={
            <>
              {filterCount > 0 && <Button onClick={clearFilters}>Clear all filters</Button>}
              <Button variant="secondary" onClick={() => router.push(`/hotels?${stayQs}`)}>
                Search all destinations
              </Button>
            </>
          }
        />
      ) : (
        <>
          {loading && (
            <div className="grid gap-4">
              {Array.from({ length: 3 }, (_, i) => (
                <ResultSkeleton key={i} />
              ))}
            </div>
          )}
          <ol className={cn("grid gap-4", loading && "hidden")} aria-label="Hotel results">
            {view.items.map((item, i) => (
              <li key={item.id} className="animate-rise-in" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
                <HotelResultCard item={item} href={`/hotels/${item.slug}?${stayQs}`} priority={i < 2} highlighted={item.id === (hovered ?? selected)} onHover={showMap ? setHovered : undefined} />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );

  return (
    <div className="pb-24 lg:pb-12">
      <SearchSummaryBar query={query} destinationName={view.destination?.name} onChange={update} />

      <div className="container-page pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-ink hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/hotels" className="hover:text-ink hover:underline">
                Hotels
              </Link>
            </li>
            {view.destination && (
              <>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-ink">
                  {view.destination.name}
                </li>
              </>
            )}
          </ol>
        </nav>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl text-ink sm:text-[2.75rem]">{heading}</h1>
            <p className="mt-1 text-[0.9375rem] text-muted" aria-live="polite">
              {loading ? "Updating results…" : `${plural(view.total, "property", "properties")} · ${formatDateShort(query.checkIn)} – ${formatDateShort(query.checkOut)} · ${guestsLabel(query.adults, query.children, query.rooms)}`}
            </p>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            {sortSelect}
            <Button variant="secondary" size="sm" className="h-10" onClick={() => setShowMap((m) => !m)} iconLeft={showMap ? <List className="size-4" aria-hidden /> : <MapIcon className="size-4" aria-hidden />} aria-pressed={showMap}>
              {showMap ? "Hide map" : "Show map"}
            </Button>
          </div>
        </div>
        <p className="mt-3 rounded-md bg-gold-tint px-3 py-2 text-[0.8125rem] text-gold-600">
          Prices include all taxes and mandatory fees for your stay. Fees collected by the property on arrival are shown separately.
        </p>
      </div>

      {/* Mobile sticky toolbar */}
      <div className="sticky top-16 z-30 mt-4 border-y border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="container-page flex h-14 items-center gap-2">
          <Button variant="secondary" size="sm" className="h-10 flex-1" onClick={() => setFiltersOpen(true)} iconLeft={<SlidersHorizontal className="size-4" aria-hidden />}>
            Filters{filterCount > 0 && <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-navy text-[0.6875rem] text-white">{filterCount}</span>}
          </Button>
          <label className="relative flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface text-sm font-medium text-ink focus-within:outline-2 focus-within:outline-gold">
            <ArrowUpDown className="size-4" aria-hidden />
            <span aria-hidden>Sort</span>
            <span className="sr-only">Sort results</span>
            {/* Native select overlaid for full keyboard and screen-reader support */}
            <select value={query.sort} onChange={(e) => update({ sort: e.target.value as HotelSort })} className="absolute inset-0 cursor-pointer appearance-none opacity-0">
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <Button variant="secondary" size="sm" className="h-10 flex-1" onClick={() => setMobileMap(true)} iconLeft={<MapIcon className="size-4" aria-hidden />}>
            Map
          </Button>
        </div>
      </div>

      <div className={cn("container-page mt-6 grid gap-8", showMap ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" : "lg:grid-cols-[17rem_minmax(0,1fr)]")}>
        {!showMap && (
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-lg border border-line bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-ink">Filter by</h2>
                {filterCount > 0 && (
                  <button type="button" onClick={clearFilters} className="text-sm font-medium text-navy hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              <FiltersPanel query={query} facets={view.facets} onChange={update} />
            </div>
          </aside>
        )}

        <section aria-label="Results">
          {chips.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-2" aria-label="Active filters">
              {chips.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={c.clear} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong bg-surface pl-3 pr-2 text-sm text-ink hover:border-ink/50" aria-label={`Remove filter ${c.label}`}>
                    {c.label}
                    <X className="size-3.5 text-muted" aria-hidden />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={clearFilters} className="inline-flex h-9 items-center px-2 text-sm font-medium text-navy hover:underline">
                  Clear all
                </button>
              </li>
            </ul>
          )}
          {list}
        </section>

        {showMap && (
          <aside className="hidden lg:block" aria-label="Map of results">
            <div className="sticky top-24 h-[calc(100dvh-7.5rem)]">
              <MapView
                label={`Map of ${plural(view.items.length, "hotel")}`}
                markers={markers}
                selectedId={selected}
                highlightedId={hovered}
                onHover={setHovered}
                onSelect={(id) => {
                  setSelected(id);
                  document.getElementById(`hotel-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="h-full"
              />
            </div>
          </aside>
        )}
      </div>

      {/* Mobile filter drawer */}
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        side="bottom"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={clearFilters} disabled={filterCount === 0}>
              Clear all
            </Button>
            <Button className="flex-[2]" onClick={() => setFiltersOpen(false)} loading={loading}>
              Show {plural(view.total, "hotel")}
            </Button>
          </div>
        }
      >
        <FiltersPanel query={query} facets={view.facets} onChange={update} />
      </Drawer>

      {/* Mobile dedicated map view */}
      {mobileMap && (
        <div role="dialog" aria-modal="true" aria-label="Map view" className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-surface lg:hidden">
          <div className="flex h-14 items-center gap-2 border-b border-line px-2">
            <Button variant="ghost" size="sm" className="h-10" onClick={() => setMobileMap(false)} iconLeft={<ArrowLeft className="size-4" aria-hidden />} autoFocus>
              Back to results
            </Button>
            <span className="ml-auto pr-2 text-sm text-muted">{plural(view.items.length, "hotel")}</span>
          </div>
          <MapView label="Hotels map" markers={markers} selectedId={selectedItem?.id} onSelect={setSelected} className="flex-1 rounded-none border-0" />
          {selectedItem && (
            <div className="pb-safe border-t border-line bg-surface p-3">
              <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto">
                {view.items.map((i) => (
                  <Link
                    key={i.id}
                    href={`/hotels/${i.slug}?${stayQs}`}
                    onFocus={() => setSelected(i.id)}
                    className={cn("flex w-[85%] shrink-0 snap-center gap-3 rounded-lg border p-2", i.id === selectedItem.id ? "border-gold ring-1 ring-gold" : "border-line")}
                    ref={(el) => {
                      if (el && i.id === selected) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
                    }}
                  >
                    <span className="relative size-24 shrink-0 overflow-hidden rounded-md bg-sand">
                      <Image src={i.images[0].src} alt="" fill sizes="96px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1 py-1">
                      <span className="block truncate font-semibold text-ink">{i.name}</span>
                      <span className="block truncate text-xs text-muted">{i.neighborhood}</span>
                      <RatingBadge rating={i.rating} size="sm" showLabel={false} className="mt-1" />
                      <span className="mt-1 block text-sm">
                        <span className="font-semibold text-ink">
                          <Money usd={i.price.perNight} />
                        </span>{" "}
                        <span className="text-muted">/ night</span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
