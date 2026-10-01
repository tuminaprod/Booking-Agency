import Link from "next/link";
import { cn } from "@/lib/cn";

/** Oriel mark: an arched bay window framing a horizon and rising sun. */
export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const stroke = tone === "dark" ? "var(--color-navy)" : "#fff";
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden focusable="false">
      <path d="M6 29V14a10 10 0 0 1 20 0v15" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10.5 29V15a5.5 5.5 0 0 1 11 0v14" fill="none" stroke={stroke} strokeWidth="1.2" opacity="0.55" />
      <circle cx="16" cy="19.5" r="2.6" fill="var(--color-gold-soft)" />
      <path d="M6 23.5h20" stroke="var(--color-gold-soft)" strokeWidth="1.6" />
    </svg>
  );
}

export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 rounded-sm", className)} aria-label="Oriel — home">
      <LogoMark tone={tone} />
      <span className={cn("font-display text-[1.7rem] font-semibold leading-none tracking-[0.08em]", tone === "dark" ? "text-navy" : "text-white")}>ORIEL</span>
    </Link>
  );
}
