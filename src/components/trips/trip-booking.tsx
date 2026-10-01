"use client";

import { useMemo, useState } from "react";
import type { Trip } from "@/lib/models";
import { cn } from "@/lib/cn";
import { addDays, todayISO } from "@/lib/dates";
import { formatDateRange, plural } from "@/lib/format";
import { quoteTrip } from "@/lib/booking/pricing";
import { ButtonLink } from "@/components/ui/button";
import { Counter } from "@/components/ui/counter";
import { Select } from "@/components/ui/field";
import { Money } from "@/components/ui/money";
import { PriceBreakdown } from "@/components/booking/price-breakdown";

export function TripBookingCard({ trip }: { trip: Trip }) {
  const today = todayISO();
  const upcoming = useMemo(() => trip.departures.filter((d) => d.startDate > today), [trip, today]);
  const [depId, setDepId] = useState(upcoming.find((d) => d.seatsLeft >= 2)?.id ?? upcoming[0]?.id);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const dep = upcoming.find((d) => d.id === depId);
  const fits = dep ? dep.seatsLeft >= adults + children : false;
  const price = dep ? quoteTrip({ trip, departure: dep, adults, children }) : null;

  if (!upcoming.length) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
        <p className="font-semibold text-ink">No upcoming departures</p>
        <p className="mt-1 text-sm text-muted">New dates are released regularly. Save this trip to be notified.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
      <p className="text-sm text-muted">From</p>
      <p className="text-3xl font-semibold tabular-nums text-ink">
        <Money usd={dep?.price ?? trip.priceFrom} />
        <span className="text-base font-normal text-muted"> / person</span>
      </p>
      <label className="mt-5 block text-sm font-medium text-ink" htmlFor="trip-dep">
        Departure
      </label>
      <Select id="trip-dep" className="mt-1.5" value={depId} onChange={(e) => setDepId(e.target.value)}>
        {upcoming.map((d) => (
          <option key={d.id} value={d.id} disabled={d.seatsLeft === 0}>
            {formatDateRange(d.startDate, addDays(d.startDate, trip.durationDays - 1))} {d.seatsLeft === 0 ? "— sold out" : d.seatsLeft <= 3 ? `— ${d.seatsLeft} left` : ""}
          </option>
        ))}
      </Select>
      <div className="mt-3">
        <Counter label="Adults" value={adults} min={1} max={trip.groupSize.max - children} onChange={setAdults} />
        <Counter label="Children" description="Under 12" value={children} min={0} max={trip.groupSize.max - adults} onChange={setChildren} />
      </div>
      {dep && !fits && <p className="mt-2 text-sm font-medium text-warning">Only {plural(dep.seatsLeft, "place")} left on this departure.</p>}
      {price && fits && (
        <details className="group mt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-navy [&::-webkit-details-marker]:hidden">
            <span>
              Total <Money usd={price.total} />
            </span>
            <span className="text-xs font-medium text-muted group-open:hidden">Show breakdown</span>
          </summary>
          <PriceBreakdown price={price} compact className="mt-3" />
        </details>
      )}
      <ButtonLink
        href={`/book/trip/${trip.slug}?departure=${depId}&adults=${adults}&children=${children}`}
        size="lg"
        className={cn("mt-5 w-full", (!fits || !dep) && "pointer-events-none opacity-50")}
        aria-disabled={!fits || !dep}
      >
        Book this trip
      </ButtonLink>
      <p className="mt-3 text-center text-xs text-muted">{trip.cancellation.summary}</p>
    </div>
  );
}
