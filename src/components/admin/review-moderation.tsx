"use client";

import { useState } from "react";
import type { Review } from "@/lib/models";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

const TONE = { published: "success", pending: "warning", flagged: "danger" } as const;

export function ReviewModeration({ reviews, names }: { reviews: Review[]; names: Record<string, string> }) {
  const toast = useToast();
  const [items, setItems] = useState(reviews);
  const [filter, setFilter] = useState<"all" | Review["status"]>("pending");
  const shown = items.filter((r) => filter === "all" || r.status === filter).slice(0, 40);
  const setStatus = (id: string, status: Review["status"]) => {
    setItems((xs) => xs.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(status === "published" ? "Review published" : status === "flagged" ? "Review flagged for investigation" : "Review moved to pending");
  };
  return (
    <div>
      <label className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-muted">Show</span>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="h-10 w-auto">
          <option value="pending">Pending ({items.filter((r) => r.status === "pending").length})</option>
          <option value="flagged">Flagged ({items.filter((r) => r.status === "flagged").length})</option>
          <option value="published">Published</option>
          <option value="all">All</option>
        </Select>
      </label>
      {shown.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-muted">Nothing to moderate here — all caught up.</p>
      ) : (
        <ul className="grid gap-3">
          {shown.map((r) => (
            <li key={r.id} className="rounded-lg border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">“{r.title}”</p>
                  <p className="text-sm text-muted">
                    {r.author} · {r.country} · {formatDate(r.date)} · {names[r.entityId] ?? r.entityId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-navy px-2 py-0.5 text-sm font-semibold tabular-nums text-white">{r.rating.toFixed(1)}</span>
                  <Badge tone={TONE[r.status]}>{r.status}</Badge>
                </div>
              </div>
              <p className="mt-2 text-[0.9375rem] text-ink-soft">{r.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status !== "published" && (
                  <Button size="sm" onClick={() => setStatus(r.id, "published")}>
                    Publish
                  </Button>
                )}
                {r.status !== "flagged" && (
                  <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, "flagged")}>
                    Flag
                  </Button>
                )}
                {r.status !== "pending" && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "pending")}>
                    Move to pending
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
