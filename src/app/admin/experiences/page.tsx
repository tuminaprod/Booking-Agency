import Link from "next/link";
import { EXPERIENCE_CATEGORIES } from "@/lib/data/catalog";
import { formatDuration, formatMoney } from "@/lib/format";
import { destinationName, listExperiences } from "@/server/catalog";
import { AdminHeader, DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Experiences" };

export default function AdminExperiencesPage() {
  const rows = listExperiences();
  return (
    <div>
      <AdminHeader title="Experiences" description={`${rows.length} experiences`} />
      <DataTable
        caption="Experiences"
        rows={rows}
        rowKey={(e) => e.id}
        columns={[
          { key: "title", label: "Experience", primary: true, render: (e) => <Link href={`/experiences/${e.slug}`} className="font-medium text-navy hover:underline">{e.title}</Link> },
          { key: "dest", label: "Destination", render: (e) => destinationName(e.destinationId) },
          { key: "cat", label: "Category", render: (e) => EXPERIENCE_CATEGORIES.find((c) => c.id === e.category)?.label },
          { key: "dur", label: "Duration", render: (e) => formatDuration(e.durationHours) },
          { key: "slots", label: "Time slots", render: (e) => e.timeSlots.join(", ") },
          { key: "rating", label: "Rating", render: (e) => e.rating.toFixed(1) },
          { key: "price", label: "From / person", className: "text-right tabular-nums", render: (e) => formatMoney(e.priceFrom) },
        ]}
      />
    </div>
  );
}
