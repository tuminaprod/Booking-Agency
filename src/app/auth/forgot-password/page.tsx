import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata = buildMetadata({ title: "Forgot password", description: "Reset your Oriel password.", path: "/auth/forgot-password", noIndex: true });

export default function Page() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
