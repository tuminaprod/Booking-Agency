import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { ratingLabel } from "@/lib/format";

export function Stars({ count, className, size = "sm" }: { count: number; className?: string; size?: "sm" | "md" }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-gold", className)} role="img" aria-label={`${count}-star property`}>
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} className={size === "sm" ? "size-3.5" : "size-4"} fill="currentColor" strokeWidth={0} aria-hidden />
      ))}
    </span>
  );
}

/** Guest rating on a 10-point scale with a verbal label and review count. */
export function RatingBadge({
  rating,
  reviews,
  size = "md",
  className,
  showLabel = true,
}: {
  rating: number;
  reviews?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-navy font-semibold tabular-nums text-white",
          size === "sm" && "h-6 min-w-8 px-1.5 text-xs",
          size === "md" && "h-7 min-w-9 px-1.5 text-sm",
          size === "lg" && "h-10 min-w-12 px-2 text-lg",
        )}
        aria-label={`Rated ${rating.toFixed(1)} out of 10`}
      >
        {rating.toFixed(1)}
      </span>
      {(showLabel || reviews !== undefined) && (
        <span className="leading-tight">
          {showLabel && <span className={cn("block font-semibold text-ink", size === "sm" ? "text-[0.8125rem]" : "text-sm")}>{ratingLabel(rating)}</span>}
          {reviews !== undefined && <span className="block text-[0.8125rem] text-muted">{reviews.toLocaleString("en-US")} reviews</span>}
        </span>
      )}
    </span>
  );
}
