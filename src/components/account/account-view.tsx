"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Bell, Briefcase, CalendarDays, CreditCard, Heart, History, Luggage, Plus, Settings, Trash2, User as UserIcon, Users } from "lucide-react";
import type { Booking, CurrencyCode, SavedPaymentMethod, TravelCategory, Traveler, User } from "@/lib/models";
import { cn } from "@/lib/cn";
import { auth, useSession } from "@/lib/auth";
import { COUNTRIES } from "@/lib/data/countries";
import { TRAVEL_CATEGORIES } from "@/lib/data/catalog";
import { todayISO } from "@/lib/dates";
import { CURRENCIES, formatDateRange, guestsLabel, LANGUAGES } from "@/lib/format";
import { cardBrand, luhn } from "@/lib/booking/schema";
import { bookingsStore, preferencesStore, recentStore, wishlistStore } from "@/lib/stores";
import { useHydrated } from "@/lib/stores/create-store";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Switch } from "@/components/ui/field";
import { Money } from "@/components/ui/money";
import { useToast } from "@/components/ui/toast";

const SECTIONS = [
  { id: "trips", label: "My trips", icon: Briefcase },
  { id: "saved", label: "Saved", icon: Heart },
  { id: "recent", label: "Recently viewed", icon: History },
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "payments", label: "Payment methods", icon: CreditCard },
  { id: "travelers", label: "Travellers", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: Settings },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

const STATUS_TONE = { confirmed: "success", pending: "warning", cancelled: "danger", completed: "neutral" } as const;

