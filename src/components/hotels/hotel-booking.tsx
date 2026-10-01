"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { BedDouble, Check, Coffee, Maximize2, ShieldCheck, Users, Eye, AlertCircle } from "lucide-react";
import type { Hotel, HotelRoom, ISODate, Price } from "@/lib/models";
import { cn } from "@/lib/cn";
import { addDays, diffDays, isValidISODate, todayISO } from "@/lib/dates";
import { formatDateShort, guestsLabel, plural } from "@/lib/format";
import { quoteHotel } from "@/lib/booking/pricing";
import { roomFitsParty, type StayAvailability } from "@/lib/booking/availability";
import { PriceBreakdown } from "@/components/booking/price-breakdown";
import { Button, ButtonLink } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Badge } from "@/components/ui/badge";
import { DateRangeField, GuestsField } from "@/components/search/pickers";

interface Stay {
  checkIn: ISODate;
  checkOut: ISODate;
  adults: number;
  children: number;
  rooms: number;
  roomId?: string;
}

interface RoomQuote {
  room: HotelRoom;
  fits: boolean;
  price: Price;
  availability: StayAvailability;
}

interface Ctx {
  hotel: Hotel;
  stay: Stay;
  nights: number;
  quotes: RoomQuote[];
  selected?: RoomQuote;
  cheapest?: RoomQuote;
  setStay: (patch: Partial<Stay>) => void;
  bookHref?: string;
}

const HotelBookingContext = createContext<Ctx | null>(null);
const useHotelBooking = () => {
  const c = useContext(HotelBookingContext);
  if (!c) throw new Error("HotelBookingProvider missing");
  return c;
};

