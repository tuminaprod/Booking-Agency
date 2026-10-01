"use client";

import Image from "next/image";
import { useCallback, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Building2, Clock, Compass, MapPin, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { rankSuggestions, SUGGESTION_GROUP_LABEL, type SuggestEntry, type SuggestionType } from "@/lib/search/suggest";
import { useSuggestIndex } from "@/lib/search/use-suggest-index";
import { clearSearchHistory, removeSearchHistory, searchHistoryStore, type RecentSearch } from "@/lib/stores";

const TYPE_ICON: Record<SuggestionType, ReactNode> = {
  destination: <MapPin className="size-4" aria-hidden />,
  hotel: <Building2 className="size-4" aria-hidden />,
  trip: <Compass className="size-4" aria-hidden />,
  experience: <Sparkles className="size-4" aria-hidden />,
};

type Option = { kind: "entry"; entry: SuggestEntry } | { kind: "recent"; recent: RecentSearch };

export interface SearchComboboxProps {
  label: string;
  hideLabel?: boolean;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (entry: SuggestEntry) => void;
  onSelectRecent?: (recent: RecentSearch) => void;
  /** Called when Enter is pressed without an active option */
  onSubmitText?: (text: string) => void;
  types?: SuggestionType[];
  showRecent?: boolean;
  autoFocus?: boolean;
  variant?: "field" | "palette";
  className?: string;
  inputClassName?: string;
  /** Pass `null` to render without a leading icon */
  icon?: ReactNode | null;
}

/**
 * WAI-ARIA combobox (list autocomplete) with grouped results, recent
 * searches and popular destinations. Arrow keys move the active option,
 * Enter selects, Escape closes. Results are ranked locally for instant feedback.
 */
export function SearchCombobox({
  label,
  hideLabel,
  placeholder,
  value,
  onValueChange,
  onSelect,
  onSelectRecent,
  onSubmitText,
  types,
  showRecent = true,
  autoFocus,
  variant = "field",
  className,
  inputClassName,
  icon,
}: SearchComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(Boolean(autoFocus));
  const [open, setOpen] = useState(variant === "palette");
  const [active, setActive] = useState(-1);
  const { index, error } = useSuggestIndex(focused);
  const history = searchHistoryStore.use((s) => s.items);

  const results = useMemo(() => (index && value.trim() ? rankSuggestions(index, value, { types }) : []), [index, value, types]);
  const popular = useMemo(
    () =>
      index
        ? index
            .filter((e) => e.type === "destination")
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 6)
        : [],
    [index],
  );
  const recents = useMemo(() => (showRecent && !value.trim() ? history.slice(0, 4) : []), [showRecent, value, history]);

  const options: Option[] = useMemo(() => {
    if (value.trim()) return results.map((entry) => ({ kind: "entry" as const, entry }));
    return [...recents.map((recent) => ({ kind: "recent" as const, recent })), ...popular.map((entry) => ({ kind: "entry" as const, entry }))];
  }, [value, results, recents, popular]);

  const choose = useCallback(
    (opt: Option) => {
      if (opt.kind === "entry") {
        onSelect(opt.entry);
      } else {
        onSelectRecent?.(opt.recent);
      }
      setOpen(variant === "palette");
      setActive(-1);
    },
    [onSelect, onSelectRecent, variant],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (options.length ? (a + 1) % options.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (options.length ? (a <= 0 ? options.length - 1 : a - 1) : -1));
    } else if (e.key === "Enter") {
      if (open && active >= 0 && options[active]) {
        e.preventDefault();
        choose(options[active]);
      } else if (onSubmitText && value.trim()) {
        e.preventDefault();
        onSubmitText(value.trim());
        setOpen(false);
      }
    } else if (e.key === "Escape" && variant === "field") {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    } else if (e.key === "Home" || e.key === "End") {
      setActive(-1);
    }
  };

  const showPanel = open && focused && (options.length > 0 || Boolean(value.trim()) || error || !index);
  const optionId = (i: number) => `${id}-opt-${i}`;

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={`${id}-input`} className={cn(hideLabel ? "sr-only" : "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted")}>
        {label}
      </label>
      <div className="relative">
        {icon !== null && <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">{icon ?? <Search className="size-[18px]" aria-hidden />}</span>}
        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={Boolean(showPanel)}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onValueChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            // Delay so option clicks register before closing
            window.setTimeout(() => {
              setFocused(false);
              if (variant === "field") setOpen(false);
            }, 120);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full bg-transparent pr-10 text-ink placeholder:text-subtle focus:outline-none",
            icon === null ? "pl-0" : "pl-10",
            variant === "field" && "h-11 text-[0.9375rem] font-medium",
            variant === "palette" && "h-14 text-lg",
            inputClassName,
          )}
        />
        {value && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onValueChange("");
              setActive(-1);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-1 my-auto inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-sand hover:text-ink"
            aria-label="Clear search"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div
        className={cn(
          variant === "field" && "absolute left-0 right-0 top-[calc(100%+10px)] z-50 min-w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface shadow-raised sm:right-auto",
          variant === "palette" && "border-t border-line",
          showPanel ? "block animate-rise-in" : "hidden",
        )}
      >
        <ul id={listId} role="listbox" aria-label={`${label} suggestions`} className={cn("overflow-y-auto overscroll-contain py-2", variant === "field" ? "max-h-[min(26rem,60dvh)]" : "max-h-[60dvh]")}>
          {!index && !error && (
            <li className="px-4 py-3 text-sm text-muted" role="presentation">
              Loading suggestions…
            </li>
          )}
          {error && (
            <li className="px-4 py-3 text-sm text-danger" role="presentation">
              Suggestions are unavailable offline. Press Enter to search anyway.
            </li>
          )}
          {index && value.trim() && results.length === 0 && (
            <li className="px-4 py-4 text-sm text-muted" role="presentation">
              No matches for “{value}”. Try a city, region or hotel name.
            </li>
          )}
          {options.map((opt, i) => {
            const groupOf = (o: Option) => (o.kind === "recent" ? "Recent searches" : value.trim() ? SUGGESTION_GROUP_LABEL[o.entry.type] : "Popular destinations");
            const group = groupOf(opt);
            const header = i === 0 || groupOf(options[i - 1]) !== group;
            return (
              <li key={opt.kind === "recent" ? opt.recent.id : opt.entry.id} role="presentation">
                {header && (
                  <div className="flex items-center justify-between px-4 pb-1 pt-3 first:pt-1" role="presentation">
                    <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">{group}</span>
                    {opt.kind === "recent" && (
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={clearSearchHistory} className="text-xs font-medium text-navy hover:underline">
                        Clear history
                      </button>
                    )}
                  </div>
                )}
                <div
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(opt)}
                  className={cn("mx-2 flex cursor-pointer items-center gap-3 rounded-md px-2 py-2", i === active && "bg-sand")}
                >
                  {opt.kind === "entry" ? (
                    <>
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-sand">
                        <Image src={opt.entry.image} alt="" fill sizes="40px" className="object-cover" unoptimized />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9375rem] font-medium text-ink">{highlight(opt.entry.title, value)}</span>
                        <span className="flex items-center gap-1.5 truncate text-[0.8125rem] text-muted">
                          {TYPE_ICON[opt.entry.type]}
                          {opt.entry.subtitle}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-sand text-muted">
                        <Clock className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9375rem] font-medium text-ink">{opt.recent.label}</span>
                        <span className="block truncate text-[0.8125rem] text-muted">{opt.recent.detail}</span>
                      </span>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearchHistory(opt.recent.id);
                        }}
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-sand-deep hover:text-ink"
                        aria-label={`Remove ${opt.recent.label} from search history`}
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="sr-only" aria-live="polite">
        {value.trim() && index ? `${results.length} suggestion${results.length === 1 ? "" : "s"} available` : ""}
      </div>
    </div>
  );
}

function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-semibold text-navy">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}
