"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatMoney } from "./money";

/**
 * Dual-thumb price slider built from two native range inputs, so keyboard
 * and screen-reader support come from the platform. Commits after the user
 * pauses (debounced) to avoid a request per pixel.
 */
export function PriceRange({
  min,
  max,
  value,
  onCommit,
  step = 10,
}: {
  min: number;
  max: number;
  value: [number | undefined, number | undefined];
  onCommit: (v: [number | undefined, number | undefined]) => void;
  step?: number;
}) {
  const fmt = useFormatMoney();
  const [lo, setLo] = useState(value[0] ?? min);
  const [hi, setHi] = useState(value[1] ?? max);
  const timer = useRef<number | undefined>(undefined);
  const [prevValue, setPrevValue] = useState(value);

  // Sync from props when the URL changes (e.g. "Clear all")
  if (prevValue[0] !== value[0] || prevValue[1] !== value[1]) {
    setPrevValue(value);
    setLo(value[0] ?? min);
    setHi(value[1] ?? max);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const schedule = (nextLo: number, nextHi: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      onCommit([nextLo <= min ? undefined : nextLo, nextHi >= max ? undefined : nextHi]);
    }, 450);
  };

  const pct = (v: number) => ((v - min) / Math.max(1, max - min)) * 100;
  const thumb =
    "pointer-events-none absolute inset-x-0 top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-navy [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-navy [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-soft focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-gold/40";

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium text-ink" aria-hidden>
        <span>{fmt(lo)}</span>
        <span>{hi >= max ? `${fmt(max)}+` : fmt(hi)}</span>
      </div>
      <div className="relative mt-3 h-6">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-navy" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label="Minimum price per night"
          aria-valuetext={fmt(lo)}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), hi - step);
            setLo(v);
            schedule(v, hi);
          }}
          className={thumb}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label="Maximum price per night"
          aria-valuetext={hi >= max ? `${fmt(max)} or more` : fmt(hi)}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), lo + step);
            setHi(v);
            schedule(lo, v);
          }}
          className={thumb}
        />
      </div>
      <p className="mt-2 text-xs text-muted">Nightly price before taxes and fees</p>
    </div>
  );
}
