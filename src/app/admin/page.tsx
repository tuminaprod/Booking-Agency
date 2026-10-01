import Link from "next/link";
import { ArrowUpRight, BedDouble, CalendarCheck, CircleDollarSign, MessageSquareWarning, XCircle } from "lucide-react";
import { addDays, todayISO } from "@/lib/dates";
import { formatDateShort, formatMoney } from "@/lib/format";
import { demoBookings } from "@/server/demo-bookings";
import { listHotels, listReviews } from "@/server/catalog";
import { AdminHeader, DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };

const TONE = { confirmed: "success", pending: "warning", cancelled: "danger", completed: "neutral" } as const;

export default function AdminDashboard() {
  const bookings = demoBookings();
  const today = todayISO();
  const active = bookings.filter((b) => b.status !== "cancelled");
  const revenue = active.reduce((s, b) => s + b.payment.amount - b.payment.refundedAmount, 0);
  const arrivals = bookings.filter((b) => b.status === "confirmed" && b.startDate >= today && b.startDate <= addDays(today, 14));
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const pendingReviews = listReviews().filter((r) => r.status !== "published").length;
  const byType = (["hotel", "trip", "experience"] as const).map((t) => ({ t, n: bookings.filter((b) => b.type === t).length }));
  const max = Math.max(...byType.map((x) => x.n), 1);
  const recent = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const kpis = [
    { label: "Net revenue", value: formatMoney(revenue), icon: CircleDollarSign, hint: "Paid minus refunds" },
    { label: "Arrivals · next 14 days", value: String(arrivals.length), icon: CalendarCheck, hint: "Confirmed check-ins" },
    { label: "Live properties", value: String(listHotels().length), icon: BedDouble, hint: `${listHotels().reduce((n, h) => n + h.rooms.length, 0)} room types` },
    { label: "Cancellations", value: String(cancelled), icon: XCircle, hint: `${Math.round((cancelled / bookings.length) * 100)}% of bookings` },
    { label: "Reviews to moderate", value: String(pendingReviews), icon: MessageSquareWarning, hint: "Pending or flagged" },
  ];

  return (
    <div>
      <AdminHeader title="Dashboard" description={`Overview for ${formatDateShort(today)}`} action={<ButtonLink href="/admin/hotels/new">Add hotel</ButtonLink>} />
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(({ label, value, icon: Icon, hint }) => (
          <div key={label} className="rounded-lg border border-line bg-surface p-5">
            <Icon className="size-5 text-gold" aria-hidden />
            <dt className="mt-3 text-sm text-muted">{label}</dt>
            <dd className="text-2xl font-semibold tabular-nums text-ink">{value}</dd>
            <dd className="text-xs text-muted">{hint}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section aria-labelledby="recent-res">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent-res" className="font-semibold text-ink">
              Latest reservations
            </h2>
            <Link href="/admin/reservations" className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline">
              View all <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <DataTable
            caption="Latest reservations"
            rows={recent}
            rowKey={(b) => b.reference}
            columns={[
              { key: "ref", label: "Reference", primary: true, render: (b) => <Link href={`/admin/reservations/${b.reference}`} className="font-mono font-semibold text-navy hover:underline">{b.reference}</Link> },
              { key: "guest", label: "Guest", render: (b) => `${b.leadGuest.firstName} ${b.leadGuest.lastName}` },
              { key: "item", label: "Booking", render: (b) => <span className="line-clamp-1">{b.item.title}</span> },
              { key: "dates", label: "Dates", render: (b) => formatDateShort(b.startDate) },
              { key: "total", label: "Total", className: "text-right tabular-nums", render: (b) => formatMoney(b.price.total) },
              { key: "status", label: "Status", render: (b) => <Badge tone={TONE[b.status]}>{b.status}</Badge> },
            ]}
          />
        </section>
        <section className="rounded-lg border border-line bg-surface p-5" aria-labelledby="mix">
          <h2 id="mix" className="font-semibold text-ink">
            Booking mix
          </h2>
          <ul className="mt-4 space-y-4">
            {byType.map(({ t, n }) => (
              <li key={t}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize text-ink-soft">{t}s</span>
                  <span className="font-semibold tabular-nums">{n}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand" aria-hidden>
                  <div className="h-full rounded-full bg-navy" style={{ width: `${(n / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 font-semibold text-ink">Upcoming arrivals</h3>
          <ul className="mt-3 divide-y divide-line text-sm">
            {arrivals.slice(0, 5).map((b) => (
              <li key={b.reference} className="flex justify-between gap-3 py-2">
                <span className="truncate">{b.item.title}</span>
                <span className="shrink-0 text-muted">{formatDateShort(b.startDate)}</span>
              </li>
            ))}
            {!arrivals.length && <li className="py-2 text-muted">No arrivals in the next two weeks.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