function BookingRow({ b }: { b: Booking }) {
  return (
    <li>
      <Link href={`/booking/${b.reference}`} className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-shadow hover:shadow-card sm:flex-row">
        <span className="relative aspect-[16/9] shrink-0 bg-sand sm:aspect-auto sm:w-48">
          <Image src={b.item.image.src} alt="" fill sizes="(min-width: 640px) 192px, 100vw" className="object-cover" />
        </span>
        <span className="flex flex-1 flex-col gap-1 p-4">
          <span className="flex items-start justify-between gap-3">
            <span className="font-display text-xl leading-tight text-ink group-hover:underline">{b.item.title}</span>
            <Badge tone={STATUS_TONE[b.status]}>{b.status[0].toUpperCase() + b.status.slice(1)}</Badge>
          </span>
          <span className="flex items-center gap-1.5 text-sm text-ink-soft">
            <CalendarDays className="size-4 text-muted" aria-hidden />
            {formatDateRange(b.startDate, b.endDate)}
          </span>
          <span className="text-sm text-muted">
            {b.item.destinationName} · {guestsLabel(b.guests.adults, b.guests.children)} {b.item.roomName && `· ${b.item.roomName}`}
          </span>
          <span className="mt-auto flex items-end justify-between pt-2 text-sm">
            <span className="font-mono tracking-wider text-gold">{b.reference}</span>
            <span className="font-semibold text-ink">
              <Money usd={b.price.total} />
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

export function AccountView({ demoBookings }: { demoBookings: Booking[] }) {
  const hydrated = useHydrated();
  const user = useSession();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const section = (SECTIONS.find((s) => s.id === sp.get("tab"))?.id ?? "trips") as SectionId;
  const go = (id: SectionId) => router.replace(`${pathname}?tab=${id}`, { scroll: false });

  if (!hydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]" aria-busy>
        <Skeleton className="h-80" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (!user) {
    return (
      <EmptyState
        icon={<Luggage className="size-6" aria-hidden />}
        title="Sign in to see your account"
        description="Manage bookings, saved places, travellers and payment methods in one place."
        action={
          <>
            <ButtonLink href={`/auth/sign-in?next=${encodeURIComponent(`/account?tab=${section}`)}`}>Sign in</ButtonLink>
            <ButtonLink href="/auth/sign-up" variant="secondary">
              Create account
            </ButtonLink>
          </>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label="Account sections" className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-5 hidden items-center gap-3 lg:flex">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-gold text-lg font-semibold text-white" aria-hidden>
            {user.firstName[0]}
            {user.lastName[0]}
          </span>
          <span>
            <span className="block font-semibold text-ink">
              {user.firstName} {user.lastName}
            </span>
            <span className="block text-sm text-muted">Member since {new Date(user.createdAt).getFullYear()}</span>
          </span>
        </div>
        <ul className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(id)}
                aria-current={section === id ? "page" : undefined}
                className={cn("flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-[0.9375rem] font-medium transition-colors", section === id ? "bg-navy text-white" : "text-ink-soft hover:bg-sand")}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 animate-rise-in" key={section}>
        {section === "trips" && <TripsSection user={user} demoBookings={demoBookings} />}
        {section === "saved" && <SavedSection />}
        {section === "recent" && <RecentSection />}
        {section === "profile" && <ProfileSection user={user} />}
        {section === "payments" && <PaymentsSection user={user} />}
        {section === "travelers" && <TravelersSection user={user} />}
        {section === "notifications" && <NotificationsSection user={user} />}
        {section === "preferences" && <PreferencesSection user={user} />}
      </div>
    </div>
  );
}

function H({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-3xl text-ink">{title}</h2>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function TripsSection({ user, demoBookings }: { user: User; demoBookings: Booking[] }) {
  const local = bookingsStore.use((s) => s.items);
  const overrides = bookingsStore.use((s) => s.overrides);
  const today = todayISO();
  const all = useMemo(() => {
    const mine = local.filter((b) => !b.userId || b.userId === user.id || b.leadGuest.email === user.email);
    const seeded = user.id === "usr-demo" ? demoBookings.filter((d) => !mine.some((m) => m.reference === d.reference)) : [];
    return [...mine, ...seeded].map((b) => (overrides[b.reference] ? { ...b, ...overrides[b.reference] } : b));
  }, [local, overrides, user, demoBookings]);
  const upcoming = all.filter((b) => b.endDate >= today && b.status !== "cancelled" && b.status !== "completed").sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = all.filter((b) => !upcoming.includes(b)).sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="space-y-12">
      <section>
        <H title="Upcoming trips" description="Everything you've booked, in date order." />
        {upcoming.length ? (
          <ul className="grid gap-4">
            {upcoming.map((b) => (
              <BookingRow key={b.reference} b={b} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Luggage className="size-6" aria-hidden />} title="No upcoming trips" description="When you book a hotel, trip or experience it'll appear here with everything you need." action={<ButtonLink href="/hotels">Find a hotel</ButtonLink>} />
        )}
      </section>
      <section>
        <H title="Past & cancelled bookings" />
        {past.length ? (
          <ul className="grid gap-4">
            {past.map((b) => (
              <BookingRow key={b.reference} b={b} />
            ))}
          </ul>
        ) : (
          <p className="text-muted">No past bookings yet.</p>
        )}
      </section>
    </div>
  );
}

function SavedSection() {
  const items = wishlistStore.use((s) => s.items);
  const groups = [
    { type: "hotel", title: "Saved hotels" },
    { type: "destination", title: "Saved destinations" },
    { type: "experience", title: "Saved experiences" },
    { type: "trip", title: "Saved trips" },
  ] as const;
  if (!items.length) {
    return <EmptyState icon={<Heart className="size-6" aria-hidden />} title="Nothing saved yet" description="Tap the heart on anything you love and it'll be kept here." action={<ButtonLink href="/destinations">Get inspired</ButtonLink>} />;
  }
  return (
    <div className="space-y-10">
      <H title="Saved" action={<ButtonLink href="/wishlist" variant="secondary" size="sm">Open wishlist</ButtonLink>} />
      {groups.map((g) => {
        const list = items.filter((i) => i.type === g.type);
        if (!list.length) return null;
        return (
          <section key={g.type}>
            <h3 className="mb-3 font-semibold text-ink">
              {g.title} ({list.length})
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((i) => (
                <li key={i.id}>
                  <Link href={i.snapshot.href} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2 hover:shadow-card">
                    <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-sand">
                      <Image src={i.snapshot.image.src} alt="" fill sizes="64px" className="object-cover" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{i.snapshot.title}</span>
                      <span className="block truncate text-sm text-muted">{i.snapshot.subtitle}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function RecentSection() {
  const items = recentStore.use((s) => s.items);
  return (
    <div>
      <H title="Recently viewed" action={items.length ? <Button variant="ghost" size="sm" onClick={() => recentStore.set({ items: [] })}>Clear</Button> : undefined} />
      {items.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((i) => (
            <li key={i.key}>
              <Link href={i.snapshot.href} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2 hover:shadow-card">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-sand">
                  <Image src={i.snapshot.image.src} alt="" fill sizes="64px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{i.snapshot.title}</span>
                  <span className="block truncate text-sm text-muted">{i.snapshot.subtitle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<History className="size-6" aria-hidden />} title="Nothing viewed yet" description="Hotels, trips and experiences you look at will show up here." />
      )}
    </div>
  );
}

function useSave() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const save = async (patch: Partial<User>, message = "Changes saved") => {
    setSaving(true);
    const r = await auth.updateProfile(patch);
    setSaving(false);
    if (r.ok) toast.success(message);
    else toast.error("Couldn't save", r.error);
    return r.ok;
  };
  return { save, saving };
}

function ProfileSection({ user }: { user: User }) {
  const { save, saving } = useSave();
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "", country: user.country ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "Enter your first name";
    if (!form.lastName.trim()) errs.lastName = "Enter your last name";
    if (form.phone && !/^\+?[0-9 ()-]{7,20}$/.test(form.phone)) errs.phone = "Enter a phone number with country code";
    setErrors(errs);
    if (!Object.keys(errs).length) save({ ...form, phone: form.phone || undefined, country: form.country || undefined }, "Profile updated");
  };
  return (
    <form onSubmit={submit} noValidate className="max-w-2xl">
      <H title="Profile" description="Used to pre-fill your bookings." />
      <div className="grid gap-5 rounded-lg border border-line bg-surface p-6 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName}>
          {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="given-name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />}
        </Field>
        <Field label="Last name" error={errors.lastName}>
          {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="family-name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />}
        </Field>
        <Field label="Email" hint="Contact support to change your sign-in email" className="sm:col-span-2">
          {(p) => <Input id={p.id} aria-describedby={p.describedBy} value={user.email} disabled />}
        </Field>
        <Field label="Phone" optional error={errors.phone}>
          {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}
        </Field>
        <Field label="Country" optional>
          {(p) => (
            <Select id={p.id} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              <option value="">Select</option>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" loading={saving} loadingText="Saving…">
          Save changes
        </Button>
        {!user.emailVerified && (
          <ButtonLink href="/auth/verify-email" variant="ghost">
            Verify email
          </ButtonLink>
        )}
      </div>
    </form>
  );
}

function PaymentsSection({ user }: { user: User }) {
  const { save } = useSave();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ holder: `${user.firstName} ${user.lastName}`, number: "", expiry: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const methods = user.paymentMethods;

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const num = form.number.replace(/\s/g, "");
    const errs: Record<string, string> = {};
    if (form.holder.trim().length < 2) errs.holder = "Enter the cardholder name";
    if (!/^\d{13,19}$/.test(num) || !luhn(num)) errs.number = "Enter a valid card number";
    const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(form.expiry);
    if (!m) errs.expiry = "Use the format MM/YY";
    setErrors(errs);
    if (Object.keys(errs).length || !m) return;
    const brand = cardBrand(num);
    const pm: SavedPaymentMethod = { id: `pm_${Date.now()}`, brand: brand === "unknown" ? "visa" : brand, last4: num.slice(-4), expMonth: Number(m[1]), expYear: 2000 + Number(m[2]), holder: form.holder, isDefault: methods.length === 0 };
    if (await save({ paymentMethods: [...methods, pm] }, "Card saved")) {
      setOpen(false);
      setForm({ ...form, number: "", expiry: "" });
    }
  };

  return (
    <div className="max-w-2xl">
      <H title="Payment methods" description="Cards are tokenised by our payment provider — we never store full card numbers." action={<Button size="sm" onClick={() => setOpen(true)} iconLeft={<Plus className="size-4" aria-hidden />}>Add card</Button>} />
      {methods.length ? (
        <ul className="grid gap-3">
          {methods.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4">
              <div className="flex items-center gap-4">
                <span className="inline-flex h-10 w-14 items-center justify-center rounded-md bg-navy text-xs font-bold uppercase tracking-wider text-white">{m.brand}</span>
                <div>
                  <p className="font-medium text-ink">•••• {m.last4}</p>
                  <p className="text-sm text-muted">
                    {m.holder} · Expires {String(m.expMonth).padStart(2, "0")}/{String(m.expYear).slice(-2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {m.isDefault ? (
                  <Badge tone="success">Default</Badge>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => save({ paymentMethods: methods.map((x) => ({ ...x, isDefault: x.id === m.id })) }, "Default card updated")}>
                    Make default
                  </Button>
                )}
                <button type="button" onClick={() => save({ paymentMethods: methods.filter((x) => x.id !== m.id) }, "Card removed")} className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-danger-tint hover:text-danger" aria-label={`Remove card ending ${m.last4}`}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<CreditCard className="size-6" aria-hidden />} title="No saved cards" description="Save a card for faster checkout next time." />
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add a card" size="sm">
        <form onSubmit={add} noValidate className="space-y-4">
          <p className="text-sm text-muted">Demo: use test card 4242 4242 4242 4242.</p>
          <Field label="Cardholder name" error={errors.holder}>
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="cc-name" value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} />}
          </Field>
          <Field label="Card number" error={errors.number}>
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} inputMode="numeric" autoComplete="cc-number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value.replace(/[^\d ]/g, "").slice(0, 23) })} />}
          </Field>
          <Field label="Expiry (MM/YY)" error={errors.expiry}>
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={form.expiry} onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setForm({ ...form, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }); }} />}
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save card</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TravelersSection({ user }: { user: User }) {
  const { save } = useSave();
  const [form, setForm] = useState({ firstName: "", lastName: "", relation: "partner" as Traveler["relation"] });
  const [error, setError] = useState<string>();
  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return setError("Enter the traveller's first and last name");
    setError(undefined);
    if (await save({ travelers: [...user.travelers, { id: `trv_${Date.now()}`, ...form }] }, "Traveller added")) setForm({ firstName: "", lastName: "", relation: "partner" });
  };
  return (
    <div className="max-w-2xl">
      <H title="Travellers" description="Save the people you travel with to book for them in one step." />
      <ul className="grid gap-3">
        {user.travelers.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-lg border border-line bg-surface p-4">
            <div>
              <p className="font-medium text-ink">
                {t.firstName} {t.lastName}
              </p>
              <p className="text-sm capitalize text-muted">{t.relation === "self" ? "You" : t.relation}</p>
            </div>
            {t.relation !== "self" && (
              <button type="button" onClick={() => save({ travelers: user.travelers.filter((x) => x.id !== t.id) }, "Traveller removed")} className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-danger-tint hover:text-danger" aria-label={`Remove ${t.firstName}`}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} noValidate className="mt-6 rounded-lg border border-line bg-surface p-5">
        <h3 className="mb-4 font-semibold text-ink">Add a traveller</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="First name" error={error}>
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />}
          </Field>
          <Field label="Last name">
            {(p) => <Input id={p.id} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />}
          </Field>
          <Field label="Relationship">
            {(p) => (
              <Select id={p.id} value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value as Traveler["relation"] })}>
                <option value="partner">Partner</option>
                <option value="child">Child</option>
                <option value="family">Family</option>
                <option value="friend">Friend</option>
              </Select>
            )}
          </Field>
        </div>
        <Button type="submit" className="mt-4" iconLeft={<Plus className="size-4" aria-hidden />}>
          Add traveller
        </Button>
      </form>
    </div>
  );
}

function NotificationsSection({ user }: { user: User }) {
  const { save } = useSave();
  const n = user.preferences.notifications;
  const toggle = (k: keyof typeof n) => save({ preferences: { ...user.preferences, notifications: { ...n, [k]: !n[k] } } }, "Notification settings saved");
  return (
    <div className="max-w-2xl">
      <H title="Notifications" description="Choose what we send you. Essential booking emails are always sent." />
      <div className="divide-y divide-line rounded-lg border border-line bg-surface px-5">
        <Switch className="py-3" label="Booking updates" description="Confirmations, changes and check-in reminders" checked={n.bookingUpdates} onChange={() => toggle("bookingUpdates")} />
        <Switch className="py-3" label="Price alerts" description="When saved hotels drop in price" checked={n.priceAlerts} onChange={() => toggle("priceAlerts")} />
        <Switch className="py-3" label="Trip reminders" description="Packing tips and local weather before you go" checked={n.tripReminders} onChange={() => toggle("tripReminders")} />
        <Switch className="py-3" label="Newsletter" description="Monthly travel notes and member offers" checked={n.newsletter} onChange={() => toggle("newsletter")} />
        <Switch className="py-3" label="SMS alerts" description="Urgent updates by text message" checked={n.sms} onChange={() => toggle("sms")} />
      </div>
    </div>
  );
}

function PreferencesSection({ user }: { user: User }) {
  const { save, saving } = useSave();
  const [currency, setCurrency] = useState<CurrencyCode>(user.preferences.currency);
  const [language, setLanguage] = useState(user.preferences.language);
  const [styles, setStyles] = useState<TravelCategory[]>(user.preferences.travelStyle);
  return (
    <form
      className="max-w-2xl"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await save({ preferences: { ...user.preferences, currency, language, travelStyle: styles } }, "Preferences saved")) preferencesStore.set({ currency, language });
      }}
    >
      <H title="Preferences" />
      <div className="space-y-6 rounded-lg border border-line bg-surface p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display currency" hint="Payments are always charged in USD">
            {(p) => (
              <Select id={p.id} aria-describedby={p.describedBy} value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label} ({c.code})
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Language">
            {(p) => (
              <Select id={p.id} value={language} onChange={(e) => setLanguage(e.target.value as typeof language)}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                    {!l.available ? " (coming soon)" : ""}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Travel styles</legend>
          <div className="grid grid-cols-2 gap-x-4">
            {TRAVEL_CATEGORIES.map((c) => (
              <Checkbox key={c.id} label={c.label} checked={styles.includes(c.id)} onChange={() => setStyles((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))} />
            ))}
          </div>
        </fieldset>
      </div>
      <Button type="submit" className="mt-5" loading={saving} loadingText="Saving…">
        Save preferences
      </Button>
    </form>
  );
}
