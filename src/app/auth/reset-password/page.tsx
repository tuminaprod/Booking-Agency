import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { ResetPasswordForm } from "@/components/auth/forms";

export const metadata = buildMetadata({ title: "Reset password", description: "Choose a new Oriel password.", path: "/auth/reset-password", noIndex: true });

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
