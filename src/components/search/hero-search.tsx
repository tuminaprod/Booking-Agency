"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BedDouble, Compass, MapPin, Search, Sparkles, Tag, Users } from "lucide-react";
import type { ISODate } from "@/lib/models";
import { cn } from "@/lib/cn";
import { defaultStay } from "@/lib/dates";
import { EXPERIENCE_CATEGORIES, TRIP_CATEGORY_LABEL } from "@/lib/data/catalog";
import { formatDateShort, guestsLabel } from "@/lib/format";
import { serializeHotelQuery } from "@/lib/search/hotel-query";
import type { SuggestEntry } from "@/lib/search/suggest";
import { pushSearchHistory } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { Tabs, tabPanelProps } from "@/components/ui/tabs";
import { Counter } from "@/components/ui/counter";
import { Popover } from "@/components/ui/popover";
import { SearchCombobox } from "./search-combobox";
import { DateRangeField, FieldTrigger, GuestsField, type Party } from "./pickers";

type Mode = "hotels" | "trips" | "experiences";

const TAB_ITEMS = [
  { id: "hotels" as const, label: "Hotels", icon: <BedDouble className="size-4" aria-hidden /> },
  { id: "trips" as const, label: "Trips", icon: <Compass className="size-4" aria-hidden /> },
  { id: "experiences" as const, label: "Experiences", icon: <Sparkles className="size-4" aria-hidden /> },
];

interface Place {
  text: string;
  slug?: string;
}

