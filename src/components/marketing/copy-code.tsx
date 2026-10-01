"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          toast.success(`Code ${code} copied`, "Paste it on the payment step.");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Couldn't copy", `Your code is ${code}`);
        }
      }}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-dashed border-gold bg-gold-tint px-3 font-mono text-sm font-semibold tracking-wider text-gold-600 transition-colors hover:bg-gold-tint/60"
      aria-label={`Copy promo code ${code}`}
    >
      {code}
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
    </button>
  );
}
