"use client";

import { useId, type ReactNode } from "react";
import { CalendarDays, Users } from "lucide-react";
import type { ISODate } from "@/lib/models";
import { cn } from "@/lib/cn";
import { diffDays, todayISO } from "@/lib/dates";
import { formatDateShort, guestsLabel, plural } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/ui/counter";
import { Popover } from "@/components/ui/popover";
import { Calendar } from "./calendar";

/** Trigger button styled like a labelled field (used in the hero search bar). */
export function FieldTrigger({
  label,
  value,
  placeholder,
  icon,
  className,
  ...props
}: { label: string; value?: string; placeholder: string; icon: ReactNode; className?: string } & React.ComponentProps<"button">) {
  return (
    <button type="button" className={cn("group flex h-full w-full min-w-0 items-center gap-3 rounded-md px-3.5 py-2 text-left transition-colors hover:bg-sand/70", className)} {...props}>
      <span className="text-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
        <span className={cn("block truncate text-[0.9375rem] font-medium", value ? "text-ink" : "text-subtle")}>{value || placeholder}</span>
      </span>
    </button>
  );
}

export function DateRangeField({
  start,
  end,
  onChange,
  labels = ["Check-in", "Check-out"],
  className,
  single,
  isDisabled,
  align = "start",
}: {
  start?: ISODate;
  end?: ISODate;
  onChange: (start?: ISODate, end?: ISODate) => void;
  labels?: [string, string] | [string];
  className?: string;
  single?: boolean;
  isDisabled?: (d: ISODate) => boolean;
  align?: "start" | "end" | "center";
}) {
  const id = useId();
  const nights = start && end ? diffDays(start, end) : 0;
  const value = single
    ? start && formatDateShort(start)
    : start && end
      ? `${formatDateShort(start)} – ${formatDateShort(end)}`
      : start
        ? `${formatDateShort(start)} – Add date`
        : undefined;

  return (
    <Popover
      id={`${id}-cal`}
      align={align}
      label={single ? "Choose a date" : "Choose dates"}
      className={className}
      panelClassName="w-[min(46rem,calc(100vw-2rem))] p-5"
      trigger={({ toggle, ref, ...aria }) => (
        <FieldTrigger
          ref={ref}
          onClick={toggle}
          {...aria}
          aria-haspopup="dialog"
          label={single ? labels[0] : `${labels[0]} – ${labels[1] ?? ""}`}
          value={value ?? undefined}
          placeholder={single ? "Add date" : "Add dates"}
          icon={<CalendarDays className="size-5" aria-hidden />}
        />
      )}
    >
      {(close) => (
        <div>
          <Calendar
            mode={single ? "single" : "range"}
            start={start}
            end={end}
            min={todayISO()}
            isDisabled={isDisabled}
            onChange={(s, e) => {
              onChange(s, e);
              if (single && s) close();
            }}
          />
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <p className="text-sm text-muted" aria-live="polite">
              {single ? (start ? formatDateShort(start) : "Select a date") : nights > 0 ? plural(nights, "night") : start ? "Select your check-out date" : "Select your check-in date"}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onChange(undefined, undefined)}>
                Clear
              </Button>
              <Button size="sm" onClick={close} disabled={!single && Boolean(start) && !end}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </Popover>
  );
}

export interface Party {
  adults: number;
  children: number;
  rooms: number;
}

export function GuestsField({
  value,
  onChange,
  withRooms = true,
  label = "Guests",
  className,
  align = "end",
  maxGuests = 16,
}: {
  value: Party;
  onChange: (p: Party) => void;
  withRooms?: boolean;
  label?: string;
  className?: string;
  align?: "start" | "end" | "center";
  maxGuests?: number;
}) {
  const id = useId();
  const total = value.adults + value.children;
  return (
    <Popover
      id={`${id}-guests`}
      align={align}
      label="Choose guests"
      className={className}
      panelClassName="w-[min(22rem,calc(100vw-2rem))]"
      trigger={({ toggle, ref, ...aria }) => (
        <FieldTrigger
          ref={ref}
          onClick={toggle}
          {...aria}
          aria-haspopup="dialog"
          label={label}
          value={guestsLabel(value.adults, value.children, withRooms ? value.rooms : undefined)}
          placeholder="Add guests"
          icon={<Users className="size-5" aria-hidden />}
        />
      )}
    >
      {(close) => (
        <div>
          <Counter label="Adults" description="Ages 13 or above" value={value.adults} min={1} max={Math.min(16, maxGuests - value.children)} onChange={(adults) => onChange({ ...value, adults, rooms: Math.min(value.rooms, adults) })} />
          <div className="h-px bg-line" />
          <Counter label="Children" description="Ages 0–12" value={value.children} min={0} max={Math.min(10, maxGuests - value.adults)} onChange={(children) => onChange({ ...value, children })} />
          {withRooms && (
            <>
              <div className="h-px bg-line" />
              <Counter label="Rooms" value={value.rooms} min={1} max={Math.min(8, value.adults)} onChange={(rooms) => onChange({ ...value, rooms })} />
            </>
          )}
          <p className="mt-2 text-[0.8125rem] text-muted">{total >= maxGuests ? `Maximum ${maxGuests} guests per booking.` : "Traveling with more? Contact our concierge."}</p>
          <Button className="mt-4 w-full" onClick={close}>
            Done
          </Button>
        </div>
      )}
    </Popover>
  );
}
