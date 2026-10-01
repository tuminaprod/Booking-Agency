"use client";

import { useEffect } from "react";
import { Share2 } from "lucide-react";
import type { SavableType } from "@/lib/models";
import { trackRecentlyViewed, type SavedSnapshot } from "@/lib/stores";
import { useToast } from "@/components/ui/toast";

export function TrackRecentlyViewed({ type, entityId, snapshot }: { type: SavableType; entityId: string; snapshot: SavedSnapshot }) {
  useEffect(() => {
    trackRecentlyViewed(type, entityId, snapshot);
    // Only record once per entity view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, entityId]);
  return null;
}

export function ShareButton({ title, className }: { title: string; className?: string }) {
  const toast = useToast();
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", "Share it with your travel companions.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error("Couldn't share", "Copy the address from your browser instead.");
    }
  };
  return (
    <button type="button" onClick={share} className={className ?? "inline-flex h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-[0.9375rem] font-medium text-ink hover:bg-sand/60"}>
      <Share2 className="size-[18px]" aria-hidden />
      Share
    </button>
  );
}
