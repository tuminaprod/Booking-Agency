import { notFound } from "next/navigation";
import { CUSTOMERS } from "@/lib/data/users";
import { getDemoBooking } from "@/server/demo-bookings";
import { ReservationDetail } from "@/components/admin/reservation-detail";

type Props = { params: Promise<{ reference: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: `Reservation ${(await params).reference}` };
}

export default async function AdminReservationPage({ params }: Props) {
  const booking = getDemoBooking((await params).reference.toUpperCase());
  if (!booking) notFound();
  const customer = CUSTOMERS.find((c) => c.id === booking.userId);
  return <ReservationDetail booking={booking} customerSince={customer?.createdAt} />;
}
