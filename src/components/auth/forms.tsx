"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { MailCheck, ShieldCheck } from "lucide-react";
import type { CurrencyCode, TravelCategory } from "@/lib/models";
import { auth, useSession, usePendingVerification } from "@/lib/auth";
import { DEMO_ADMIN_CREDENTIALS, DEMO_CREDENTIALS } from "@/lib/data/users";
import { COUNTRIES } from "@/lib/data/countries";
import { TRAVEL_CATEGORIES } from "@/lib/data/catalog";
import { CURRENCIES } from "@/lib/format";
import { preferencesStore } from "@/lib/stores";
import { Alert } from "@/components/ui/feedback";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Switch } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { AuthHeader, PasswordField, passwordValid, safeNext } from "./auth-parts";

const emailOk = (e: string) => z.string().email().safeParse(e.trim()).success;

/* ------------------------------------------------------------------ */

export function SignInForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const next = safeNext(sp.get("next"));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!emailOk(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Enter your password";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    const r = await auth.signIn(email, password);
    setLoading(false);
    if (!r.ok) return setErrors({ form: r.error });
    toast.success(`Welcome back, ${r.user.firstName}`);
    router.push(r.user.role === "admin" && !sp.get("next") ? "/admin" : next);
  };

  return (
    <>
      <AuthHeader eyebrow="Welcome back" title="Sign in" description="Access your trips, saved places and faster checkout." />
      {errors.form && (
        <Alert tone="danger" className="mb-5">
          {errors.form}
        </Alert>
      )}
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Email" error={errors.email}>
          {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        <div>
          <PasswordField value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
          <div className="mt-2 text-right">
            <Link href="/auth/forgot-password" className="text-sm font-medium text-navy hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading} loadingText="Signing in…">
          Sign in
        </Button>
      </form>
      <div className="mt-6 rounded-lg border border-dashed border-line-strong bg-surface p-4">
        <p className="text-sm font-medium text-ink">Exploring the demo?</p>
        <p className="mt-0.5 text-[0.8125rem] text-muted">Fill in a fictional demo account with sample bookings.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setEmail(DEMO_CREDENTIALS.email); setPassword(DEMO_CREDENTIALS.password); setErrors({}); }}>
            Use demo traveller
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setEmail(DEMO_ADMIN_CREDENTIALS.email); setPassword(DEMO_ADMIN_CREDENTIALS.password); setErrors({}); }}>
            Use demo admin
          </Button>
        </div>
      </div>
      <p className="mt-8 text-center text-[0.9375rem] text-muted">
        New to Oriel?{" "}
        <Link href={`/auth/sign-up${sp.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-navy hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function SignUpForm() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "Enter your first name";
    if (!form.lastName.trim()) errs.lastName = "Enter your last name";
    if (!emailOk(form.email)) errs.email = "Enter a valid email address, like name@example.com";
    if (!passwordValid(form.password)) errs.password = "Your password doesn't meet all the requirements yet";
    if (!terms) errs.terms = "Please accept the terms to create an account";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    const r = await auth.signUp(form);
    setLoading(false);
    if (!r.ok) return setErrors({ [r.field ?? "form"]: r.error });
    router.push("/auth/verify-email");
  };

  return (
    <>
      <AuthHeader eyebrow="Join Oriel" title="Create your account" description="Save favourites, manage bookings and check out in seconds." />
      {errors.form && <Alert tone="danger" className="mb-5">{errors.form}</Alert>}
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" error={errors.firstName}>
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="given-name" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} />}
          </Field>
          <Field label="Last name" error={errors.lastName}>
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="family-name" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} />}
          </Field>
        </div>
        <Field label="Email" error={errors.email}>
          {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />}
        </Field>
        <PasswordField value={form.password} onChange={set("password")} error={errors.password} autoComplete="new-password" showRules />
        <div>
          <Checkbox
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            aria-invalid={errors.terms ? true : undefined}
            label={
              <>
                I agree to the <Link href="/help#terms" className="font-medium text-navy underline">terms</Link> and <Link href="/help#privacy" className="font-medium text-navy underline">privacy policy</Link>.
              </>
            }
          />
          {errors.terms && <p role="alert" className="ml-8 text-[0.8125rem] font-medium text-danger">{errors.terms}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading} loadingText="Creating account…">
          Create account
        </Button>
      </form>
      <p className="mt-8 text-center text-[0.9375rem] text-muted">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-navy hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<{ token?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailOk(email)) return setError("Enter the email address you signed up with");
    setError(undefined);
    setLoading(true);
    const r = await auth.requestPasswordReset(email);
    setLoading(false);
    setSent({ token: r.demoResetToken });
  };

  if (sent) {
    return (
      <>
        <AuthHeader title="Check your email" description={<>If an account exists for <strong className="font-semibold text-ink">{email}</strong>, we&apos;ve sent a link to reset your password. It expires in 30 minutes.</>} />
        <MailCheck className="mb-6 size-12 text-gold" aria-hidden />
        {sent.token && (
          <Alert tone="info" title="Demo mode" className="mb-6" action={<ButtonLink href={`/auth/reset-password?token=${sent.token}`} size="sm">Open reset link</ButtonLink>}>
            No emails are sent in this demo. Use the button to open the reset link we would have emailed.
          </Alert>
        )}
        <Button variant="secondary" onClick={() => setSent(null)}>
          Use a different email
        </Button>
      </>
    );
  }
  return (
    <>
      <AuthHeader title="Forgot your password?" description="Enter your email and we'll send you a secure link to choose a new one." />
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Email" error={error}>
          {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading} loadingText="Sending…">
          Send reset link
        </Button>
      </form>
      <p className="mt-8 text-center text-[0.9375rem]">
        <Link href="/auth/sign-in" className="font-semibold text-navy hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function ResetPasswordForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const token = sp.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <>
        <AuthHeader title="Link invalid" description="This password reset link is missing or incomplete." />
        <ButtonLink href="/auth/forgot-password">Request a new link</ButtonLink>
      </>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!passwordValid(password)) errs.password = "Your password doesn't meet all the requirements yet";
    if (confirm !== password) errs.confirm = "Passwords don't match";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    const r = await auth.resetPassword(token, password);
    setLoading(false);
    if (!r.ok) return setErrors({ form: r.error });
    toast.success("Password updated", "You're now signed in.");
    router.push("/account");
  };

  return (
    <>
      <AuthHeader title="Choose a new password" description="Make it unique to Oriel — at least 10 characters." />
      {errors.form && (
        <Alert tone="danger" className="mb-5" action={<ButtonLink href="/auth/forgot-password" size="sm" variant="secondary">Request a new link</ButtonLink>}>
          {errors.form}
        </Alert>
      )}
      <form onSubmit={submit} noValidate className="space-y-5">
        <PasswordField label="New password" value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" showRules />
        <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
        <Button type="submit" size="lg" className="w-full" loading={loading} loadingText="Updating…">
          Update password
        </Button>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function VerifyEmailForm() {
  const router = useRouter();
  const user = useSession();
  const pending = usePendingVerification();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (user?.emailVerified) {
    return (
      <>
        <AuthHeader title="Email verified" description="Your email address is confirmed." />
        <ShieldCheck className="mb-6 size-12 text-success" aria-hidden />
        <ButtonLink href="/auth/profile-setup">Continue</ButtonLink>
      </>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from your email");
    setLoading(true);
    const r = await auth.verifyEmail(code);
    setLoading(false);
    if (!r.ok) return setError(r.error);
    toast.success("Email verified");
    router.push("/auth/profile-setup");
  };

  return (
    <>
      <AuthHeader title="Verify your email" description={<>We sent a 6-digit code to <strong className="font-semibold text-ink">{pending?.email ?? user?.email ?? "your email"}</strong>.</>} />
      {pending && (
        <Alert tone="info" title="Demo mode" className="mb-6">
          No emails are sent in this demo. Your code is <code className="font-mono font-semibold">{pending.code}</code>.
        </Alert>
      )}
      {!pending && !user && (
        <Alert tone="warning" className="mb-6" action={<ButtonLink href="/auth/sign-up" size="sm">Create an account</ButtonLink>}>
          There&apos;s no pending verification on this device.
        </Alert>
      )}
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Verification code" error={error}>
          {(p) => (
            <Input
              id={p.id}
              aria-describedby={p.describedBy}
              invalid={p.invalid}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                setError(undefined);
              }}
              className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
            />
          )}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading} loadingText="Verifying…">
          Verify email
        </Button>
      </form>
      <p className="mt-6 text-center text-[0.9375rem] text-muted">
        Didn&apos;t get it?{" "}
        <button
          type="button"
          disabled={resending}
          className="font-semibold text-navy hover:underline disabled:opacity-50"
          onClick={async () => {
            setResending(true);
            await auth.resendVerification();
            setResending(false);
            toast.info("New code sent", "Check your inbox (and spam folder).");
          }}
        >
          Resend code
        </button>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function ProfileSetupForm() {
  const router = useRouter();
  const user = useSession();
  const toast = useToast();
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [styles, setStyles] = useState<TravelCategory[]>(user?.preferences.travelStyle ?? []);
  const [currency, setCurrency] = useState<CurrencyCode>(user?.preferences.currency ?? "USD");
  const [newsletter, setNewsletter] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <>
        <AuthHeader title="Set up your profile" description="Please sign in to finish setting up your profile." />
        <ButtonLink href="/auth/sign-in?next=/auth/profile-setup">Sign in</ButtonLink>
      </>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (phone && !/^\+?[0-9 ()-]{7,20}$/.test(phone)) return setError("Enter a phone number with country code");
    setError(undefined);
    setLoading(true);
    const r = await auth.updateProfile({
      phone: phone || undefined,
      country: country || undefined,
      preferences: { ...user.preferences, travelStyle: styles, currency, notifications: { ...user.preferences.notifications, newsletter } },
    });
    setLoading(false);
    if (!r.ok) return toast.error("Couldn't save your profile", r.error);
    preferencesStore.set((s) => ({ ...s, currency }));
    toast.success("Profile saved", "Welcome to Oriel.");
    router.push("/account");
  };

  return (
    <>
      <AuthHeader eyebrow={`Welcome, ${user.firstName}`} title="Tell us how you travel" description="A few details to personalise recommendations. You can change these any time." />
      <form onSubmit={submit} noValidate className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Mobile phone" optional error={error} hint="For urgent booking updates only">
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}
          </Field>
          <Field label="Country" optional>
            {(p) => (
              <Select id={p.id} value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name">
                <option value="">Select</option>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Travel styles you love</legend>
          <div className="grid grid-cols-2 gap-x-4">
            {TRAVEL_CATEGORIES.map((c) => (
              <Checkbox key={c.id} label={c.label} checked={styles.includes(c.id)} onChange={() => setStyles((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))} />
            ))}
          </div>
        </fieldset>
        <Field label="Preferred display currency">
          {(p) => (
            <Select id={p.id} value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} ({c.code})
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Switch label="Travel notes newsletter" description="One email a month. Unsubscribe any time." checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <ButtonLink href="/account" variant="ghost">
            Skip for now
          </ButtonLink>
          <Button type="submit" size="lg" loading={loading} loadingText="Saving…">
            Save and continue
          </Button>
        </div>
      </form>
    </>
  );
}
