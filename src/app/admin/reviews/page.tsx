import { listExperiences, listHotels, listReviews, listTrips } from "@/server/catalog";
import { AdminHeader } from "@/components/admin/data-table";
import { ReviewModeration } from "@/components/admin/review-moderation";

export const metadata = { title: "Reviews" };

export default function AdminReviewsPage() {
  const names = Object.fromEntries([...listHotels().map((h) => [h.id, h.name]), ...listTrips().map((t) => [t.id, t.title]), ...listExperiences().map((e) => [e.id, e.title])]);
  return (
    <div>
      <AdminHeader title="Reviews" description="Moderate guest reviews before they appear on listings." />
      <ReviewModeration reviews={listReviews()} names={names} />
    </div>
  );
}