function num(v: string | null, fallback: number, min: number, max: number) {
  const n = Number(v);
  return v && Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

export function HotelBookingProvider({ hotel, defaults, children }: { hotel: Hotel; defaults: { checkIn: ISODate; checkOut: ISODate }; children: ReactNode }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const stay = useMemo<Stay>(() => {
    let checkIn = sp.get("checkIn") ?? "";
    let checkOut = sp.get("checkOut") ?? "";
    if (!isValidISODate(checkIn)) checkIn = defaults.checkIn;
    if (!isValidISODate(checkOut) || checkOut <= checkIn) checkOut = addDays(checkIn, 3);
    return {
      checkIn,
      checkOut,
      adults: num(sp.get("adults"), 2, 1, 16),
      children: num(sp.get("children"), 0, 0, 10),
      rooms: num(sp.get("rooms"), 1, 1, 8),
      roomId: sp.get("room") ?? undefined,
    };
  }, [sp, defaults]);

  const setStay = useCallback(
    (patch: Partial<Stay>) => {
      const next = { ...stay, ...patch };
      const q = new URLSearchParams({ checkIn: next.checkIn, checkOut: next.checkOut, adults: String(next.adults), children: String(next.children), rooms: String(next.rooms) });
      if (next.roomId) q.set("room", next.roomId);
      router.replace(`${pathname}?${q}`, { scroll: false });
    },
    [stay, router, pathname],
  );

  const quotes = useMemo<RoomQuote[]>(() => {
    const today = todayISO();
    return hotel.rooms.map((room) => {
      const { price, availability } = quoteHotel({ hotel, room, checkIn: stay.checkIn, checkOut: stay.checkOut, rooms: stay.rooms, adults: stay.adults, children: stay.children, today });
      return { room, price, availability, fits: roomFitsParty(room, stay.adults, stay.children, stay.rooms) };
    });
  }, [hotel, stay]);

  const bookable = quotes.filter((q) => q.fits && q.availability.available >= stay.rooms);
  const cheapest = [...bookable].sort((a, b) => a.price.total - b.price.total)[0];
  const selected = quotes.find((q) => q.room.id === stay.roomId && q.fits && q.availability.available >= stay.rooms);
  const bookHref = selected
    ? `/book/hotel/${hotel.slug}?${new URLSearchParams({ room: selected.room.id, checkIn: stay.checkIn, checkOut: stay.checkOut, adults: String(stay.adults), children: String(stay.children), rooms: String(stay.rooms) })}`
    : undefined;

  const value: Ctx = { hotel, stay, nights: diffDays(stay.checkIn, stay.checkOut), quotes, selected, cheapest, setStay, bookHref };
  return <HotelBookingContext.Provider value={value}>{children}</HotelBookingContext.Provider>;
}

const BED: Record<string, string> = { king: "King bed", queen: "Queen bed", twin: "Single bed", double: "Double bed", futon: "Futon", "sofa-bed": "Sofa bed" };

export function RoomList() {
  const { quotes, stay, setStay, nights } = useHotelBooking();
  const sorted = [...quotes].sort((a, b) => Number(b.fits) - Number(a.fits) || a.price.total - b.price.total);
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-line bg-surface p-3">
        <DateRangeField start={stay.checkIn} end={stay.checkOut} onChange={(s, e) => s && e && setStay({ checkIn: s, checkOut: e })} className="min-w-56 flex-1" />
        <span className="hidden h-8 w-px bg-line sm:block" aria-hidden />
        <GuestsField value={stay} onChange={(p) => setStay(p)} className="min-w-56 flex-1" label="Guests & rooms" align="end" />
      </div>
      <p className="mb-4 text-sm text-muted" aria-live="polite">
        Showing prices for {plural(nights, "night")}, {guestsLabel(stay.adults, stay.children, stay.rooms)}, including taxes and fees.
      </p>
      <ul className="grid gap-4">
        {sorted.map(({ room, price, availability, fits }) => {
          const available = fits && availability.available >= stay.rooms;
          const isSelected = stay.roomId === room.id;
          return (
            <li key={room.id}>
              <article className={cn("grid overflow-hidden rounded-lg border bg-surface transition-shadow md:grid-cols-[15rem_1fr]", isSelected ? "border-gold ring-1 ring-gold" : "border-line", !available && "opacity-75")} aria-label={room.name}>
                <div className="relative aspect-[16/10] bg-sand md:aspect-auto">
                  <Image src={room.images[0].src} alt={room.images[0].alt} fill sizes="(min-width: 768px) 15rem, 100vw" className="object-cover" />
                  {room.images.length > 1 && <span className="absolute bottom-2 left-2 rounded-xs bg-ink/70 px-1.5 py-0.5 text-xs text-white">{plural(room.images.length, "photo")}</span>}
                </div>
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:gap-6">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-ink">{room.name}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{room.description}</p>
                    <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[0.8125rem] text-ink-soft">
                      <li className="flex items-center gap-1.5">
                        <BedDouble className="size-4 text-muted" aria-hidden />
                        {room.beds.map((b) => `${b.count} ${BED[b.type].toLowerCase()}${b.count > 1 ? "s" : ""}`).join(" + ")}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Users className="size-4 text-muted" aria-hidden />
                        Sleeps {room.maxAdults + room.maxChildren}
                        {room.maxChildren > 0 && ` (${room.maxAdults} adults)`}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Maximize2 className="size-4 text-muted" aria-hidden />
                        {room.sizeSqm} m²
                      </li>
                      {room.view && (
                        <li className="flex items-center gap-1.5">
                          <Eye className="size-4 text-muted" aria-hidden />
                          {room.view}
                        </li>
                      )}
                    </ul>
                    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Room amenities">
                      {room.amenities.slice(0, 5).map((a) => (
                        <li key={a} className="rounded-xs bg-sand px-2 py-0.5 text-xs text-ink-soft">
                          {a}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 space-y-1 text-[0.8125rem]">
                      <p className={cn("flex items-center gap-1.5 font-medium", room.breakfastIncluded ? "text-success" : "text-muted")}>
                        <Coffee className="size-4" aria-hidden />
                        {room.breakfastIncluded ? "Breakfast included" : "Breakfast available as an extra"}
                      </p>
                      <p className={cn("flex items-center gap-1.5 font-medium", room.cancellation.type === "free" ? "text-success" : room.cancellation.type === "partial" ? "text-ink-soft" : "text-warning")}>
                        <ShieldCheck className="size-4" aria-hidden />
                        {room.cancellation.summary}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col justify-between gap-3 border-t border-line pt-4 lg:w-52 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 lg:text-right">
                    {available ? (
                      <>
                        <div>
                          {availability.available <= 2 && <Badge tone="warning">Only {availability.available} left</Badge>}
                          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
                            <Money usd={price.perNight ?? 0} />
                            <span className="text-sm font-normal text-muted"> / night</span>
                          </p>
                          <p className="text-sm font-medium text-ink">
                            <Money usd={price.total} /> total
                          </p>
                          <p className="text-[0.8125rem] text-muted">
                            incl. <Money usd={price.taxes} /> taxes, <Money usd={price.fees} /> fees
                          </p>
                        </div>
                        <Button variant={isSelected ? "accent" : "primary"} onClick={() => setStay({ roomId: isSelected ? undefined : room.id })} aria-pressed={isSelected} iconLeft={isSelected ? <Check className="size-4" aria-hidden /> : undefined}>
                          {isSelected ? "Selected" : "Select room"}
                        </Button>
                      </>
                    ) : (
                      <p className="flex items-start gap-1.5 text-sm text-muted lg:justify-end">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {!fits ? "Doesn't fit your party — add a room or choose a larger room type." : "Sold out for some of your dates. Try different dates."}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BookingSidebar() {
  const { selected, cheapest, stay, nights, bookHref, hotel } = useHotelBooking();
  const shown = selected ?? cheapest;
  return (
    <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
      {shown ? (
        <>
          <p className="text-sm text-muted">{selected ? "Your selection" : "Rooms from"}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">
            <Money usd={shown.price.perNight ?? 0} />
            <span className="text-base font-normal text-muted"> / night</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {formatDateShort(stay.checkIn)} – {formatDateShort(stay.checkOut)} · {plural(nights, "night")} · {guestsLabel(stay.adults, stay.children, stay.rooms)}
          </p>
          {selected && <p className="mt-3 rounded-md bg-sand px-3 py-2 text-sm font-medium text-ink">{selected.room.name}</p>}
          <details className="group mt-4" open={Boolean(selected)}>
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-navy [&::-webkit-details-marker]:hidden">
              Price breakdown
              <span className="text-muted transition-transform group-open:rotate-180" aria-hidden>
                ▾
              </span>
            </summary>
            <PriceBreakdown price={shown.price} compact className="mt-4" />
          </details>
          {bookHref ? (
            <ButtonLink href={bookHref} size="lg" className="mt-5 w-full">
              Reserve
            </ButtonLink>
          ) : (
            <ButtonLink href="#rooms" size="lg" className="mt-5 w-full">
              Choose a room
            </ButtonLink>
          )}
          <p className="mt-3 text-center text-xs text-muted">You won&apos;t be charged until you confirm on the payment step.</p>
        </>
      ) : (
        <div>
          <p className="font-semibold text-ink">No rooms available</p>
          <p className="mt-1 text-sm text-muted">{hotel.name} is fully booked for your dates or party size. Try adjusting your dates or guests.</p>
          <ButtonLink href="#rooms" variant="secondary" className="mt-4 w-full">
            Change dates
          </ButtonLink>
        </div>
      )}
    </div>
  );
}

export function MobileBookingBar() {
  const { selected, cheapest, bookHref, nights } = useHotelBooking();
  const shown = selected ?? cheapest;
  return (
    <div data-no-print className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <div className="min-w-0">
          {shown ? (
            <>
              <p className="text-lg font-semibold tabular-nums text-ink">
                <Money usd={shown.price.total} />
                <span className="text-sm font-normal text-muted"> total</span>
              </p>
              <p className="truncate text-xs text-muted">{selected ? selected.room.name : `${plural(nights, "night")} · incl. taxes & fees`}</p>
            </>
          ) : (
            <p className="text-sm text-muted">No availability</p>
          )}
        </div>
        {bookHref ? (
          <ButtonLink href={bookHref} className="shrink-0 px-6">
            Reserve
          </ButtonLink>
        ) : (
          <ButtonLink href="#rooms" className="shrink-0 px-6">
            Select room
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
