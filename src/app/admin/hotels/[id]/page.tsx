import { notFound } from "next/navigation";
import { getHotelById, listDestinations } from "@/server/catalog";
import { HotelEditor } from "@/components/admin/hotel-editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: getHotelById((await params).id)?.name ?? "Hotel" };
}

export default async function EditHotelPage({ params }: Props) {
  const hotel = getHotelById((await params).id);
  if (!hotel) notFound();
  return <HotelEditor hotel={hotel} destinations={listDestinations()} />;
}
