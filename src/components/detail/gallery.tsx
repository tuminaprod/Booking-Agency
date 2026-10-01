"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Grid2x2, X } from "lucide-react";
import type { ImageAsset } from "@/lib/models";
import { cn } from "@/lib/cn";

function Lightbox({ images, index, onIndex, onClose }: { images: ImageAsset[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const prev = useCallback(() => onIndex((index - 1 + images.length) % images.length), [index, images.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % images.length), [index, images.length, onIndex]);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.showModal();
    document.documentElement.style.overflow = "hidden";
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => {
      el.removeEventListener("cancel", onCancel);
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const img = images[index];
  return (
    <dialog ref={ref} aria-label="Photo gallery" className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 text-white backdrop:bg-ink">
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <p className="text-sm text-white/80" aria-live="polite">
            {index + 1} / {images.length}
          </p>
          <button type="button" onClick={onClose} className="inline-flex size-11 items-center justify-center rounded-md hover:bg-white/10" aria-label="Close gallery" autoFocus>
            <X className="size-6" aria-hidden />
          </button>
        </div>
        <div
          className="relative min-h-0 flex-1"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) (dx > 0 ? prev : next)();
            touchX.current = null;
          }}
        >
          <Image key={img.src} src={img.src} alt={img.alt} fill sizes="100vw" quality={85} className="animate-fade-in object-contain" />
          <button type="button" onClick={prev} className="absolute left-2 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 sm:left-6" aria-label="Previous photo">
            <ChevronLeft className="size-6" aria-hidden />
          </button>
          <button type="button" onClick={next} className="absolute right-2 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 sm:right-6" aria-label="Next photo">
            <ChevronRight className="size-6" aria-hidden />
          </button>
        </div>
        <p className="px-4 pt-3 text-center text-sm text-white/80">{img.alt}</p>
        <div className="no-scrollbar flex shrink-0 justify-center gap-2 overflow-x-auto px-4 py-4">
          {images.map((im, i) => (
            <button key={im.src + i} type="button" onClick={() => onIndex(i)} aria-label={`Show photo ${i + 1}: ${im.alt}`} aria-current={i === index} className={cn("relative h-14 w-20 shrink-0 overflow-hidden rounded-md transition-opacity", i === index ? "ring-2 ring-gold-soft" : "opacity-50 hover:opacity-100")}>
              <Image src={im.src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    </dialog>
  );
}

/** Image grid on desktop, swipeable carousel on mobile, full-screen lightbox on both. */
export function Gallery({ images, className }: { images: ImageAsset[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const close = useCallback(() => setOpen(null), []);
  const grid = images.slice(0, 5);

  return (
    <div className={className}>
      {/* Mobile carousel */}
      <div className="relative -mx-4 sm:hidden">
        <div
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => setMobileIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          aria-label="Photos"
          role="region"
        >
          {images.map((img, i) => (
            <button key={img.src + i} type="button" onClick={() => setOpen(i)} className="relative aspect-[4/3] w-full shrink-0 snap-center" aria-label={`Open photo ${i + 1} of ${images.length}`}>
              <Image src={img.src} alt={img.alt} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-sm bg-ink/70 px-2 py-1 text-xs font-medium text-white" aria-hidden>
          {mobileIndex + 1} / {images.length}
        </span>
      </div>

      {/* Desktop grid */}
      <div className="relative hidden h-[min(56vh,520px)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl sm:grid">
        {grid.map((img, i) => (
          <button
            key={img.src + i}
            type="button"
            onClick={() => setOpen(i)}
            className={cn("group relative overflow-hidden bg-sand", i === 0 && "col-span-2 row-span-2", grid.length < 5 && i === grid.length - 1 && "col-span-2")}
            aria-label={`Open photo ${i + 1} of ${images.length}: ${img.alt}`}
          >
            <Image src={img.src} alt={img.alt} fill priority={i === 0} sizes={i === 0 ? "50vw" : "25vw"} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            <span className="absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/10" />
          </button>
        ))}
        <button type="button" onClick={() => setOpen(0)} className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-md bg-surface px-4 text-sm font-medium text-ink shadow-card hover:bg-ivory">
          <Grid2x2 className="size-4" aria-hidden />
          Show all {images.length} photos
        </button>
      </div>

      {open !== null && <Lightbox images={images} index={open} onIndex={setOpen} onClose={close} />}
    </div>
  );
}
