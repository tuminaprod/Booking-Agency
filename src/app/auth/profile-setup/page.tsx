import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { ProfileSetupForm } from "@/components/auth/forms";

export const metadata = buildMetadata({ title: "Set up your profile", description: "Personalise your Oriel account.", path: "/auth/profile-setup", noIndex: true });

export default function Page() {
  return (
    <Suspense>
      <ProfileSetupForm />
    </Suspense>
  );
}
