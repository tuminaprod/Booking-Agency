"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";

export function Counter({
  label,
  description,
  value,
  min = 0,
  max = 10,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const btn =
    "inline-flex size-10 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line-strong";
  return (
    <div className="flex items-center justify-between gap-4 py-2.5" role="group" aria-labelledby={`${id}-label`}>
      <div>
        <p id={`${id}-label`} className="text-[0.9375rem] font-medium text-ink">
          {label}
        </p>
        {description && <p className="text-[0.8125rem] text-muted">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label.toLowerCase()}`}>
          <Minus className="size-4" aria-hidden />
        </button>
        <output className="w-6 text-center text-base font-semibold tabular-nums" aria-live="polite">
          {value}
        </output>
        <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label.toLowerCase()}`}>
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
