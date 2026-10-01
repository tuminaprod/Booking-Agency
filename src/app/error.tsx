"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/feedback";
import { Button, ButtonLink } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Report to monitoring in production
    console.error(error);
  }, [error]);
  return (
    <div className="container-page max-w-2xl py-16">
      <ErrorState
        title="Something went wrong on our side"
        description={
          <>
            We couldn&apos;t load this page. Your bookings and saved items are safe.
            {error.digest && <span className="mt-2 block text-xs">Reference: {error.digest}</span>}
          </>
        }
        action={
          <>
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/" variant="secondary">
              Go to home
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
