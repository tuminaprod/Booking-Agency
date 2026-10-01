"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Modal and Drawer built on the native <dialog> element: the browser handles
 * focus trapping, Escape to close, inert background and the top layer.
 */

interface BaseProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  hideTitle?: boolean;
}

function useNativeDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && el.open) {
      el.close();
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => {
      document.documentElement.style.overflow = "";
      onCloseRef.current();
    };
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCloseRef.current();
    };
    el.addEventListener("close", handleClose);
    el.addEventListener("cancel", handleCancel);
    return () => {
      el.removeEventListener("close", handleClose);
      el.removeEventListener("cancel", handleCancel);
    };
  }, []);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onCloseRef.current();
  };
  return { ref, onBackdropClick };
}

function Header({ title, description, onClose, hideTitle, titleId }: Pick<BaseProps, "title" | "description" | "onClose" | "hideTitle"> & { titleId: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6", hideTitle && "sr-only")}>
      <div>
        <h2 id={titleId} className="text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <button type="button" onClick={onClose} className="-mr-2 -mt-1 inline-flex size-10 items-center justify-center rounded-md text-muted hover:bg-sand hover:text-ink" aria-label="Close">
        <X className="size-5" aria-hidden />
      </button>
    </div>
  );
}

export function Modal({ open, onClose, title, description, children, footer, className, hideTitle, size = "md" }: BaseProps & { size?: "sm" | "md" | "lg" | "xl" | "full" }) {
  const { ref, onBackdropClick } = useNativeDialog(open, onClose);
  const titleId = useId();
  const width = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl", full: "max-w-none" }[size];
  return (
    <dialog
      ref={ref}
      onClick={onBackdropClick}
      aria-labelledby={titleId}
      className={cn(
        "m-auto max-h-[min(92dvh,900px)] w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-line bg-surface p-0 shadow-overlay backdrop:backdrop-blur-[1px] open:flex open:animate-rise-in open:flex-col",
        width,
        className,
      )}
    >
      {open && (
        <>
          <Header titleId={titleId} title={title} description={description} onClose={onClose} hideTitle={hideTitle} />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
          {footer && <div className="border-t border-line bg-ivory px-5 py-3.5 sm:px-6">{footer}</div>}
        </>
      )}
    </dialog>
  );
}

export function Drawer({ open, onClose, title, description, children, footer, className, side = "right" }: BaseProps & { side?: "right" | "left" | "bottom" }) {
  const { ref, onBackdropClick } = useNativeDialog(open, onClose);
  const titleId = useId();
  const pos = {
    right: "ml-auto mr-0 h-dvh max-h-dvh w-full max-w-md open:animate-slide-in-right",
    left: "mr-auto ml-0 h-dvh max-h-dvh w-[88%] max-w-sm open:animate-slide-in-left",
    bottom: "mb-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-xl open:animate-slide-up",
  }[side];
  return (
    <dialog ref={ref} onClick={onBackdropClick} aria-labelledby={titleId} className={cn("overflow-hidden border-0 bg-surface p-0 shadow-overlay open:flex open:flex-col", pos, className)}>
      {open && (
        <>
          <Header titleId={titleId} title={title} description={description} onClose={onClose} />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">{children}</div>
          {footer && <div className="pb-safe border-t border-line bg-surface px-5 py-3.5 sm:px-6">{footer}</div>}
        </>
      )}
    </dialog>
  );
}
