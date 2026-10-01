"use client";

import { useState, type ReactNode } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, Input } from "@/components/ui/field";

export function AuthHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 text-[0.9375rem] text-muted">{description}</p>}
    </div>
  );
}

export const PASSWORD_RULES = [
  { id: "len", label: "At least 10 characters", test: (p: string) => p.length >= 10 },
  { id: "case", label: "Upper and lower case letters", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: "num", label: "A number or symbol", test: (p: string) => /[\d\W_]/.test(p) },
];

export const passwordValid = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

export function PasswordField({
  label = "Password",
  value,
  onChange,
  error,
  autoComplete,
  showRules,
  hint,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete: "current-password" | "new-password";
  showRules?: boolean;
  hint?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const passed = PASSWORD_RULES.filter((r) => r.test(value)).length;
  return (
    <Field label={label} error={error} hint={hint}>
      {(p) => (
        <div>
          <Input
            id={p.id}
            aria-describedby={[p.describedBy, showRules ? `${p.id}-rules` : undefined].filter(Boolean).join(" ") || undefined}
            invalid={p.invalid}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            trailing={
              <button type="button" onClick={() => setVisible((v) => !v)} className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-sand hover:text-ink" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}>
                {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            }
          />
          {showRules && (
            <div id={`${p.id}-rules`} className="mt-2">
              <div className="flex gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < passed ? (passed === 3 ? "bg-success" : "bg-gold") : "bg-line")} />
                ))}
              </div>
              <ul className="mt-2 space-y-1 text-[0.8125rem]">
                {PASSWORD_RULES.map((r) => {
                  const ok = r.test(value);
                  return (
                    <li key={r.id} className={cn("flex items-center gap-1.5", ok ? "text-success" : "text-muted")}>
                      {ok ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                      {r.label}
                      <span className="sr-only">{ok ? " — met" : " — not yet met"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </Field>
  );
}

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(next: string | null, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
