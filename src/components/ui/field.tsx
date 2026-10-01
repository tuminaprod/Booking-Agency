import { useId, type ComponentProps, type ReactNode } from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Accessible form primitives. `Field` wires label, hint and error text to
 * the control via aria-describedby / aria-invalid, and places errors right
 * below the field they belong to.
 */

export const controlClasses =
  "block w-full rounded-md border bg-surface px-3.5 text-[0.9375rem] text-ink placeholder:text-subtle transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:bg-sand disabled:text-muted";

const stateClasses = (invalid?: boolean) => (invalid ? "border-danger focus:border-danger focus:ring-danger/20" : "border-line-strong hover:border-ink/35 focus:border-gold");

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  labelClassName?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

export function Field({ label, hint, error, optional, className, labelClassName, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-sm font-medium text-ink", labelClassName)}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-[0.8125rem] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-[0.8125rem] font-medium text-danger">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = ComponentProps<"input"> & { invalid?: boolean; leading?: ReactNode; trailing?: ReactNode };

export function Input({ invalid, leading, trailing, className, ...props }: InputProps) {
  if (!leading && !trailing) {
    return <input aria-invalid={invalid || undefined} className={cn(controlClasses, stateClasses(invalid), "h-11", className)} {...props} />;
  }
  return (
    <div className="relative">
      {leading && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">{leading}</span>}
      <input
        aria-invalid={invalid || undefined}
        className={cn(controlClasses, stateClasses(invalid), "h-11", leading && "pl-10", trailing && "pr-11", className)}
        {...props}
      />
      {trailing && <span className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</span>}
    </div>
  );
}

export function Textarea({ invalid, className, ...props }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea aria-invalid={invalid || undefined} className={cn(controlClasses, stateClasses(invalid), "min-h-28 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ invalid, className, children, ...props }: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <select aria-invalid={invalid || undefined} className={cn(controlClasses, stateClasses(invalid), "h-11 appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
}

type CheckProps = Omit<ComponentProps<"input">, "type"> & { label: ReactNode; description?: ReactNode; count?: number };

export function Checkbox({ label, description, count, className, id, ...props }: CheckProps) {
  const autoId = useId();
  const cid = id ?? autoId;
  return (
    <label htmlFor={cid} className={cn("group flex min-h-10 items-start gap-3 py-1.5 text-[0.9375rem]", props.disabled && "opacity-50", className)}>
      <span className="relative mt-0.5 inline-flex size-5 shrink-0">
        <input id={cid} type="checkbox" className="peer size-5 appearance-none rounded-sm border border-line-strong bg-surface transition-colors checked:border-navy checked:bg-navy group-hover:border-ink/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" {...props} />
        <Check className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
      </span>
      <span className="flex-1">
        <span className="text-ink">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </span>
      {count !== undefined && <span className="text-sm tabular-nums text-muted">{count}</span>}
    </label>
  );
}

export function Radio({ label, description, className, id, ...props }: CheckProps) {
  const autoId = useId();
  const rid = id ?? autoId;
  return (
    <label htmlFor={rid} className={cn("group flex min-h-10 items-start gap-3 py-1.5 text-[0.9375rem]", className)}>
      <input
        id={rid}
        type="radio"
        className="mt-0.5 size-5 shrink-0 appearance-none rounded-full border border-line-strong bg-surface transition-[border] checked:border-[6px] checked:border-navy group-hover:border-ink/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        {...props}
      />
      <span>
        <span className="text-ink">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function Switch({ label, description, className, id, ...props }: CheckProps) {
  const autoId = useId();
  const sid = id ?? autoId;
  return (
    <label htmlFor={sid} className={cn("flex min-h-11 items-center justify-between gap-4", className)}>
      <span>
        <span className="block text-[0.9375rem] font-medium text-ink">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0">
        <input id={sid} type="checkbox" role="switch" className="peer absolute inset-0 appearance-none rounded-full bg-line-strong transition-colors checked:bg-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" {...props} />
        <span className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-soft transition-transform duration-200 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
