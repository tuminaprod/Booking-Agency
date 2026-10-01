import { demoBookings } from "@/server/demo-bookings";
import { AdminHeader } from "@/components/admin/data-table";
import { ReservationsList } from "@/components/admin/reservations-list";

export const metadata = { title: "Reservations" };

export default function AdminReservationsPage() {
  return (
    <div>
      <AdminHeader title="Reservations" description="Search, filter and manage every booking." />
      <ReservationsList bookings={demoBookings()} />
    </div>
  );
}
