"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";

/** Closes on outside pointer-down and Escape; returns focus to the trigger. */
export function useDismiss(open: boolean, close: () => void, refs: RefObject<HTMLElement | null>[], returnFocus?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (refs.some((r) => r.current?.contains(e.target as Node))) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        returnFocus?.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, refs, returnFocus]);
}

interface PopoverProps {
  trigger: (props: { open: boolean; toggle: () => void; ref: RefObject<HTMLButtonElement | null>; "aria-expanded": boolean; "aria-controls": string }) => ReactNode;
  children: (close: () => void) => ReactNode;
  id: string;
  align?: "start" | "end" | "center";
  className?: string;
  panelClassName?: string;
  label?: string;
}

export function Popover({ trigger, children, id, align = "start", className, panelClassName, label }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const refs = useMemo(() => [wrapRef], []);
  useDismiss(open, close, refs, triggerRef);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o), ref: triggerRef, "aria-expanded": open, "aria-controls": id })}
      {open && (
        <div
          id={id}
          role="dialog"
          aria-label={label}
          className={cn(
            "absolute top-[calc(100%+8px)] z-50 min-w-64 animate-rise-in rounded-lg border border-line bg-surface p-4 shadow-raised",
            align === "start" && "left-0",
            align === "end" && "right-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            panelClassName,
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
