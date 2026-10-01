"use client";

import { useState } from "react";
import type { Experience, ISODate } from "@/lib/models";
import { cn } from "@/lib/cn";
import { addDays, todayISO } from "@/lib/dates";
import { formatDateLong } from "@/lib/format";
import { experienceRunsOn, experienceSpots } from "@/lib/booking/availability";
import { quoteExperience } from "@/lib/booking/pricing";
import { Calendar } from "@/components/search/calendar";
import { ButtonLink } from "@/components/ui/button";
import { Counter } from "@/components/ui/counter";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/feedback";
import { useHydrated } from "@/lib/stores/create-store";

export function ExperienceBookingCard({ experience }: { experience: Experience }) {
  const hydrated = useHydrated();
  const [date, setDate] = useState<ISODate | undefined>();
  const [slot, setSlot] = useState<string | undefined>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const people = adults + children;
  const price = quoteExperience({ experience, adults, children });
  const ready = date && slot && experienceSpots(experience, date, slot) >= people;

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <p className="text-sm text-muted">From</p>
      <p className="text-3xl font-semibold tabular-nums text-ink">
        <Money usd={experience.priceFrom} />
        <span className="text-base font-normal text-muted"> / person</span>
      </p>
      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-2 text-sm font-medium text-ink">Choose a date</p>
        {hydrated ? (
        <Calendar
          mode="single"
          months={1}
          start={date}
          min={addDays(todayISO(), 1)}
          max={addDays(todayISO(), 180)}
          isDisabled={(d) => !experienceRunsOn(experience, d)}
          onChange={(d) => {
            setDate(d);
            setSlot(undefined);
          }}
        />
        ) : (
          <Skeleton className="h-80" />
        )}
      </div>
      {date && (
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium text-ink">Times on {formatDateLong(date)}</legend>
          <div className="grid grid-cols-2 gap-2">
            {experience.timeSlots.map((s) => {
              const spots = experienceSpots(experience, date, s);
              const full = spots < people;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={slot === s}
                  disabled={full}
                  onClick={() => setSlot(s)}
                  className={cn("rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45", slot === s ? "border-navy bg-navy text-white" : "border-line-strong hover:border-ink/50")}
                >
                  <span className="block font-semibold">{s}</span>
                  <span className="text-xs opacity-80">{spots === 0 ? "Fully booked" : `${spots} left`}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <div className="mt-3">
        <Counter label="Adults" value={adults} min={1} max={experience.groupSize.max - children} onChange={setAdults} />
        <Counter label="Children" description="Ages 4–12" value={children} min={0} max={experience.groupSize.max - adults} onChange={setChildren} />
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-sm text-muted">Total incl. taxes & fees</span>
        <span className="text-lg font-semibold tabular-nums text-ink">
          <Money usd={price.total} />
        </span>
      </div>
      <ButtonLink
        href={ready ? `/book/experience/${experience.slug}?date=${date}&slot=${encodeURIComponent(slot!)}&adults=${adults}&children=${children}` : "#"}
        size="lg"
        className={cn("mt-4 w-full", !ready && "pointer-events-none opacity-50")}
        aria-disabled={!ready}
      >
        {ready ? "Book now" : date ? "Choose a time" : "Choose a date"}
      </ButtonLink>
      <p className="mt-3 text-center text-xs text-muted">{experience.cancellation.summary}</p>
    </div>
  );
}
