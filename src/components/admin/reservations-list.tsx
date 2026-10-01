"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import type { Booking } from "@/lib/models";
import { formatDateShort, formatMoney } from "@/lib/format";
import { DataTable } from "./data-table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const TONE = { confirmed: "success", pending: "warning", cancelled: "danger", completed: "neutral" } as const;

export function ReservationsList({ bookings }: { bookings: Booking[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return bookings
      .filter((b) => !t || `${b.reference} ${b.leadGuest.firstName} ${b.leadGuest.lastName} ${b.leadGuest.email} ${b.item.title}`.toLowerCase().includes(t))
      .filter((b) => !status || b.status === status)
      .filter((b) => !type || b.type === type)
      .filter((b) => (!from || b.startDate >= from) && (!to || b.startDate <= to))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [bookings, q, status, type, from, to]);

  const reset = () => {
    setQ("");
    setStatus("");
    setType("");
    setFrom("");
    setTo("");
  };

  return (
    <div>
      <div className="mb-5 grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5" role="search" aria-label="Filter reservations">
        <label className="lg:col-span-2">
          <span className="mb-1 block text-xs font-medium text-muted">Search</span>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Reference, guest, email or property" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-muted">Status</span>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-muted">Type</span>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            <option value="hotel">Hotels</option>
            <option value="trip">Trips</option>
            <option value="experience">Experiences</option>
          </Select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="mb-1 block text-xs font-medium text-muted">From</span>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-muted">To</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-2 text-sm" />
          </label>
        </div>
      </div>
      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {rows.length} of {bookings.length} reservations
      </p>
      <DataTable
        caption="Reservations"
        rows={rows}
        rowKey={(b) => b.reference}
        empty={<EmptyState icon={<SearchX className="size-6" aria-hidden />} title="No reservations match" description="Try a different search or clear the filters." action={<Button onClick={reset}>Clear filters</Button>} />}
        columns={[
          { key: "ref", label: "Reference", primary: true, render: (b) => <Link href={`/admin/reservations/${b.reference}`} className="font-mono font-semibold text-navy hover:underline">{b.reference}</Link> },
          { key: "guest", label: "Customer", render: (b) => <span>{b.leadGuest.firstName} {b.leadGuest.lastName}<span className="block text-xs text-muted">{b.leadGuest.email}</span></span> },
          { key: "item", label: "Booking", render: (b) => <span className="line-clamp-2">{b.item.title}<span className="block text-xs capitalize text-muted">{b.type}</span></span> },
          { key: "dates", label: "Start", render: (b) => formatDateShort(b.startDate) },
          { key: "total", label: "Total", className: "text-right tabular-nums", render: (b) => formatMoney(b.price.total, "USD", { cents: true }) },
          { key: "pay", label: "Payment", render: (b) => <span className="capitalize">{b.payment.status.replace("-", " ")}</span> },
          { key: "status", label: "Status", render: (b) => <Badge tone={TONE[b.status]}>{b.status}</Badge> },
        ]}
      />
    </div>
  );
}
