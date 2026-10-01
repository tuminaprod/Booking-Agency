import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "inverse" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-navy text-white shadow-soft hover:bg-navy-700",
  accent: "bg-gold text-white shadow-soft hover:bg-gold-600",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink/40 hover:bg-sand/60",
  ghost: "text-ink hover:bg-sand",
  inverse: "bg-white text-ink shadow-soft hover:bg-ivory",
  danger: "bg-danger text-white hover:bg-danger/90",
  link: "h-auto px-0 text-navy underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-md px-3.5 text-sm",
  md: "h-11 rounded-md px-5 text-[0.9375rem]",
  lg: "h-13 rounded-md px-7 text-base",
  icon: "size-11 rounded-md",
  "icon-sm": "size-9 rounded-md",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], variant !== "link" && sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

export function Button({ variant, size, loading, loadingText, iconLeft, iconRight, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : iconLeft}
      {loading && loadingText ? loadingText : children}
      {!loading && iconRight}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize; iconLeft?: ReactNode; iconRight?: ReactNode };

export function ButtonLink({ variant, size, className, iconLeft, iconRight, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}
