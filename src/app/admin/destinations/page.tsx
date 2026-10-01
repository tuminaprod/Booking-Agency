import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { destinationStats, listDestinations } from "@/server/catalog";
import { AdminHeader, DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Destinations" };

export default function AdminDestinationsPage() {
  const rows = listDestinations().map((d) => ({ ...d, stats: destinationStats(d.id) }));
  return (
    <div>
      <AdminHeader title="Destinations" description={`${rows.length} destinations`} />
      <DataTable
        caption="Destinations"
        rows={rows}
        rowKey={(d) => d.id}
        columns={[
          { key: "name", label: "Destination", primary: true, render: (d) => <Link href={`/destinations/${d.slug}`} className="font-medium text-navy hover:underline">{d.name}</Link> },
          { key: "country", label: "Country", render: (d) => d.country },
          { key: "region", label: "Region", render: (d) => d.continent },
          { key: "pop", label: "Popularity", render: (d) => `${d.popularity}%` },
          { key: "hotels", label: "Hotels", render: (d) => d.stats.hotelCount },
          { key: "exp", label: "Experiences", render: (d) => d.stats.experienceCount },
          { key: "from", label: "Hotels from", className: "text-right tabular-nums", render: (d) => (d.stats.startingHotelPrice ? formatMoney(d.stats.startingHotelPrice) : "—") },
        ]}
      />
    </div>
  );
}
