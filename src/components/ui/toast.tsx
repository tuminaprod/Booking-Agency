"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  show: (t: Omit<Toast, "id">) => void;
  success: (title: string, description?: string, action?: Toast["action"]) => void;
  error: (title: string, description?: string, action?: Toast["action"]) => void;
  info: (title: string, description?: string, action?: Toast["action"]) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-5 text-success" aria-hidden />,
  error: <XCircle className="size-5 text-danger" aria-hidden />,
  info: <Info className="size-5 text-info" aria-hidden />,
  warning: <AlertTriangle className="size-5 text-warning" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismiss(id), t.action ? 7000 : 4500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description, action) => show({ tone: "success", title, description, action }),
      error: (title, description, action) => show({ tone: "error", title, description, action }),
      info: (title, description, action) => show({ tone: "info", title, description, action }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn("pointer-events-auto flex w-full max-w-sm animate-rise-in items-start gap-3 rounded-lg border border-line bg-surface p-4 shadow-raised")}
          >
            {ICONS[t.tone]}
            <div className="min-w-0 flex-1">
              <p className="text-[0.9375rem] font-semibold text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-muted">{t.description}</p>}
              {t.action && (
                <button
                  type="button"
                  className="mt-2 text-sm font-semibold text-navy underline-offset-4 hover:underline"
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="-m-1 inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-sand hover:text-ink" aria-label="Dismiss notification">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
