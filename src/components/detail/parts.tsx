import Link from "next/link";
import { Check, X } from "lucide-react";
import type { Review } from "@/lib/models";
import { cn } from "@/lib/cn";
import { formatDate, ratingLabel } from "@/lib/format";
import { RatingBadge } from "@/components/ui/rating";

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? (
              <Link href={it.href} className="hover:text-ink hover:underline">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function DetailSection({ id, title, children, className }: { id: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-32 border-t border-line py-10 first:border-t-0 first:pt-0", className)}>
      <h2 id={`${id}-title`} className="mb-5 font-display text-3xl text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="On this page" className="sticky top-16 z-20 -mx-4 border-b border-line bg-ivory/95 px-4 backdrop-blur lg:top-[72px] lg:mx-0 lg:px-0">
      <ul className="no-scrollbar flex gap-6 overflow-x-auto">
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className="inline-flex h-12 items-center whitespace-nowrap border-b-2 border-transparent text-[0.9375rem] font-medium text-muted hover:border-line-strong hover:text-ink">
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function IncludedList({ included, excluded }: { included: string[]; excluded: string[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div>
        <h3 className="mb-3 font-semibold text-ink">What&apos;s included</h3>
        <ul className="space-y-2">
          {included.map((i) => (
            <li key={i} className="flex gap-2.5 text-[0.9375rem] text-ink-soft">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              {i}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-3 font-semibold text-ink">Not included</h3>
        <ul className="space-y-2">
          {excluded.map((i) => (
            <li key={i} className="flex gap-2.5 text-[0.9375rem] text-ink-soft">
              <X className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              {i}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const TRAVELER_LABEL: Record<Review["travelerType"], string> = { couple: "Couple", family: "Family", solo: "Solo traveller", business: "Business", friends: "Group of friends" };

export function ReviewsBlock({ rating, count, reviews }: { rating: number; count: number; reviews: Review[] }) {
  const buckets = [
    { label: "9+ Superb", min: 9 },
    { label: "8–9 Very good", min: 8 },
    { label: "7–8 Good", min: 7 },
    { label: "Below 7", min: 0 },
  ];
  const counts = buckets.map((b, i) => reviews.filter((r) => r.rating >= b.min && (i === 0 || r.rating < buckets[i - 1].min)).length);
  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
      <div>
        <RatingBadge rating={rating} size="lg" showLabel={false} />
        <p className="mt-3 font-display text-2xl text-ink">{ratingLabel(rating)}</p>
        <p className="text-sm text-muted">Based on {count.toLocaleString("en-US")} verified reviews</p>
        <dl className="mt-5 space-y-2">
          {buckets.map((b, i) => (
            <div key={b.label} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3 text-sm">
              <dt className="text-ink-soft">{b.label}</dt>
              <dd className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                <span className="block h-full rounded-full bg-navy" style={{ width: `${reviews.length ? (counts[i] / reviews.length) * 100 : 0}%` }} />
              </dd>
              <dd className="text-right tabular-nums text-muted">{counts[i]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">Breakdown of the {reviews.length} most recent reviews.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {reviews.slice(0, 6).map((r) => (
          <li key={r.id} className="rounded-lg border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-navy-tint text-sm font-semibold text-navy" aria-hidden>
                  {r.author[0]}
                </span>
                <div>
                  <p className="font-semibold text-ink">{r.author}</p>
                  <p className="text-[0.8125rem] text-muted">
                    {r.country} · {TRAVELER_LABEL[r.travelerType]}
                  </p>
                </div>
              </div>
              <RatingBadge rating={r.rating} size="sm" showLabel={false} />
            </div>
            <p className="mt-4 font-semibold text-ink">“{r.title}”</p>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-soft">{r.body}</p>
            <p className="mt-3 text-xs text-muted">Reviewed {formatDate(r.date)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
