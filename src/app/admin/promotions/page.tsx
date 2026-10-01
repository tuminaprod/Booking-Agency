import { formatDate } from "@/lib/format";
import { todayISO } from "@/lib/dates";
import { listPromotions } from "@/server/catalog";
import { AdminHeader, DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Promotions" };

export default function AdminPromotionsPage() {
  const today = todayISO();
  const rows = listPromotions();
  return (
    <div>
      <AdminHeader title="Promotions" description="Promo codes are validated server-side against type, dates, minimum spend and minimum nights." />
      <DataTable
        caption="Promotions"
        rows={rows}
        rowKey={(p) => p.id}
        columns={[
          { key: "code", label: "Code", primary: true, render: (p) => <code className="font-mono font-semibold tracking-wider text-gold-600">{p.code}</code> },
          { key: "title", label: "Offer", render: (p) => p.title },
          { key: "value", label: "Value", render: (p) => (p.type === "percent" ? `${p.value}%` : `$${p.value}`) },
          { key: "applies", label: "Applies to", render: (p) => p.appliesTo.join(", ") },
          { key: "valid", label: "Valid", render: (p) => `${formatDate(p.validFrom)} – ${formatDate(p.validTo)}` },
          { key: "uses", label: "Uses", className: "tabular-nums", render: (p) => p.usageCount.toLocaleString("en-US") },
          { key: "status", label: "Status", render: (p) => (p.active && today <= p.validTo ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Expired</Badge>) },
        ]}
      />
    </div>
  );
}
