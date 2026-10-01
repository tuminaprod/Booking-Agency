import { Info } from "lucide-react";
import type { Price, PriceLine } from "@/lib/models";
import { cn } from "@/lib/cn";
import { Money } from "@/components/ui/money";

const GROUPS: { kind: PriceLine["kind"]; title: string }[] = [
  { kind: "base", title: "Base price" },
  { kind: "discount", title: "Discounts" },
  { kind: "extra", title: "Extras" },
  { kind: "tax", title: "Taxes" },
  { kind: "fee", title: "Fees" },
];

/**
 * Itemised price — the same component is used on room cards, the booking
 * summary, payment step, confirmation and account pages, so customers see an
 * identical breakdown everywhere.
 */
export function PriceBreakdown({ price, compact, className }: { price: Price; compact?: boolean; className?: string }) {
  return (
    <div className={cn("text-[0.9375rem]", className)}>
      <dl className="space-y-3">
        {GROUPS.map(({ kind, title }) => {
          const lines = price.lines.filter((l) => l.kind === kind && l.amount !== 0);
          if (!lines.length) return null;
          return (
            <div key={kind}>
              {!compact && <dt className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">{title}</dt>}
              {lines.map((l) => (
                <div key={l.id} className="flex items-start justify-between gap-4 py-0.5">
                  <dt className="min-w-0 text-ink-soft">
                    {l.label}
                    {l.detail && <span className="block text-[0.8125rem] text-muted">{l.detail}</span>}
                    {l.payableAt === "property" && <span className="mt-0.5 inline-block rounded-xs bg-sand px-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-soft">Pay at property</span>}
                  </dt>
                  <dd className={cn("shrink-0 tabular-nums", kind === "discount" ? "font-medium text-success" : "text-ink")}>
                    {l.amount < 0 ? "−" : ""}
                    <Money usd={Math.abs(l.amount)} cents />
                  </dd>
                </div>
              ))}
            </div>
          );
        })}
      </dl>
      <div className="mt-4 border-t border-line pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-semibold text-ink">Total price</span>
          <span className="text-xl font-semibold tabular-nums text-ink">
            <Money usd={price.total} cents />
          </span>
        </div>
        {price.dueAtProperty > 0 && (
          <div className="mt-2 space-y-1 rounded-md bg-sand/70 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Pay now</span>
              <span className="font-semibold tabular-nums">
                <Money usd={price.dueNow} cents />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Pay at the property</span>
              <span className="tabular-nums">
                <Money usd={price.dueAtProperty} cents />
              </span>
            </div>
          </div>
        )}
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          Includes all taxes and mandatory fees. Charged in USD; other currencies are estimates.
        </p>
      </div>
    </div>
  );
}
