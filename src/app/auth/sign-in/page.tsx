import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { SignInForm } from "@/components/auth/forms";

export const metadata = buildMetadata({ title: "Sign in", description: "Sign in to manage your Oriel trips and saved places.", path: "/auth/sign-in", noIndex: true });

export default function Page() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
