import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { VerifyEmailForm } from "@/components/auth/forms";

export const metadata = buildMetadata({ title: "Verify your email", description: "Confirm your email address.", path: "/auth/verify-email", noIndex: true });

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
