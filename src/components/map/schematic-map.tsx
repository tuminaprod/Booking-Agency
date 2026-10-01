"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Info, LocateFixed, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { MapViewProps } from "./types";

const SIZE = 1000;
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

/** Equirectangular projection into a padded square, preserving aspect. */
function useProjection(markers: MapViewProps["markers"]) {
  return useMemo(() => {
    if (!markers.length) return { project: () => ({ x: SIZE / 2, y: SIZE / 2 }), groups: [] as { name: string; x: number; y: number }[] };
    const lats = markers.map((m) => m.position.lat);
    const lngs = markers.map((m) => m.position.lng);
    let [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
    const span = Math.max(maxLat - minLat, maxLng - minLng, 0.02);
    const cLat = (minLat + maxLat) / 2;
    const cLng = (minLng + maxLng) / 2;
    minLat = cLat - span / 2;
    maxLat = cLat + span / 2;
    minLng = cLng - span / 2;
    maxLng = cLng + span / 2;
    const pad = 0.12;
    const project = (p: { lat: number; lng: number }) => ({
      x: SIZE * (pad + (1 - 2 * pad) * ((p.lng - minLng) / (maxLng - minLng))),
      y: SIZE * (pad + (1 - 2 * pad) * (1 - (p.lat - minLat) / (maxLat - minLat))),
    });
    const byGroup = new Map<string, { x: number; y: number; n: number }>();
    for (const m of markers) {
      if (!m.group) continue;
      const pt = project(m.position);
      const g = byGroup.get(m.group) ?? { x: 0, y: 0, n: 0 };
      byGroup.set(m.group, { x: g.x + pt.x, y: g.y + pt.y, n: g.n + 1 });
    }
    const groups = [...byGroup].map(([name, g]) => ({ name, x: g.x / g.n, y: g.y / g.n }));
    return { project, groups };
  }, [markers]);
}

export function SchematicMap({ markers, selectedId, highlightedId, onSelect, onHover, className, label }: MapViewProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const { project, groups } = useProjection(markers);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  const zoomBy = (factor: number) => setZoom((z) => clampZoom(z * factor));
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    setPan({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y });
  };
  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
  };
  // Native, non-passive listener so wheel-zoom can prevent page scroll.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 60;
    const map: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (e.target !== e.currentTarget) return;
    if (map[e.key]) {
      e.preventDefault();
      setPan((p) => ({ x: p.x + map[e.key][0], y: p.y + map[e.key][1] }));
    } else if (e.key === "+" || e.key === "=") zoomBy(1.3);
    else if (e.key === "-") zoomBy(1 / 1.3);
    else if (e.key === "0") reset();
  };

  const active = highlightedId ?? selectedId;

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-line bg-[#e8eef2]", className)}>
      <div
        ref={boxRef}
        role="application"
        aria-roledescription="map"
        aria-label={`${label}. Schematic view. Use arrow keys to pan and plus or minus to zoom; press Tab to move between hotels.`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="absolute inset-0 cursor-grab touch-none select-none focus-visible:outline-offset-[-3px] active:cursor-grabbing"
      >
        <div className="absolute inset-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: dragging ? "none" : "transform 200ms var(--ease-out-soft)" }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M50 0H0V50" fill="none" stroke="#cfdbe3" strokeWidth="1" />
              </pattern>
              <radialGradient id="land" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#f3efe7" />
                <stop offset="100%" stopColor="#e8eef2" />
              </radialGradient>
            </defs>
            <rect width={SIZE} height={SIZE} fill="url(#grid)" />
            {groups.map((g) => (
              <circle key={g.name} cx={g.x} cy={g.y} r={220} fill="url(#land)" opacity="0.9" />
            ))}
          </svg>
          {groups.map((g) => (
            <span key={g.name} className="pointer-events-none absolute -translate-x-1/2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink/40" style={{ left: `${(g.x / SIZE) * 100}%`, top: `${(g.y / SIZE) * 100 + 5}%`, transform: `translateX(-50%) scale(${1 / zoom})` }}>
              {g.name}
            </span>
          ))}
          {markers.map((m) => {
            const pt = project(m.position);
            const isActive = m.id === active;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect?.(m.id)}
                onMouseEnter={() => onHover?.(m.id)}
                onMouseLeave={() => onHover?.(null)}
                onFocus={() => onHover?.(m.id)}
                onBlur={() => onHover?.(null)}
                aria-label={`${m.title}, ${m.label}`}
                aria-pressed={m.id === selectedId}
                className={cn(
                  "absolute whitespace-nowrap rounded-md border px-2 py-1 text-[0.8125rem] font-semibold tabular-nums shadow-card transition-[background-color,color,transform] duration-150",
                  isActive ? "z-20 border-navy bg-navy text-white" : "z-10 border-line bg-surface text-ink hover:z-20 hover:border-navy",
                )}
                style={{ left: `${(pt.x / SIZE) * 100}%`, top: `${(pt.y / SIZE) * 100}%`, transform: `translate(-50%, -100%) scale(${(isActive ? 1.1 : 1) / zoom})`, transformOrigin: "bottom center" }}
              >
                {m.label}
                <span className={cn("absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r", isActive ? "border-navy bg-navy" : "border-line bg-surface")} aria-hidden />
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-card">
        <button type="button" onClick={() => zoomBy(1.4)} disabled={zoom >= MAX_ZOOM} className="inline-flex size-10 items-center justify-center text-ink hover:bg-sand disabled:opacity-40" aria-label="Zoom in">
          <Plus className="size-4" aria-hidden />
        </button>
        <span className="h-px bg-line" />
        <button type="button" onClick={() => zoomBy(1 / 1.4)} disabled={zoom <= MIN_ZOOM} className="inline-flex size-10 items-center justify-center text-ink hover:bg-sand disabled:opacity-40" aria-label="Zoom out">
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="h-px bg-line" />
        <button type="button" onClick={reset} className="inline-flex size-10 items-center justify-center text-ink hover:bg-sand" aria-label="Reset map view">
          <LocateFixed className="size-4" aria-hidden />
        </button>
      </div>
      <p className="absolute bottom-3 left-3 right-16 inline-flex max-w-fit items-center gap-1.5 rounded-md bg-surface/95 px-2.5 py-1.5 text-xs text-muted shadow-soft">
        <Info className="size-3.5 shrink-0" aria-hidden />
        Schematic view — locations are approximate. Live map coming soon.
      </p>
    </div>
  );
}