function DestinationField({ place, onChange, types, label = "Destination" }: { place: Place; onChange: (p: Place) => void; types: SuggestEntry["type"][]; label?: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 rounded-md px-3.5 py-2 transition-colors focus-within:bg-sand/50 hover:bg-sand/70">
      <MapPin className="size-5 shrink-0 text-muted" aria-hidden />
      <SearchCombobox
      label={label}
      placeholder="Where are you going?"
      value={place.text}
      types={types}
      onValueChange={(text) => onChange({ text })}
      onSelect={(entry) => {
        if (entry.type === "destination") onChange({ text: entry.title, slug: entry.destinationSlug });
        else router.push(entry.href);
      }}
      onSelectRecent={(r) => router.push(r.href)}
      icon={null}
      className="min-w-0 flex-1"
      inputClassName="!h-6"
    />
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: T | "";
  onChange: (v: T | "") => void;
  options: { id: T; label: string }[];
  placeholder: string;
}) {
  return (
    <Popover
      id={`sel-${label}`}
      align="end"
      label={label}
      panelClassName="w-[min(20rem,calc(100vw-2rem))] p-2"
      trigger={({ toggle, ref, ...aria }) => (
        <FieldTrigger ref={ref} onClick={toggle} {...aria} aria-haspopup="listbox" label={label} value={options.find((o) => o.id === value)?.label} placeholder={placeholder} icon={<Tag className="size-5" aria-hidden />} />
      )}
    >
      {(close) => (
        <ul role="listbox" aria-label={label} className="max-h-80 overflow-y-auto">
          {[{ id: "" as T | "", label: placeholder }, ...options].map((o) => (
            <li key={o.id || "any"}>
              <button
                type="button"
                role="option"
                aria-selected={o.id === value}
                onClick={() => {
                  onChange(o.id);
                  close();
                }}
                className={cn("flex w-full items-center rounded-md px-3 py-2.5 text-left text-[0.9375rem] hover:bg-sand", o.id === value && "bg-sand font-semibold")}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}

const divider = "hidden lg:block w-px self-stretch my-3 bg-line";

export function HeroSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("hotels");
  const [place, setPlace] = useState<Place>({ text: "" });
  const [dates, setDates] = useState<{ start?: ISODate; end?: ISODate }>({});
  const [party, setParty] = useState<Party>({ adults: 2, children: 0, rooms: 1 });
  const [tripType, setTripType] = useState<string>("");
  const [expCategory, setExpCategory] = useState<string>("");
  const [people, setPeople] = useState(2);
  const [expDate, setExpDate] = useState<ISODate | undefined>();

  const destParam: Record<string, string> = place.slug ? { destination: place.slug } : place.text.trim() ? { q: place.text.trim() } : {};

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const label = place.text.trim() || "Anywhere";
    if (mode === "hotels") {
      const fallback = defaultStay();
      const checkIn = dates.start ?? fallback.checkIn;
      const checkOut = dates.end ?? fallback.checkOut;
      const href = `/hotels?${serializeHotelQuery({ ...destParam, checkIn, checkOut, adults: party.adults, children: party.children, rooms: party.rooms })}`;
      pushSearchHistory({ kind: "hotels", label: `Hotels in ${label}`, detail: `${formatDateShort(checkIn)} – ${formatDateShort(checkOut)} · ${guestsLabel(party.adults, party.children, party.rooms)}`, href });
      router.push(href);
    } else if (mode === "trips") {
      const sp = new URLSearchParams({ ...destParam });
      if (dates.start) sp.set("from", dates.start);
      if (dates.end) sp.set("to", dates.end);
      if (tripType) sp.set("category", tripType);
      sp.set("travelers", String(people));
      const href = `/trips?${sp}`;
      pushSearchHistory({ kind: "trips", label: `Trips · ${label}`, detail: [tripType && TRIP_CATEGORY_LABEL[tripType as keyof typeof TRIP_CATEGORY_LABEL], `${people} travelers`].filter(Boolean).join(" · "), href });
      router.push(href);
    } else {
      const sp = new URLSearchParams({ ...destParam });
      if (expDate) sp.set("date", expDate);
      if (expCategory) sp.set("category", expCategory);
      sp.set("people", String(people));
      const href = `/experiences?${sp}`;
      pushSearchHistory({ kind: "experiences", label: `Experiences · ${label}`, detail: `${people} people${expDate ? ` · ${formatDateShort(expDate)}` : ""}`, href });
      router.push(href);
    }
  };

  const peopleField = (label: string) => (
    <Popover
      id={`people-${mode}`}
      align="end"
      label={label}
      panelClassName="w-[min(20rem,calc(100vw-2rem))]"
      trigger={({ toggle, ref, ...aria }) => (
        <FieldTrigger ref={ref} onClick={toggle} {...aria} aria-haspopup="dialog" label={label} value={`${people} ${people === 1 ? "person" : "people"}`} placeholder="Add people" icon={<Users className="size-5" aria-hidden />} />
      )}
    >
      {(close) => (
        <div>
          <Counter label={label} value={people} min={1} max={16} onChange={setPeople} />
          <Button className="mt-3 w-full" onClick={close}>
            Done
          </Button>
        </div>
      )}
    </Popover>
  );

  return (
    <div className="w-full">
      <Tabs items={TAB_ITEMS} value={mode} onChange={setMode} label="What would you like to search for?" variant="hero" idBase="hero-search" />
      <form onSubmit={submit} {...tabPanelProps("hero-search", mode)} className="rounded-b-xl rounded-tr-xl bg-surface p-2 shadow-overlay focus:outline-none" role="search" aria-label={`Search ${mode}`}>
        <div className="flex flex-col gap-1 lg:flex-row lg:items-stretch">
          <div className="min-w-0 lg:flex-[1.4]">
            <DestinationField place={place} onChange={setPlace} types={mode === "hotels" ? ["destination", "hotel"] : mode === "trips" ? ["destination", "trip"] : ["destination", "experience"]} />
          </div>
          <span className={divider} aria-hidden />
          {mode === "hotels" && (
            <>
              <DateRangeField className="lg:flex-1" start={dates.start} end={dates.end} onChange={(start, end) => setDates({ start, end })} />
              <span className={divider} aria-hidden />
              <GuestsField className="lg:flex-1" value={party} onChange={setParty} label="Guests & rooms" />
            </>
          )}
          {mode === "trips" && (
            <>
              <DateRangeField className="lg:flex-1" start={dates.start} end={dates.end} onChange={(start, end) => setDates({ start, end })} labels={["Travel dates", ""]} />
              <span className={divider} aria-hidden />
              <div className="lg:flex-[0.8]">{peopleField("Travelers")}</div>
              <span className={divider} aria-hidden />
              <div className="lg:flex-1">
                <SelectField
                  label="Trip type"
                  value={tripType}
                  onChange={setTripType}
                  placeholder="Any trip type"
                  options={Object.entries(TRIP_CATEGORY_LABEL).map(([id, label]) => ({ id, label }))}
                />
              </div>
            </>
          )}
          {mode === "experiences" && (
            <>
              <DateRangeField className="lg:flex-1" single start={expDate} onChange={(s) => setExpDate(s)} labels={["Date"]} />
              <span className={divider} aria-hidden />
              <div className="lg:flex-[0.8]">{peopleField("People")}</div>
              <span className={divider} aria-hidden />
              <div className="lg:flex-1">
                <SelectField label="Category" value={expCategory} onChange={setExpCategory} placeholder="All categories" options={EXPERIENCE_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} />
              </div>
            </>
          )}
          <Button type="submit" size="lg" className="mt-1 h-14 lg:ml-1 lg:mt-0 lg:h-auto lg:px-8" iconLeft={<Search className="size-5" aria-hidden />}>
            Search
          </Button>
        </div>
      </form>
    </div>
  );
}
