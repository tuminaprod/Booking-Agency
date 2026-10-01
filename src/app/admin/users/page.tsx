import { CUSTOMERS } from "@/lib/data/users";
import { formatMoney } from "@/lib/format";
import { demoBookings } from "@/server/demo-bookings";
import { AdminHeader, DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Users" };

export default function AdminUsersPage() {
  const bookings = demoBookings();
  const rows = CUSTOMERS.map((c) => {
    const mine = bookings.filter((b) => b.userId === c.id);
    return { ...c, count: mine.length, spend: mine.reduce((s, b) => s + b.payment.amount - b.payment.refundedAmount, 0) };
  });
  return (
    <div>
      <AdminHeader title="Users" description={`${rows.length} customers`} />
      <DataTable
        caption="Users"
        rows={rows}
        rowKey={(u) => u.id}
        columns={[
          { key: "name", label: "Name", primary: true, render: (u) => <span className="font-medium">{u.firstName} {u.lastName}</span> },
          { key: "email", label: "Email", render: (u) => <span className="break-all">{u.email}</span> },
          { key: "country", label: "Country", render: (u) => u.country },
          { key: "since", label: "Joined", render: (u) => new Date(u.createdAt).toLocaleDateString("en-GB") },
          { key: "bookings", label: "Bookings", render: (u) => u.count },
          { key: "spend", label: "Lifetime value", className: "text-right tabular-nums", render: (u) => formatMoney(u.spend) },
        ]}
      />
    </div>
  );
}
