"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, CalendarDays, Check, ChevronDown, CreditCard, Lock, MapPin, ShieldCheck, Tag, Users, X } from "lucide-react";
import type { Booking, ISODate, Promotion, SelectedExtra } from "@/lib/models";
import { cn } from "@/lib/cn";
import { COUNTRIES } from "@/lib/data/countries";
import { addDays, diffDays, todayISO } from "@/lib/dates";
import { formatDateLong, formatDateRange, formatDateShort, guestsLabel, plural } from "@/lib/format";
import { experienceRunsOn, experienceSpots, roomFitsParty, stayAvailability } from "@/lib/booking/availability";
import { freeCancellationDeadline } from "@/lib/booking/cancellation";
import { describeExtraUnit, extraAmount } from "@/lib/booking/pricing";
import { extrasFor, quoteBookable, type Bookable } from "@/lib/booking/quote";
import { billingSchema, cardBrand, cardSchema, fieldErrors, guestSchema } from "@/lib/booking/schema";
import { useSession } from "@/lib/auth";
import { saveBooking } from "@/lib/stores";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Counter } from "@/components/ui/counter";
import { Money } from "@/components/ui/money";
import { useToast } from "@/components/ui/toast";
import { Calendar } from "@/components/search/calendar";
import { DateRangeField, GuestsField } from "@/components/search/pickers";
import { PriceBreakdown } from "./price-breakdown";
import { Stepper } from "./stepper";

export interface CheckoutInitial {
  roomId?: string;
  startDate?: ISODate;
  endDate?: ISODate;
  adults: number;
  children: number;
  rooms: number;
  departureId?: string;
  timeSlot?: string;
}

const STEP_LABELS = {
  hotel: ["Room", "Guest details", "Extras", "Payment", "Confirmation"],
  trip: ["Departure", "Guest details", "Extras", "Payment", "Confirmation"],
  experience: ["Date & time", "Guest details", "Extras", "Payment", "Confirmation"],
};

type Guest = { firstName: string; lastName: string; email: string; phone: string; country: string };
type Card = { name: string; number: string; expiry: string; cvc: string };
type Billing = { line1: string; city: string; postalCode: string; country: string };

const formatCardNumber = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

function focusFirstError(container: HTMLElement | null) {
  window.setTimeout(() => container?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(), 0);
}

