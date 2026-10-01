import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function Stepper({ steps, current, onStep }: { steps: string[]; current: number; onStep?: (i: number) => void }) {
  return (
    <nav aria-label="Booking progress">
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = done && onStep;
          const content = (
            <>
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  done && "border-navy bg-navy text-white",
                  active && "border-navy bg-surface text-navy ring-4 ring-navy-tint",
                  !done && !active && "border-line-strong bg-surface text-muted",
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : <span aria-hidden>{i + 1}</span>}
              </span>
              <span aria-hidden className={cn("hidden text-sm font-medium md:inline", active ? "text-ink" : "text-muted")}>{label}</span>
            </>
          );
          return (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none sm:gap-3" aria-current={active ? "step" : undefined}>
              {clickable ? (
                <button type="button" onClick={() => onStep(i)} className="flex items-center gap-2 rounded-md" aria-label={`Back to step ${i + 1}: ${label}`}>
                  {content}
                </button>
              ) : (
                <span className="flex items-center gap-2">
                  {content}
                  <span className="sr-only">
                    Step {i + 1} of {steps.length}: {label}
                    {done ? ", completed" : active ? ", current" : ""}
                  </span>
                </span>
              )}
              {i < steps.length - 1 && <span className={cn("h-px flex-1", done ? "bg-navy" : "bg-line")} aria-hidden />}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm font-medium text-ink md:hidden">
        Step {current + 1} of {steps.length}: {steps[current]}
      </p>
    </nav>
  );
}
