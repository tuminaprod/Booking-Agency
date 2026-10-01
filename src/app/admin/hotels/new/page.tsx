import { listDestinations } from "@/server/catalog";
import { HotelEditor } from "@/components/admin/hotel-editor";

export const metadata = { title: "Add hotel" };

export default function NewHotelPage() {
  return <HotelEditor destinations={listDestinations()} />;
}
