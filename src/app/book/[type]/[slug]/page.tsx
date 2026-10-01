import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { BookableType } from "@/lib/models";
import { isValidISODate } from "@/lib/dates";
import { buildMetadata } from "@/lib/seo";
import { resolveBookable } from "@/server/bookings";
import { CheckoutFlow } from "@/components/booking/checkout-flow";

type Props = { params: Promise<{ type: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = buildMetadata({ title: "Secure checkout", description: "Complete your Oriel booking.", path: "/book", noIndex: true });

const int = (v: unknown, fallback: number, min: number, max: number) => {
  const n = Number(v);
  return typeof v === "string" && Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const date = (v: unknown) => (typeof v === "string" && isValidISODate(v) ? v : undefined);

export default async function BookPage({ params, searchParams }: Props) {
  const { type, slug } = await params;
  if (!["hotel", "trip", "experience"].includes(type)) notFound();
  const resolved = resolveBookable(type as BookableType, slug);
  if (!resolved) notFound();
  const sp = await searchParams;

  const initial = {
    roomId: typeof sp.room === "string" ? sp.room : undefined,
    startDate: date(sp.checkIn) ?? date(sp.date),
    endDate: date(sp.checkOut),
    adults: int(sp.adults, 2, 1, 16),
    children: int(sp.children, 0, 0, 10),
    rooms: int(sp.rooms, 1, 1, 8),
    departureId: typeof sp.departure === "string" ? sp.departure : undefined,
    timeSlot: typeof sp.slot === "string" ? sp.slot : undefined,
  };

  return (
    <Suspense>
      <CheckoutFlow bookable={resolved.bookable} destinationName={resolved.destination} initial={initial} />
    </Suspense>
  );
}
