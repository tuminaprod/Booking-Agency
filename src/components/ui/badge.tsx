import type { ReactNode } from "react";
import { BadgePercent, Coffee, Crown, Flame, Hourglass, ShieldCheck, Sparkles, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DisplayBadge } from "@/lib/search/hotel-query";

export type BadgeTone = "neutral" | "navy" | "gold" | "success" | "warning" | "danger" | "info" | "overlay";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-sand text-ink-soft",
  navy: "bg-navy text-white",
  gold: "bg-gold-tint text-gold-600",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
  info: "bg-info-tint text-info",
  overlay: "bg-white/95 text-ink shadow-soft",
};

export function Badge({ tone = "neutral", icon, className, children }: { tone?: BadgeTone; icon?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-sm px-2 text-xs font-semibold tracking-wide", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

const HOTEL_BADGES: Record<DisplayBadge, { label: string; tone: BadgeTone; icon: ReactNode }> = {
  popular: { label: "Popular", tone: "navy", icon: <Flame className="size-3" aria-hidden /> },
  "great-value": { label: "Great value", tone: "success", icon: <ThumbsUp className="size-3" aria-hidden /> },
  luxury: { label: "Luxury", tone: "gold", icon: <Crown className="size-3" aria-hidden /> },
  limited: { label: "Limited availability", tone: "warning", icon: <Hourglass className="size-3" aria-hidden /> },
  new: { label: "New", tone: "info", icon: <Sparkles className="size-3" aria-hidden /> },
  "free-cancellation": { label: "Free cancellation", tone: "success", icon: <ShieldCheck className="size-3" aria-hidden /> },
  breakfast: { label: "Breakfast included", tone: "neutral", icon: <Coffee className="size-3" aria-hidden /> },
};

export function HotelBadge({ badge, className }: { badge: DisplayBadge; className?: string }) {
  const b = HOTEL_BADGES[badge];
  return (
    <Badge tone={b.tone} icon={b.icon} className={className}>
      {b.label}
    </Badge>
  );
}

export function DealBadge({ label }: { label: string }) {
  return (
    <Badge tone="danger" icon={<BadgePercent className="size-3" aria-hidden />}>
      {label}
    </Badge>
  );
}
