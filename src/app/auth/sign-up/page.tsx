import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { SignUpForm } from "@/components/auth/forms";

export const metadata = buildMetadata({ title: "Create an account", description: "Join Oriel to save favourites and book faster.", path: "/auth/sign-up", noIndex: true });

export default function Page() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
