"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { defaultStay } from "@/lib/dates";
import { serializeHotelQuery } from "@/lib/search/hotel-query";
import { pushSearchHistory } from "@/lib/stores";
import { Modal } from "@/components/ui/dialog";
import { SearchCombobox } from "@/components/search/search-combobox";

/** Site-wide search palette (⌘K / Ctrl K). */
export function GlobalSearch({ variant = "desktop", light = false }: { variant?: "desktop" | "icon"; light?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setText("");
    router.push(href);
  };

  return (
    <>
      {variant === "desktop" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "hidden h-10 w-56 items-center gap-2 rounded-md border px-3 text-sm transition-colors 2xl:flex",
            light ? "border-white/30 bg-white/10 text-white/90 hover:bg-white/15" : "border-line bg-surface text-muted hover:border-line-strong",
          )}
          aria-haspopup="dialog"
        >
          <Search className="size-4" aria-hidden />
          <span className="flex-1 text-left">Search Oriel</span>
          <kbd className={cn("rounded-xs border px-1.5 text-[0.6875rem] font-medium", light ? "border-white/30" : "border-line")}>Ctrl K</kbd>
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("inline-flex size-11 items-center justify-center rounded-md", light ? "text-white hover:bg-white/10" : "text-ink hover:bg-sand", variant === "desktop" && "2xl:hidden")}
        aria-label="Search destinations, hotels, trips and experiences"
        aria-haspopup="dialog"
      >
        <Search className="size-5" aria-hidden />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Search Oriel" hideTitle size="lg" className="sm:mt-[12vh] sm:mb-auto">
        <div className="-mx-5 -my-5 sm:-mx-6">
          {open && (
            <SearchCombobox
              label="Search destinations, hotels, trips and experiences"
              hideLabel
              variant="palette"
              autoFocus
              placeholder="Try “Santorini”, “ryokan” or “food tour”"
              value={text}
              onValueChange={setText}
              onSelect={(entry) => {
                pushSearchHistory({ kind: "query", label: entry.title, detail: entry.subtitle, href: entry.href });
                go(entry.href);
              }}
              onSelectRecent={(r) => go(r.href)}
              onSubmitText={(q) => {
                const stay = defaultStay();
                const href = `/hotels?${serializeHotelQuery({ q, ...stay })}`;
                pushSearchHistory({ kind: "query", label: `“${q}”`, detail: "Hotel search", href });
                go(href);
              }}
              inputClassName="!pl-12"
              className="[&_label+div>span]:pl-5"
            />
          )}
          <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-6">
            <kbd className="font-semibold">↑</kbd> <kbd className="font-semibold">↓</kbd> to navigate · <kbd className="font-semibold">Enter</kbd> to open · <kbd className="font-semibold">Esc</kbd> to close
          </p>
        </div>
      </Modal>
    </>
  );
}
