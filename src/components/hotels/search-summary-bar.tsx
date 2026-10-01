"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";
import type { ISODate } from "@/lib/models";
import { formatDateShort, guestsLabel } from "@/lib/format";
import type { HotelSearchQuery } from "@/lib/search/hotel-query";
import { pushSearchHistory } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { SearchCombobox } from "@/components/search/search-combobox";
import { DateRangeField, GuestsField } from "@/components/search/pickers";

/** Editable search summary shown above hotel results. */
export function SearchSummaryBar({ query, destinationName, onChange }: { query: HotelSearchQuery; destinationName?: string; onChange: (patch: Partial<HotelSearchQuery>) => void }) {
  const router = useRouter();
  const [text, setText] = useState(destinationName ?? query.q ?? "");
  const [slug, setSlug] = useState(query.destination);
  const [dates, setDates] = useState<{ start?: ISODate; end?: ISODate }>({ start: query.checkIn, end: query.checkOut });
  const [party, setParty] = useState({ adults: query.adults, children: query.children, rooms: query.rooms });
  const [expanded, setExpanded] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!dates.start || !dates.end) return;
    const patch: Partial<HotelSearchQuery> = {
      destination: slug,
      q: slug ? "" : text.trim(),
      checkIn: dates.start,
      checkOut: dates.end,
      ...party,
      // A new destination invalidates location-specific filters
      ...(slug !== query.destination ? { neighborhoods: [], priceMin: undefined, priceMax: undefined } : {}),
    };
    onChange(patch);
    setExpanded(false);
    pushSearchHistory({
      kind: "hotels",
      label: `Hotels in ${text.trim() || "anywhere"}`,
      detail: `${formatDateShort(dates.start)} – ${formatDateShort(dates.end)} · ${guestsLabel(party.adults, party.children, party.rooms)}`,
      href: `/hotels?${new URLSearchParams({ ...(slug ? { destination: slug } : text ? { q: text } : {}), checkIn: dates.start, checkOut: dates.end })}`,
    });
  };

  return (
    <div className="border-b border-line bg-surface">
      {/* Compact summary on phones; tap to edit */}
      <div className={expanded ? "hidden" : "container-page py-3 md:hidden"}>
        <button type="button" onClick={() => setExpanded(true)} aria-expanded={expanded} aria-controls="edit-search" className="flex w-full items-center gap-3 rounded-md border border-line-strong px-3.5 py-2.5 text-left">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] font-semibold text-ink">{text || "Anywhere"}</span>
            <span className="block truncate text-[0.8125rem] text-muted">
              {dates.start && dates.end ? `${formatDateShort(dates.start)} – ${formatDateShort(dates.end)}` : "Add dates"} · {guestsLabel(party.adults, party.children, party.rooms)}
            </span>
          </span>
          <ChevronDown className="size-4 text-muted" aria-hidden />
          <span className="sr-only">Edit search</span>
        </button>
      </div>
      <form id="edit-search" onSubmit={submit} role="search" aria-label="Edit hotel search" className={`container-page flex-col gap-1 py-3 md:flex md:flex-row md:items-stretch md:gap-0 ${expanded ? "flex" : "hidden"}`}>
        <div className="flex min-w-0 items-center gap-3 rounded-md px-3.5 py-1.5 hover:bg-sand/70 md:flex-[1.3]">
          <MapPin className="size-5 shrink-0 text-muted" aria-hidden />
          <SearchCombobox
            label="Destination"
            placeholder="Anywhere"
            value={text}
            icon={null}
            types={["destination", "hotel"]}
            onValueChange={(v) => {
              setText(v);
              setSlug("");
            }}
            onSelect={(entry) => {
              if (entry.type === "destination") {
                setText(entry.title);
                setSlug(entry.destinationSlug ?? "");
              } else router.push(entry.href);
            }}
            onSelectRecent={(r) => router.push(r.href)}
            className="min-w-0 flex-1"
            inputClassName="!h-6"
          />
        </div>
        <span className="mx-1 hidden w-px self-stretch bg-line md:block" aria-hidden />
        <DateRangeField className="md:flex-1" start={dates.start} end={dates.end} onChange={(start, end) => setDates({ start, end })} />
        <span className="mx-1 hidden w-px self-stretch bg-line md:block" aria-hidden />
        <GuestsField className="md:flex-1" value={party} onChange={setParty} label="Guests & rooms" />
        <Button type="submit" className="mt-1 md:ml-2 md:mt-0 md:h-auto" iconLeft={<Search className="size-4" aria-hidden />} disabled={!dates.start || !dates.end}>
          Update
        </Button>
      </form>
    </div>
  );
}
