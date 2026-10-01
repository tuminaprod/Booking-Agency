"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { SavableType } from "@/lib/models";
import { wishlist, wishlistStore, type SavedSnapshot } from "@/lib/stores";
import { useToast } from "./toast";

export function SaveButton({
  type,
  entityId,
  snapshot,
  variant = "overlay",
  className,
}: {
  type: SavableType;
  entityId: string;
  snapshot: SavedSnapshot;
  variant?: "overlay" | "outline";
  className?: string;
}) {
  const items = wishlistStore.use((s) => s.items);
  const saved = items.some((i) => i.type === type && i.entityId === entityId);
  const toast = useToast();
  const router = useRouter();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = wishlist.toggle(type, entityId, snapshot);
    if (nowSaved) {
      toast.success("Saved to your wishlist", snapshot.title, { label: "View wishlist", onClick: () => router.push("/wishlist") });
    } else {
      toast.info("Removed from your wishlist", snapshot.title, { label: "Undo", onClick: () => wishlist.toggle(type, entityId, snapshot) });
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${snapshot.title} from wishlist` : `Save ${snapshot.title} to wishlist`}
      className={cn(
        "group/save inline-flex items-center justify-center transition-[transform,background-color] duration-150 active:scale-90",
        variant === "overlay" && "size-10 rounded-full bg-white/95 text-ink shadow-soft hover:bg-white",
        variant === "outline" && "h-11 gap-2 rounded-md border border-line-strong bg-surface px-4 text-[0.9375rem] font-medium text-ink hover:bg-sand/60",
        className,
      )}
    >
      <Heart className={cn("size-[18px] transition-colors", saved ? "fill-danger text-danger" : "text-ink group-hover/save:text-danger")} aria-hidden />
      {variant === "outline" && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
