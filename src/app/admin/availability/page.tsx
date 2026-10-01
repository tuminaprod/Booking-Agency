import Link from "next/link";
import { addDays, todayISO } from "@/lib/dates";
import { formatDateShort } from "@/lib/format";
import { roomAvailability } from "@/lib/booking/availability";
import { cn } from "@/lib/cn";
import { listHotels } from "@/server/catalog";
import { AdminHeader } from "@/components/admin/data-table";

export const metadata = { title: "Availability" };

export default function AdminAvailabilityPage() {
  const today = todayISO();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const hotels = listHotels();
  return (
    <div>
      <AdminHeader title="Availability" description="Occupancy for the next 14 nights. Open a hotel to edit rates and close dates." />
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[56rem] border-collapse text-xs">
          <caption className="sr-only">Occupancy by hotel and night</caption>
          <thead>
            <tr className="bg-sand/60">
              <th scope="col" className="sticky left-0 bg-sand px-3 py-2 text-left font-semibold text-muted">
                Hotel
              </th>
              {days.map((d) => (
                <th key={d} scope="col" className="px-1 py-2 font-semibold text-muted">
                  {formatDateShort(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hotels.map((h) => {
              const inventory = h.rooms.reduce((n, r) => n + r.inventory, 0);
              return (
                <tr key={h.id} className="border-t border-line">
                  <th scope="row" className="sticky left-0 bg-surface px-3 py-2 text-left font-medium">
                    <Link href={`/admin/hotels/${h.id}`} className="text-navy hover:underline">
                      {h.name}
                    </Link>
                  </th>
                  {days.map((d) => {
                    const free = h.rooms.reduce((n, r) => n + roomAvailability(h, r, d).available, 0);
                    const occ = Math.round(((inventory - free) / inventory) * 100);
                    return (
                      <td key={d} className="p-0.5 text-center">
                        <span className={cn("block rounded-sm py-1.5 tabular-nums", occ >= 90 ? "bg-danger-tint text-danger" : occ >= 60 ? "bg-warning-tint text-warning" : "bg-success-tint text-success")} title={`${free} of ${inventory} units free`}>
                          {occ}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Green under 60% · amber 60–89% · red 90%+ occupancy. Percentages are shown as text, not by colour alone.</p>
    </div>
  );
}
