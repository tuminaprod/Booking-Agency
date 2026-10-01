import { buildMetadata } from "@/lib/seo";
import { getDemoBooking } from "@/server/demo-bookings";
import { BookingView } from "@/components/booking/booking-view";

type Props = { params: Promise<{ reference: string }>; searchParams: Promise<{ new?: string }> };

export async function generateMetadata({ params }: Props) {
  const { reference } = await params;
  return buildMetadata({ title: `Booking ${reference}`, description: "Your Oriel booking details.", path: `/booking/${reference}`, noIndex: true });
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { reference } = await params;
  const { new: isNew } = await searchParams;
  // Seeded demo bookings come from the server; bookings made in this browser come from local storage.
  return <BookingView reference={reference.toUpperCase()} seed={getDemoBooking(reference.toUpperCase())} isNew={isNew === "1"} />;
}
