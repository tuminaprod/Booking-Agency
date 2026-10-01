import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, WifiOff, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center", className)}>
      <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-gold-tint text-gold">{icon}</div>
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-md text-[0.9375rem] text-muted">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this right now. Please check your connection and try again.",
  action,
  offline,
  className,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  offline?: boolean;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center rounded-lg border border-line bg-surface px-6 py-14 text-center", className)}>
      <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-danger-tint text-danger">
        {offline ? <WifiOff className="size-6" aria-hidden /> : <AlertTriangle className="size-6" aria-hidden />}
      </div>
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-[0.9375rem] text-muted">{description}</p>
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

type AlertTone = "info" | "success" | "warning" | "danger";
const ALERT: Record<AlertTone, { cls: string; icon: ReactNode }> = {
  info: { cls: "border-info/20 bg-info-tint text-info", icon: <Info className="size-5" aria-hidden /> },
  success: { cls: "border-success/20 bg-success-tint text-success", icon: <CheckCircle2 className="size-5" aria-hidden /> },
  warning: { cls: "border-warning/20 bg-warning-tint text-warning", icon: <AlertTriangle className="size-5" aria-hidden /> },
  danger: { cls: "border-danger/20 bg-danger-tint text-danger", icon: <XCircle className="size-5" aria-hidden /> },
};

export function Alert({ tone = "info", title, children, className, action }: { tone?: AlertTone; title?: string; children?: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border p-4", ALERT[tone].cls, className)}>
      <span className="mt-0.5 shrink-0">{ALERT[tone].icon}</span>
      <div className="min-w-0 flex-1 text-[0.9375rem]">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("text-ink-soft", title && "mt-0.5")}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