export function CheckoutFlow({ bookable, destinationName, initial }: { bookable: Bookable; destinationName: string; initial: CheckoutInitial }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const toast = useToast();
  const user = useSession();
  const formRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const today = todayISO();
  const steps = STEP_LABELS[bookable.type];

  /* ---------- selection state ---------- */
  const [roomId, setRoomId] = useState(initial.roomId);
  const [dates, setDates] = useState<{ start?: ISODate; end?: ISODate }>({ start: initial.startDate, end: initial.endDate });
  const [party, setParty] = useState({ adults: initial.adults, children: initial.children, rooms: initial.rooms });
  const [departureId, setDepartureId] = useState(initial.departureId);
  const [timeSlot, setTimeSlot] = useState(initial.timeSlot);

  /* ---------- details state ---------- */
  const [guest, setGuest] = useState<Guest>({ firstName: "", lastName: "", email: "", phone: "", country: "" });
  const [prefilled, setPrefilled] = useState(false);
  if (user && !prefilled) {
    setPrefilled(true);
    setGuest((g) => ({ firstName: g.firstName || user.firstName, lastName: g.lastName || user.lastName, email: g.email || user.email, phone: g.phone || user.phone || "", country: g.country || user.country || "" }));
  }
  const [requests, setRequests] = useState("");
  const [extras, setExtras] = useState<SelectedExtra[]>([]);
  const [card, setCard] = useState<Card>({ name: "", number: "", expiry: "", cvc: "" });
  const [billing, setBilling] = useState<Billing>({ line1: "", city: "", postalCode: "", country: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<{ title: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ---------- promo ---------- */
  const [promoInput, setPromoInput] = useState("");
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [promoError, setPromoError] = useState<string>();
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);

  /* ---------- step routing (URL-driven so Back works) ---------- */
  const [maxStep, setMaxStep] = useState(0);
  const urlStep = Number(sp.get("step") ?? 0) || 0;
  const step = Math.min(Math.max(0, urlStep), maxStep);
  const goTo = (i: number) => {
    setMaxStep((m) => Math.max(m, i));
    const q = new URLSearchParams(sp.toString());
    q.set("step", String(i));
    router.push(`${pathname}?${q}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  /* ---------- live quote ---------- */
  const quoteParams = {
    roomId,
    departureId,
    timeSlot,
    startDate: dates.start ?? today,
    endDate: dates.end,
    adults: party.adults,
    children: party.children,
    rooms: bookable.type === "hotel" ? party.rooms : 1,
    extras,
    today,
  };
  // Pure and cheap (a handful of nights), so it is simply recomputed each render.
  const quote = quoteBookable(bookable, destinationName, { ...quoteParams, promotion });
  const preQuote = quoteBookable(bookable, destinationName, { ...quoteParams, promotion: null, extras: [] });

  const selectionReady = quote.ok && (bookable.type !== "hotel" || Boolean(dates.start && dates.end));

  const extraCtx = {
    nights: bookable.type === "hotel" && dates.start && dates.end ? diffDays(dates.start, dates.end) : bookable.type === "trip" ? bookable.trip.durationDays - 1 : 0,
    guests: party.adults + party.children,
    rooms: bookable.type === "hotel" ? party.rooms : 1,
  };

  /* ---------- actions ---------- */
  const continueFromSelection = () => {
    if (!quote.ok) return;
    goTo(1);
  };

  const continueFromGuest = (e: FormEvent) => {
    e.preventDefault();
    const r = guestSchema.safeParse(guest);
    if (!r.success) {
      setErrors(Object.fromEntries(Object.entries(fieldErrors(r.error)).map(([k, v]) => [`guest.${k}`, v])));
      focusFirstError(formRef.current);
      return;
    }
    setErrors({});
    if (!billing.country) setBilling((b) => ({ ...b, country: guest.country }));
    if (!card.name) setCard((c) => ({ ...c, name: `${guest.firstName} ${guest.lastName}` }));
    goTo(2);
  };

  const applyPromo = async () => {
    if (!preQuote.ok) return;
    setPromoLoading(true);
    setPromoError(undefined);
    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoInput,
          type: bookable.type,
          subtotal: preQuote.price.base + preQuote.price.discounts,
          nights: bookable.type === "hotel" ? diffDays(preQuote.startDate, preQuote.endDate) : undefined,
        }),
      });
      const data = (await res.json()) as { ok: true; promotion: Promotion } | { ok: false; reason: string };
      if (data.ok) {
        setPromotion(data.promotion);
        toast.success("Promo code applied", data.promotion.title);
      } else setPromoError(data.reason);
    } catch {
      setPromoError("We couldn't check this code right now. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  };

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const next: Record<string, string> = {};
    const c = cardSchema.safeParse(card);
    if (!c.success) Object.entries(fieldErrors(c.error)).forEach(([k, v]) => (next[`card.${k}`] = v));
    const b = billingSchema.safeParse(billing);
    if (!b.success) Object.entries(fieldErrors(b.error)).forEach(([k, v]) => (next[`billing.${k}`] = v));
    if (!terms) next.acceptTerms = "Please accept the booking terms to continue";
    setErrors(next);
    if (Object.keys(next).length) {
      focusFirstError(formRef.current);
      return;
    }
    if (!quote.ok) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: bookable.type,
          slug: quote.snapshot.slug,
          roomId,
          departureId,
          timeSlot,
          startDate: quote.startDate,
          endDate: bookable.type === "hotel" ? quote.endDate : undefined,
          adults: party.adults,
          children: party.children,
          rooms: bookable.type === "hotel" ? party.rooms : 1,
          guest,
          specialRequests: requests || undefined,
          extras,
          promoCode: promotion?.code,
          card,
          billing,
          expectedTotal: quote.price.total,
          acceptTerms: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        const titles: Record<string, string> = {
          card_declined: "Payment declined",
          insufficient_funds: "Payment declined",
          processing_error: "Payment couldn't be processed",
          price_changed: "The price has changed",
          unavailable: "No longer available",
          promo_invalid: "Promo code no longer valid",
        };
        setSubmitError({ title: titles[data.code] ?? "We couldn't complete your booking", message: data.message ?? "Please try again." });
        if (data.code === "promo_invalid") setPromotion(null);
        return;
      }
      const booking = data.booking as Booking;
      saveBooking({ ...booking, userId: user?.id });
      router.push(`/booking/${booking.reference}?new=1`);
    } catch {
      setSubmitError({ title: "Connection problem", message: "We couldn't reach our servers. Your card has not been charged — please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const setField = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, prefix: string) => (key: keyof T & string, value: string) => {
    setter((s) => ({ ...s, [key]: value }));
    if (errors[`${prefix}.${key}`]) setErrors((e) => ({ ...e, [`${prefix}.${key}`]: "" }));
  };
  const setGuestField = setField(setGuest, "guest");
  const setCardField = setField(setCard, "card");
  const setBillingField = setField(setBilling, "billing");

  const deadline = quote.ok ? freeCancellationDeadline(quote.cancellation, quote.startDate) : null;
  const backHref = `/${bookable.type === "hotel" ? "hotels" : bookable.type === "trip" ? "trips" : "experiences"}/${bookable.type === "hotel" ? bookable.hotel.slug : bookable.type === "trip" ? bookable.trip.slug : bookable.experience.slug}`;

  /* ---------- render helpers ---------- */
  const summary = (
    <Summary quote={quote} bookable={bookable} party={party} deadline={deadline} />
  );

  return (
    <div className="container-page pb-28 pt-6 lg:pb-16">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Back to {bookable.type === "hotel" ? "hotel" : bookable.type}
      </Link>
      <div className="mt-5 max-w-3xl">
        <Stepper steps={steps} current={step} onStep={(i) => goTo(i)} />
      </div>

      {/* Mobile summary */}
      <details className="group mt-6 rounded-lg border border-line bg-surface lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-sm text-muted">Total (incl. taxes & fees)</span>
            <span className="text-lg font-semibold text-ink">{quote.ok ? <Money usd={quote.price.total} cents /> : "—"}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-navy">
            Booking summary <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
          </span>
        </summary>
        <div className="border-t border-line p-4">{summary}</div>
      </details>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div ref={formRef} key={step} className="min-w-0 animate-rise-in">
          {/* ---------------- Step 0: selection ---------------- */}
          {step === 0 && (
            <section aria-labelledby="step-title">
              <h1 id="step-title" ref={headingRef} tabIndex={-1} className="font-display text-4xl text-ink focus:outline-none">
                {bookable.type === "hotel" ? "Confirm your room" : bookable.type === "trip" ? "Choose your departure" : "Choose a date and time"}
              </h1>

              {bookable.type === "hotel" && (
                <div className="mt-6 space-y-5">
                  <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3 sm:flex-row">
                    <DateRangeField className="flex-1" start={dates.start} end={dates.end} onChange={(s, e) => setDates({ start: s, end: e })} />
                    <GuestsField className="flex-1" value={party} onChange={setParty} label="Guests & rooms" />
                  </div>
                  <fieldset>
                    <legend className="mb-3 font-semibold text-ink">Room type</legend>
                    <div className="grid gap-3">
                      {bookable.hotel.rooms.map((r) => {
                        const fits = roomFitsParty(r, party.adults, party.children, party.rooms);
                        const avail = dates.start && dates.end ? stayAvailability(bookable.hotel, r, dates.start, dates.end).available : 0;
                        const disabled = !fits || avail < party.rooms;
                        const q = quoteBookable(bookable, destinationName, { ...quoteParams, roomId: r.id, extras: [], promotion: null });
                        return (
                          <label key={r.id} className={cn("flex cursor-pointer gap-4 rounded-lg border bg-surface p-3 transition-colors has-[:checked]:border-navy has-[:checked]:ring-1 has-[:checked]:ring-navy has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold", disabled && "cursor-not-allowed opacity-55")}>
                            <input type="radio" name="room" className="sr-only" checked={roomId === r.id} disabled={disabled} onChange={() => setRoomId(r.id)} />
                            <span className="relative hidden size-20 shrink-0 overflow-hidden rounded-md bg-sand sm:block">
                              <Image src={r.images[0].src} alt="" fill sizes="80px" className="object-cover" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold text-ink">{r.name}</span>
                              <span className="block text-sm text-muted">
                                Sleeps {r.maxAdults + r.maxChildren} · {r.sizeSqm} m² · {r.breakfastIncluded ? "Breakfast included" : "Room only"}
                              </span>
                              <span className={cn("mt-1 block text-[0.8125rem] font-medium", r.cancellation.type === "free" ? "text-success" : "text-muted")}>{r.cancellation.summary}</span>
                              {disabled && <span className="mt-1 block text-[0.8125rem] text-warning">{!fits ? "Doesn't fit your party" : "Unavailable for these dates"}</span>}
                            </span>
                            <span className="shrink-0 text-right">
                              {q.ok && !disabled ? (
                                <>
                                  <span className="block font-semibold tabular-nums text-ink">
                                    <Money usd={q.price.total} />
                                  </span>
                                  <span className="block text-xs text-muted">total</span>
                                </>
                              ) : null}
                              <span className={cn("mt-2 ml-auto flex size-5 items-center justify-center rounded-full border", roomId === r.id ? "border-navy bg-navy text-white" : "border-line-strong")} aria-hidden>
                                {roomId === r.id && <Check className="size-3" />}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              )}

              {bookable.type === "trip" && (
                <div className="mt-6 space-y-6">
                  <fieldset>
                    <legend className="mb-3 font-semibold text-ink">Departure date</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {bookable.trip.departures
                        .filter((d) => d.startDate > today)
                        .map((d) => {
                          const soldOut = d.seatsLeft < party.adults + party.children;
                          return (
                            <label key={d.id} className={cn("flex cursor-pointer items-start justify-between gap-3 rounded-lg border bg-surface p-4 has-[:checked]:border-navy has-[:checked]:ring-1 has-[:checked]:ring-navy has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold", soldOut && "cursor-not-allowed opacity-55")}>
                              <input type="radio" name="departure" className="sr-only" checked={departureId === d.id} disabled={soldOut} onChange={() => setDepartureId(d.id)} />
                              <span>
                                <span className="block font-semibold text-ink">{formatDateRange(d.startDate, addDays(d.startDate, bookable.trip.durationDays - 1))}</span>
                                <span className={cn("block text-sm", d.seatsLeft === 0 ? "text-danger" : d.seatsLeft <= 3 ? "text-warning" : "text-muted")}>
                                  {d.seatsLeft === 0 ? "Sold out" : d.seatsLeft <= 3 ? `Only ${plural(d.seatsLeft, "place")} left` : `${d.seatsLeft} places available`}
                                </span>
                              </span>
                              <span className="text-right">
                                <span className="block font-semibold tabular-nums text-ink">
                                  <Money usd={d.price} />
                                </span>
                                <span className="text-xs text-muted">per person</span>
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </fieldset>
                  <div className="max-w-md rounded-lg border border-line bg-surface px-4 py-2">
                    <Counter label="Adults" value={party.adults} min={1} max={bookable.trip.groupSize.max - party.children} onChange={(adults) => setParty((p) => ({ ...p, adults }))} />
                    <div className="h-px bg-line" />
                    <Counter label="Children" description="Under 12 — 25% off" value={party.children} min={0} max={bookable.trip.groupSize.max - party.adults} onChange={(children) => setParty((p) => ({ ...p, children }))} />
                  </div>
                </div>
              )}

              {bookable.type === "experience" && (
                <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_18rem]">
                  <div className="rounded-lg border border-line bg-surface p-4">
                    <Calendar
                      mode="single"
                      months={1}
                      start={dates.start}
                      min={addDays(today, 1)}
                      isDisabled={(d) => !experienceRunsOn(bookable.experience, d)}
                      onChange={(s) => {
                        setDates({ start: s });
                        setTimeSlot(undefined);
                      }}
                    />
                  </div>
                  <div className="space-y-5">
                    <fieldset>
                      <legend className="mb-3 font-semibold text-ink">Time</legend>
                      {!dates.start ? (
                        <p className="text-sm text-muted">Choose a date to see available times.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {bookable.experience.timeSlots.map((slot) => {
                            const spots = experienceSpots(bookable.experience, dates.start!, slot);
                            const full = spots < party.adults + party.children;
                            return (
                              <label key={slot} className={cn("flex cursor-pointer flex-col rounded-md border bg-surface px-3 py-2.5 has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold", full && "cursor-not-allowed opacity-50")}>
                                <input type="radio" name="slot" className="sr-only" checked={timeSlot === slot} disabled={full} onChange={() => setTimeSlot(slot)} />
                                <span className="font-semibold">{slot}</span>
                                <span className="text-xs opacity-80">{spots === 0 ? "Fully booked" : `${spots} spots left`}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </fieldset>
                    <div className="rounded-lg border border-line bg-surface px-4 py-2">
                      <Counter label="Adults" value={party.adults} min={1} max={bookable.experience.groupSize.max} onChange={(adults) => setParty((p) => ({ ...p, adults }))} />
                      <div className="h-px bg-line" />
                      <Counter label="Children" description="Ages 4–12 — 40% off" value={party.children} min={0} max={bookable.experience.groupSize.max - party.adults} onChange={(children) => setParty((p) => ({ ...p, children }))} />
                    </div>
                  </div>
                </div>
              )}

              {!quote.ok && (bookable.type !== "hotel" || (dates.start && dates.end)) && (
                <Alert tone="warning" className="mt-6">
                  {quote.reason}
                </Alert>
              )}
              <StepActions>
                <Button size="lg" onClick={continueFromSelection} disabled={!selectionReady} className="sm:min-w-56">
                  Continue to guest details
                </Button>
              </StepActions>
            </section>
          )}

          {/* ---------------- Step 1: guest ---------------- */}
          {step === 1 && (
            <form onSubmit={continueFromGuest} noValidate aria-labelledby="step-title">
              <h1 id="step-title" ref={headingRef} tabIndex={-1} className="font-display text-4xl text-ink focus:outline-none">
                Who&apos;s travelling?
              </h1>
              <p className="mt-2 text-muted">We&apos;ll send your confirmation to this email. The lead guest must be present at check-in.</p>
              {!user && (
                <p className="mt-3 text-sm text-ink-soft">
                  <Link href={`/auth/sign-in?next=${encodeURIComponent(`${pathname}?${sp.toString()}`)}`} className="font-semibold text-navy hover:underline">
                    Sign in
                  </Link>{" "}
                  to book faster and keep everything in My Trips — or continue as a guest.
                </p>
              )}
              {Object.values(errors).some(Boolean) && (
                <Alert tone="danger" className="mt-5" title="Please check the highlighted fields" />
              )}
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="First name" error={errors["guest.firstName"]}>
                  {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="given-name" value={guest.firstName} onChange={(e) => setGuestField("firstName", e.target.value)} />}
                </Field>
                <Field label="Last name" error={errors["guest.lastName"]}>
                  {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="family-name" value={guest.lastName} onChange={(e) => setGuestField("lastName", e.target.value)} />}
                </Field>
                <Field label="Email" hint="Confirmation and updates are sent here" error={errors["guest.email"]}>
                  {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} type="email" inputMode="email" autoComplete="email" value={guest.email} onChange={(e) => setGuestField("email", e.target.value)} />}
                </Field>
                <Field label="Phone" hint="Include your country code" error={errors["guest.phone"]}>
                  {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} type="tel" inputMode="tel" autoComplete="tel" placeholder="+44 20 7946 0000" value={guest.phone} onChange={(e) => setGuestField("phone", e.target.value)} />}
                </Field>
                <Field label="Country of residence" error={errors["guest.country"]} className="sm:col-span-2">
                  {(p) => (
                    <Select id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="country-name" value={guest.country} onChange={(e) => setGuestField("country", e.target.value)}>
                      <option value="">Select a country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Special requests" optional hint="Not guaranteed, but the property will do its best. Maximum 1,000 characters." className="sm:col-span-2">
                  {(p) => <Textarea id={p.id} aria-describedby={p.describedBy} maxLength={1000} value={requests} onChange={(e) => setRequests(e.target.value)} placeholder="Arrival time, dietary needs, a special occasion…" />}
                </Field>
              </div>
              <StepActions onBack={() => goTo(0)}>
                <Button size="lg" type="submit" className="sm:min-w-56">
                  Continue to extras
                </Button>
              </StepActions>
            </form>
          )}

          {/* ---------------- Step 2: extras ---------------- */}
          {step === 2 && (
            <section aria-labelledby="step-title">
              <h1 id="step-title" ref={headingRef} tabIndex={-1} className="font-display text-4xl text-ink focus:outline-none">
                Make it even better
              </h1>
              <p className="mt-2 text-muted">Optional extras, priced exactly — they&apos;re added to your breakdown as you choose.</p>
              <ul className="mt-6 grid gap-3">
                {extrasFor(bookable.type).map((ex) => {
                  const on = extras.some((e) => e.extraId === ex.id);
                  const amount = extraAmount(ex, 1, extraCtx);
                  return (
                    <li key={ex.id}>
                      <label className="flex cursor-pointer items-start gap-4 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-line-strong has-[:checked]:border-navy has-[:checked]:bg-navy-tint/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold">
                        <input
                          type="checkbox"
                          className="mt-1 size-5 shrink-0 accent-[var(--color-navy)]"
                          checked={on}
                          onChange={() => setExtras((xs) => (on ? xs.filter((x) => x.extraId !== ex.id) : [...xs, { extraId: ex.id, quantity: 1 }]))}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-ink">{ex.label}</span>
                          <span className="block text-sm text-muted">{ex.description}</span>
                          <span className="mt-1 block text-xs text-muted">
                            <Money usd={ex.price} /> {describeExtraUnit(ex)}
                            {!ex.taxable && " · tax-free"}
                          </span>
                        </span>
                        <span className="shrink-0 text-right font-semibold tabular-nums text-ink">
                          +<Money usd={amount} />
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <StepActions onBack={() => goTo(1)}>
                <Button size="lg" onClick={() => goTo(3)} className="sm:min-w-56">
                  {extras.length ? "Continue to payment" : "Skip — continue to payment"}
                </Button>
              </StepActions>
            </section>
          )}

          {/* ---------------- Step 3: payment ---------------- */}
          {step === 3 && (
            <form onSubmit={pay} noValidate aria-labelledby="step-title">
              <h1 id="step-title" ref={headingRef} tabIndex={-1} className="font-display text-4xl text-ink focus:outline-none">
                Review and pay
              </h1>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
                <Lock className="size-4" aria-hidden /> Secure, encrypted payment. You&apos;ll be charged <strong className="font-semibold text-ink">{quote.ok ? <Money usd={quote.price.dueNow} cents /> : "—"}</strong> now.
              </p>

              {submitError && (
                <Alert tone="danger" title={submitError.title} className="mt-5">
                  {submitError.message}
                </Alert>
              )}

              <fieldset className="mt-6 rounded-lg border border-line bg-surface p-5">
                <legend className="flex items-center gap-2 px-1 font-semibold text-ink">
                  <CreditCard className="size-5 text-muted" aria-hidden /> Card details
                </legend>
                <Alert tone="info" className="mb-5 text-sm">
                  Demo checkout — no real payment is taken. Use test card <code className="font-mono font-semibold">4242 4242 4242 4242</code> with any future expiry and CVC. Try <code className="font-mono">4000 0000 0000 0002</code> to see a declined payment.
                </Alert>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Name on card" error={errors["card.name"]} className="sm:col-span-2">
                    {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="cc-name" value={card.name} onChange={(e) => setCardField("name", e.target.value)} />}
                  </Field>
                  <Field label="Card number" error={errors["card.number"]} className="sm:col-span-2">
                    {(p) => (
                      <Input
                        id={p.id}
                        aria-describedby={p.describedBy}
                        invalid={p.invalid}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="1234 5678 9012 3456"
                        value={card.number}
                        onChange={(e) => setCardField("number", formatCardNumber(e.target.value))}
                        trailing={<span className="px-2 text-xs font-semibold uppercase tracking-wide text-muted">{card.number ? cardBrand(card.number).replace("unknown", "") : ""}</span>}
                      />
                    )}
                  </Field>
                  <Field label="Expiry date" error={errors["card.expiry"]}>
                    {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCardField("expiry", formatExpiry(e.target.value))} />}
                  </Field>
                  <Field label="Security code" hint="3 or 4 digits on the back" error={errors["card.cvc"]}>
                    {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={card.cvc} onChange={(e) => setCardField("cvc", e.target.value.replace(/\D/g, ""))} />}
                  </Field>
                </div>
              </fieldset>

              <fieldset className="mt-6 rounded-lg border border-line bg-surface p-5">
                <legend className="px-1 font-semibold text-ink">Billing address</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Street address" error={errors["billing.line1"]} className="sm:col-span-2">
                    {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="address-line1" value={billing.line1} onChange={(e) => setBillingField("line1", e.target.value)} />}
                  </Field>
                  <Field label="City" error={errors["billing.city"]}>
                    {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="address-level2" value={billing.city} onChange={(e) => setBillingField("city", e.target.value)} />}
                  </Field>
                  <Field label="Postal code" error={errors["billing.postalCode"]}>
                    {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="postal-code" value={billing.postalCode} onChange={(e) => setBillingField("postalCode", e.target.value)} />}
                  </Field>
                  <Field label="Country" error={errors["billing.country"]} className="sm:col-span-2">
                    {(p) => (
                      <Select id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} autoComplete="country-name" value={billing.country} onChange={(e) => setBillingField("country", e.target.value)}>
                        <option value="">Select a country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </div>
              </fieldset>

              <div className="mt-6 rounded-lg border border-line bg-surface p-5">
                {promotion ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-[0.9375rem]">
                      <Tag className="size-4 text-success" aria-hidden />
                      <span>
                        <strong className="font-semibold">{promotion.code}</strong> applied — {promotion.title}
                      </span>
                    </p>
                    <button type="button" onClick={() => setPromotion(null)} className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline">
                      <X className="size-3.5" aria-hidden /> Remove
                    </button>
                  </div>
                ) : promoOpen ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <Field label="Promo code" error={promoError} className="flex-1">
                      {(p) => (
                        <Input
                          id={p.id}
                          aria-describedby={p.describedBy}
                          invalid={p.invalid}
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase());
                            setPromoError(undefined);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              applyPromo();
                            }
                          }}
                          placeholder="e.g. WELCOME10"
                          autoCapitalize="characters"
                        />
                      )}
                    </Field>
                    <Button variant="secondary" onClick={applyPromo} loading={promoLoading} disabled={!promoInput.trim()} className="sm:mt-7">
                      Apply
                    </Button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setPromoOpen(true)} className="inline-flex items-center gap-2 text-[0.9375rem] font-medium text-navy hover:underline">
                    <Tag className="size-4" aria-hidden /> Add a promo code
                  </button>
                )}
              </div>

              {quote.ok && (
                <div className="mt-6 rounded-lg border border-line bg-surface p-5">
                  <h2 className="mb-4 font-semibold text-ink">Complete price breakdown</h2>
                  <PriceBreakdown price={quote.price} />
                </div>
              )}

              <div className="mt-6 rounded-lg border border-line bg-surface p-5">
                <p className="flex items-start gap-2 text-[0.9375rem]">
                  <ShieldCheck className={cn("mt-0.5 size-5 shrink-0", quote.ok && quote.cancellation.type === "free" ? "text-success" : "text-muted")} aria-hidden />
                  <span>
                    <strong className="font-semibold">Cancellation policy: </strong>
                    {quote.ok ? quote.cancellation.summary : ""}
                    {deadline && <> — cancel free until <strong className="font-semibold">{formatDateLong(deadline)}</strong>.</>}
                  </span>
                </p>
                <Checkbox
                  className="mt-4"
                  checked={terms}
                  onChange={(e) => {
                    setTerms(e.target.checked);
                    if (errors.acceptTerms) setErrors((x) => ({ ...x, acceptTerms: "" }));
                  }}
                  aria-invalid={errors.acceptTerms ? true : undefined}
                  aria-describedby={errors.acceptTerms ? "terms-error" : undefined}
                  label={
                    <>
                      I agree to the{" "}
                      <Link href="/help#terms" target="_blank" className="font-medium text-navy underline">
                        booking terms
                      </Link>
                      , the cancellation policy above and the{" "}
                      <Link href="/help#privacy" target="_blank" className="font-medium text-navy underline">
                        privacy policy
                      </Link>
                      .
                    </>
                  }
                />
                {errors.acceptTerms && (
                  <p id="terms-error" role="alert" className="ml-8 text-[0.8125rem] font-medium text-danger">
                    {errors.acceptTerms}
                  </p>
                )}
              </div>

              <StepActions onBack={() => goTo(2)}>
                <Button size="lg" type="submit" variant="accent" loading={submitting} loadingText="Processing payment…" className="sm:min-w-64" iconLeft={<Lock className="size-4" aria-hidden />} disabled={!quote.ok}>
                  {quote.ok ? (
                    <>
                      Pay <Money usd={quote.price.dueNow} cents /> and book
                    </>
                  ) : (
                    "Pay and book"
                  )}
                </Button>
              </StepActions>
            </form>
          )}
        </div>

        <aside className="hidden lg:block" aria-label="Booking summary">
          <div className="sticky top-24 rounded-xl border border-line bg-surface p-5 shadow-card">{summary}</div>
        </aside>
      </div>
    </div>
  );
}

function StepActions({ children, onBack }: { children: ReactNode; onBack?: () => void }) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <Button variant="ghost" onClick={onBack} iconLeft={<ArrowLeft className="size-4" aria-hidden />}>
          Back
        </Button>
      ) : (
        <span />
      )}
      {children}
    </div>
  );
}

function Summary({ quote, bookable, party, deadline }: { quote: ReturnType<typeof quoteBookable>; bookable: Bookable; party: { adults: number; children: number; rooms: number }; deadline: ISODate | null }) {
  const title = bookable.type === "hotel" ? bookable.hotel.name : bookable.type === "trip" ? bookable.trip.title : bookable.experience.title;
  const image = bookable.type === "hotel" ? bookable.hotel.images[0] : bookable.type === "trip" ? bookable.trip.images[0] : bookable.experience.images[0];
  return (
    <div>
      <div className="flex gap-3">
        <span className="relative size-20 shrink-0 overflow-hidden rounded-md bg-sand">
          <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl leading-tight text-ink">{title}</p>
          {quote.ok && (
            <p className="mt-1 flex items-center gap-1 text-[0.8125rem] text-muted">
              <MapPin className="size-3.5" aria-hidden />
              {quote.snapshot.destinationName}
            </p>
          )}
        </div>
      </div>
      {quote.ok ? (
        <>
          <dl className="mt-4 space-y-2 border-y border-line py-4 text-sm">
            <div className="flex gap-2">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              <dd>
                {bookable.type === "hotel" ? (
                  <>
                    {formatDateShort(quote.startDate)} – {formatDateShort(quote.endDate)} · {plural(diffDays(quote.startDate, quote.endDate), "night")}
                  </>
                ) : bookable.type === "trip" ? (
                  formatDateRange(quote.startDate, quote.endDate)
                ) : (
                  <>
                    {formatDateLong(quote.startDate)} · {quote.snapshot.timeSlot}
                  </>
                )}
              </dd>
            </div>
            <div className="flex gap-2">
              <Users className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              <dd>{guestsLabel(party.adults, party.children, bookable.type === "hotel" ? party.rooms : undefined)}</dd>
            </div>
            {quote.snapshot.roomName && <dd className="font-medium text-ink">{quote.snapshot.roomName}</dd>}
            <dd className={cn("text-[0.8125rem] font-medium", quote.cancellation.type === "free" ? "text-success" : "text-muted")}>
              {deadline ? `Free cancellation until ${formatDateShort(deadline)}` : quote.cancellation.summary}
            </dd>
          </dl>
          <PriceBreakdown price={quote.price} compact className="mt-4" />
        </>
      ) : (
        <p className="mt-4 text-sm text-muted">{quote.reason}</p>
      )}
    </div>
  );
}
