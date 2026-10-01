"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = z.string().email().safeParse(email.trim()).success;
    if (!ok) return setError("Enter a valid email address, like name@example.com");
    setError(undefined);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setEmail("");
    toast.success("You're on the list", "Look out for our next travel notes.");
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <Field label="Email address" error={error} className="flex-1" labelClassName="sr-only">
        {({ id, describedBy, invalid }) => (
          <Input id={id} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
        )}
      </Field>
      <Button type="submit" loading={loading} loadingText="Subscribing…" className="sm:w-40">
        Subscribe
      </Button>
    </form>
  );
}
