import Link from "next/link";
import { TRIP_CATEGORY_LABEL } from "@/lib/data/catalog";
import { formatMoney } from "@/lib/format";
import { destinationName, listTrips } from "@/server/catalog";
import { AdminHeader, DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Trips" };

export default function AdminTripsPage() {
  const rows = listTrips();
  return (
    <div>
      <AdminHeader title="Trips" description={`${rows.length} itineraries`} />
      <DataTable
        caption="Trips"
        rows={rows}
        rowKey={(t) => t.id}
        columns={[
          { key: "title", label: "Trip", primary: true, render: (t) => <Link href={`/trips/${t.slug}`} className="font-medium text-navy hover:underline">{t.title}</Link> },
          { key: "dest", label: "Destination", render: (t) => destinationName(t.destinationId) },
          { key: "cat", label: "Category", render: (t) => TRIP_CATEGORY_LABEL[t.category] },
          { key: "days", label: "Days", render: (t) => t.durationDays },
          { key: "deps", label: "Departures", render: (t) => t.departures.length },
          { key: "seats", label: "Seats left", render: (t) => t.departures.reduce((n, d) => n + d.seatsLeft, 0) },
          { key: "price", label: "From / person", className: "text-right tabular-nums", render: (t) => formatMoney(t.priceFrom) },
        ]}
      />
    </div>
  );
}
