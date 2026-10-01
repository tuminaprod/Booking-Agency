import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { listHotels } from "@/server/catalog";
import { bedsLabel } from "@/server/hotel-search";
import { AdminHeader, DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Rooms" };

export default function AdminRoomsPage() {
  const rows = listHotels().flatMap((h) => h.rooms.map((r) => ({ ...r, hotelName: h.name })));
  return (
    <div>
      <AdminHeader title="Rooms" description={`${rows.length} room types across all properties. Edit rooms from each hotel.`} />
      <DataTable
        caption="Room types"
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { key: "name", label: "Room", primary: true, render: (r) => <span className="font-medium">{r.name}</span> },
          { key: "hotel", label: "Hotel", render: (r) => <Link href={`/admin/hotels/${r.hotelId}`} className="text-navy hover:underline">{r.hotelName}</Link> },
          { key: "beds", label: "Beds", render: (r) => bedsLabel(r) },
          { key: "occ", label: "Sleeps", render: (r) => r.maxAdults + r.maxChildren },
          { key: "inv", label: "Units", render: (r) => r.inventory },
          { key: "cancel", label: "Cancellation", render: (r) => <span className="capitalize">{r.cancellation.type.replace("-", " ")}</span> },
          { key: "price", label: "Base rate", className: "text-right tabular-nums", render: (r) => formatMoney(r.basePrice) },
        ]}
      />
    </div>
  );
}
