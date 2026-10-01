import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { bookingsForUser } from "@/server/demo-bookings";
import { AccountView } from "@/components/account/account-view";

export const metadata = buildMetadata({ title: "My account", description: "Your trips, saved places and account settings.", path: "/account", noIndex: true });

export default function AccountPage() {
  return (
    <div className="container-page pb-24 pt-10">
      <h1 className="mb-8 font-display text-5xl text-ink">My account</h1>
      <Suspense>
        {/* Demo bookings belong to the fictional demo traveller; they're only shown when that account is signed in. */}
        <AccountView demoBookings={bookingsForUser("usr-demo")} />
      </Suspense>
    </div>
  );
}
