"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
}

/**
 * WAI-ARIA tabs with roving tabindex and arrow-key navigation.
 * Render panels with `tabPanelProps(id)` so they are correctly labelled.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  variant = "underline",
  className,
  idBase,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  variant?: "underline" | "segmented" | "hero";
  className?: string;
  idBase?: string;
}) {
  const autoId = useId();
  const base = idBase ?? autoId;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(items[next].id);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex",
        variant === "underline" && "no-scrollbar gap-6 overflow-x-auto border-b border-line",
        variant === "segmented" && "inline-flex gap-1 rounded-md bg-sand p-1",
        variant === "hero" && "gap-1",
        className,
      )}
    >
      {items.map((item, i) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`${base}-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 font-medium transition-colors duration-150",
              variant === "underline" && ["-mb-px h-12 border-b-2 text-[0.9375rem]", selected ? "border-navy text-ink" : "border-transparent text-muted hover:text-ink"],
              variant === "segmented" && ["h-9 rounded-sm px-3.5 text-sm", selected ? "bg-surface text-ink shadow-soft" : "text-muted hover:text-ink"],
              variant === "hero" && [
                "h-11 rounded-t-lg px-4 text-sm tracking-wide sm:px-6",
                selected ? "bg-surface text-ink" : "bg-ink/45 text-white/90 backdrop-blur-sm hover:bg-ink/60",
              ],
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function tabPanelProps(base: string, id: string) {
  return { role: "tabpanel" as const, id: `${base}-panel-${id}`, "aria-labelledby": `${base}-tab-${id}`, tabIndex: 0 };
}
