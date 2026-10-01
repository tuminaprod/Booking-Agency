"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/field";

interface Option {
  id: string;
  label: string;
}

/**
 * URL-driven toolbar for listing pages (trips, experiences, destinations,
 * guides). Results are server-rendered from the search params, so every
 * filtered view is linkable and works with Back/Forward.
 */
export function ListingToolbar({
  categories,
  categoryParam = "category",
  sorts,
  destinations,
  total,
  noun,
  extraChips = [],
}: {
  categories?: Option[];
  categoryParam?: string;
  sorts?: Option[];
  destinations?: Option[];
  total: number;
  noun: [string, string];
  extraChips?: { param: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    startTransition(() => router.push(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false }));
  };
  const active = sp.get(categoryParam) ?? "";

  return (
    <div className="space-y-4" aria-busy={pending}>
      {categories && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by category">
          {[{ id: "", label: "All" }, ...categories].map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id || "all"}
                type="button"
                aria-pressed={on}
                onClick={() => set({ [categoryParam]: c.id || null })}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center rounded-md border px-4 text-sm font-medium transition-colors",
                  on ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-ink hover:border-ink/50",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={cn("text-[0.9375rem] text-muted transition-opacity", pending && "opacity-50")} aria-live="polite">
          {pending ? "Updating…" : `${total} ${total === 1 ? noun[0] : noun[1]}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {extraChips
            .filter((c) => sp.get(c.param))
            .map((c) => (
              <button key={c.param} type="button" onClick={() => set({ [c.param]: null })} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line-strong bg-surface pl-3 pr-2 text-sm text-ink hover:border-ink/50" aria-label={`Remove filter ${c.label}`}>
                {c.label}
                <X className="size-3.5 text-muted" aria-hidden />
              </button>
            ))}
          {destinations && (
            <Select aria-label="Destination" value={sp.get("destination") ?? ""} onChange={(e) => set({ destination: e.target.value || null })} className="h-10 w-auto min-w-44 text-sm">
              <option value="">All destinations</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </Select>
          )}
          {sorts && (
            <Select aria-label="Sort" value={sp.get("sort") ?? sorts[0].id} onChange={(e) => set({ sort: e.target.value === sorts[0].id ? null : e.target.value })} className="h-10 w-auto min-w-44 text-sm">
              {sorts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}
