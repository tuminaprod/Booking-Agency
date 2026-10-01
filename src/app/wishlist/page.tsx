import { buildMetadata } from "@/lib/seo";
import { WishlistView } from "@/components/wishlist/wishlist-view";

export const metadata = buildMetadata({ title: "Your wishlist", description: "Saved hotels, destinations, trips and experiences.", path: "/wishlist", noIndex: true });

export default function WishlistPage() {
  return (
    <div className="container-page pb-24 pt-10">
      <p className="eyebrow">Saved for later</p>
      <h1 className="mt-2 font-display text-5xl text-ink">Wishlist</h1>
      <p className="mb-8 mt-2 text-muted">Saved on this device. Sign in to keep your wishlist in sync across devices.</p>
      <WishlistView />
    </div>
  );
}
