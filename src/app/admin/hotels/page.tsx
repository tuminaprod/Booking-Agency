import Image from "next/image";
import Link from "next/link";
import { PROPERTY_TYPE_LABEL } from "@/lib/data/catalog";
import { formatMoney } from "@/lib/format";
import { destinationName, hotelStartingPrice, listHotels } from "@/server/catalog";
import { AdminHeader, DataTable } from "@/components/admin/data-table";
import { ButtonLink } from "@/components/ui/button";
import { Stars } from "@/components/ui/rating";

export const metadata = { title: "Hotels" };

export default function AdminHotelsPage() {
  const hotels = listHotels();
  return (
    <div>
      <AdminHeader title="Hotels" description={`${hotels.length} properties`} action={<ButtonLink href="/admin/hotels/new">Add hotel</ButtonLink>} />
      <DataTable
        caption="Hotels"
        rows={hotels}
        rowKey={(h) => h.id}
        columns={[
          {
            key: "name",
            label: "Property",
            primary: true,
            render: (h) => (
              <Link href={`/admin/hotels/${h.id}`} className="flex items-center gap-3 hover:underline">
                <span className="relative hidden size-10 shrink-0 overflow-hidden rounded-md bg-sand sm:block">
                  <Image src={h.images[0].src} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <span className="font-semibold text-ink">{h.name}</span>
              </Link>
            ),
          },
          { key: "dest", label: "Destination", render: (h) => destinationName(h.destinationId) },
          { key: "type", label: "Type", render: (h) => PROPERTY_TYPE_LABEL[h.propertyType] },
          { key: "stars", label: "Stars", render: (h) => <Stars count={h.stars} /> },
          { key: "rooms", label: "Room types", render: (h) => h.rooms.length },
          { key: "from", label: "From", className: "text-right tabular-nums", render: (h) => formatMoney(hotelStartingPrice(h)) },
          { key: "rating", label: "Rating", className: "tabular-nums", render: (h) => h.rating.toFixed(1) },
        ]}
        actions={(h) => (
          <ButtonLink href={`/admin/hotels/${h.id}`} size="sm" variant="secondary">
            Edit
          </ButtonLink>
        )}
      />
    </div>
  );
}
