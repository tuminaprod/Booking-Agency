import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { demoBookings } from "@/server/demo-bookings";
import { AdminHeader, DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Payments" };

const TONE = { paid: "success", authorized: "info", pending: "warning", failed: "danger", refunded: "neutral", "partially-refunded": "warning" } as const;

export default function AdminPaymentsPage() {
  const rows = demoBookings().map((b) => ({ ...b.payment, ref: b.reference, guest: `${b.leadGuest.firstName} ${b.leadGuest.lastName}` }));
  const captured = rows.reduce((s, p) => s + p.amount, 0);
  const refunded = rows.reduce((s, p) => s + p.refundedAmount, 0);
  return (
    <div>
      <AdminHeader title="Payments" description={`${formatMoney(captured)} captured · ${formatMoney(refunded)} refunded`} />
      <DataTable
        caption="Payments"
        rows={rows}
        rowKey={(p) => p.id}
        columns={[
          { key: "id", label: "Transaction", primary: true, render: (p) => <span className="font-mono text-xs">{p.id}</span> },
          { key: "ref", label: "Booking", render: (p) => <Link href={`/admin/reservations/${p.ref}`} className="font-mono text-navy hover:underline">{p.ref}</Link> },
          { key: "guest", label: "Customer", render: (p) => p.guest },
          { key: "card", label: "Method", render: (p) => <span className="uppercase">{p.cardBrand} •••• {p.last4}</span> },
          { key: "date", label: "Date", render: (p) => new Date(p.createdAt).toLocaleDateString("en-GB") },
          { key: "amount", label: "Amount", className: "text-right tabular-nums", render: (p) => formatMoney(p.amount, "USD", { cents: true }) },
          { key: "refund", label: "Refunded", className: "text-right tabular-nums", render: (p) => (p.refundedAmount ? formatMoney(p.refundedAmount, "USD", { cents: true }) : "—") },
          { key: "status", label: "Status", render: (p) => <Badge tone={TONE[p.status]}>{p.status.replace("-", " ")}</Badge> },
        ]}
      />
    </div>
  );
}
