"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ISODate } from "@/lib/models";
import { addDays, parseISODate, toISODate } from "@/lib/dates";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const dayLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function startOfMonth(d: ISODate): ISODate {
  return `${d.slice(0, 7)}-01`;
}
function addMonths(d: ISODate, n: number): ISODate {
  const x = parseISODate(startOfMonth(d));
  x.setUTCMonth(x.getUTCMonth() + n);
  return toISODate(x);
}
function monthGrid(month: ISODate): (ISODate | null)[] {
  const first = parseISODate(month);
  const offset = (first.getUTCDay() + 6) % 7; // Monday-first
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cells: (ISODate | null)[] = Array.from({ length: offset }, () => null);
  for (let i = 0; i < days; i++) cells.push(addDays(month, i));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export interface CalendarProps {
  mode: "range" | "single";
  start?: ISODate;
  end?: ISODate;
  onChange: (start: ISODate | undefined, end: ISODate | undefined) => void;
  min: ISODate;
  max?: ISODate;
  isDisabled?: (d: ISODate) => boolean;
  months?: 1 | 2;
  /** Optional per-day annotation, e.g. a price */
  annotate?: (d: ISODate) => string | undefined;
  maxNights?: number;
}

export function Calendar({ mode, start, end, onChange, min, max, isDisabled, months = 2, annotate, maxNights = 30 }: CalendarProps) {
  const [view, setView] = useState<ISODate>(startOfMonth(start ?? min));
  const [focusDate, setFocusDate] = useState<ISODate>(start ?? min);
  const [hover, setHover] = useState<ISODate | undefined>();
  const gridRef = useRef<HTMLDivElement>(null);
  const keyboardNav = useRef(false);

  useEffect(() => {
    if (!keyboardNav.current) return;
    keyboardNav.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)?.focus();
  }, [focusDate, view]);

  const monthsToShow = useMemo(() => Array.from({ length: months }, (_, i) => addMonths(view, i)), [view, months]);
  const lastVisible = addMonths(view, months - 1);

  const disabled = (d: ISODate): boolean =>
    d < min || (max !== undefined && d > max) || Boolean(isDisabled?.(d)) || Boolean(mode === "range" && start && !end && d > addDays(start, maxNights));

  const select = (d: ISODate) => {
    if (disabled(d)) return;
    if (mode === "single") return onChange(d, undefined);
    if (!start || (start && end) || d <= start) return onChange(d, undefined);
    onChange(start, d);
  };

  const move = (d: ISODate) => {
    keyboardNav.current = true;
    if (d < view) setView(startOfMonth(d));
    else if (d >= addMonths(lastVisible, 1)) setView(addMonths(startOfMonth(d), -(months - 1)));
    setFocusDate(d);
  };

  const onKey = (e: KeyboardEvent, d: ISODate) => {
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
    if (map[e.key] !== undefined) {
      e.preventDefault();
      move(addDays(d, map[e.key]));
    } else if (e.key === "PageDown") {
      e.preventDefault();
      move(toISODate(new Date(Date.UTC(+addMonths(d, 1).slice(0, 4), +addMonths(d, 1).slice(5, 7) - 1, Math.min(+d.slice(8), 28)))));
    } else if (e.key === "PageUp") {
      e.preventDefault();
      move(toISODate(new Date(Date.UTC(+addMonths(d, -1).slice(0, 4), +addMonths(d, -1).slice(5, 7) - 1, Math.min(+d.slice(8), 28)))));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(d);
    }
  };

  const rangeEnd = end ?? (mode === "range" && start && hover && hover > start ? hover : undefined);
  const canPrev = view > startOfMonth(min);

  return (
    <div ref={gridRef} className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView(addMonths(view, -1))}
          disabled={!canPrev}
          className="inline-flex size-10 items-center justify-center rounded-md text-ink hover:bg-sand disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <div className="flex flex-1 justify-around" aria-live="polite">
          {monthsToShow.map((m) => (
            <span key={m} className="text-[0.9375rem] font-semibold text-ink">
              {monthLabel.format(parseISODate(m))}
            </span>
          ))}
        </div>
        <button type="button" onClick={() => setView(addMonths(view, 1))} className="inline-flex size-10 items-center justify-center rounded-md text-ink hover:bg-sand" aria-label="Next month">
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
      <div className={cn("grid gap-6", months === 2 && "md:grid-cols-2")}>
        {monthsToShow.map((m, mi) => (
          <div key={m} role="grid" aria-label={monthLabel.format(parseISODate(m))} className={cn(mi > 0 && "hidden md:block")}>
            <div role="row" className="grid grid-cols-7">
              {WEEKDAYS.map((w) => (
                <span key={w} role="columnheader" className="pb-1 text-center text-xs font-medium text-muted">
                  {w}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1" role="rowgroup">
              {monthGrid(m).map((d, i) => {
                if (!d) return <span key={`e${i}`} role="gridcell" />;
                const isStart = d === start;
                const isEnd = d === end;
                const inRange = start && rangeEnd && d > start && d < rangeEnd;
                const isDis = disabled(d);
                const note = annotate?.(d);
                return (
                  <span key={d} role="gridcell" className={cn("relative", inRange && "bg-navy-tint", isStart && rangeEnd && "rounded-l-md bg-navy-tint", (isEnd || d === rangeEnd) && start && "rounded-r-md bg-navy-tint")}>
                    <button
                      type="button"
                      data-date={d}
                      tabIndex={d === focusDate ? 0 : -1}
                      disabled={isDis}
                      aria-label={`${dayLabel.format(parseISODate(d))}${isStart ? ", selected as start" : ""}${isEnd ? ", selected as end" : ""}${isDis ? ", unavailable" : ""}`}
                      aria-pressed={isStart || isEnd}
                      onClick={() => {
                        setFocusDate(d);
                        select(d);
                      }}
                      onKeyDown={(e) => onKey(e, d)}
                      onMouseEnter={() => setHover(d)}
                      className={cn(
                        "relative mx-auto flex h-11 w-full max-w-11 flex-col items-center justify-center rounded-md text-sm tabular-nums transition-colors",
                        isDis ? "cursor-not-allowed text-line-strong line-through decoration-line-strong/70" : "text-ink hover:bg-sand",
                        (isStart || isEnd) && "bg-navy font-semibold text-white hover:bg-navy",
                      )}
                    >
                      {Number(d.slice(8))}
                      {note && !isDis && <span className={cn("text-[0.625rem] leading-none", isStart || isEnd ? "text-white/80" : "text-muted")}>{note}</span>}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
