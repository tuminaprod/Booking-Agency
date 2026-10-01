"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, CheckCircle2, Clock, Download, ExternalLink, FileSearch, Mail, MapPin, Navigation, Phone, Printer, Settings2, ShieldCheck, Users, XCircle } from "lucide-react";
import type { Booking } from "@/lib/models";
import { cn } from "@/lib/cn";
import { diffDays, todayISO } from "@/lib/dates";
import { formatDateLong, formatDateShort, guestsLabel, plural } from "@/lib/format";
import { freeCancellationDeadline, quoteRefund } from "@/lib/booking/cancellation";
import { bookingToHtml, bookingToIcs, downloadFile } from "@/lib/booking/documents";
import { bookingsStore, updateBooking } from "@/lib/stores";
import { useHydrated } from "@/lib/stores/create-store";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Alert, EmptyState, Skeleton } from "@/components/ui/feedback";
import { Money } from "@/components/ui/money";
import { useToast } from "@/components/ui/toast";
import { PriceBreakdown } from "./price-breakdown";

const STATUS: Record<Booking["status"], { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  confirmed: { label: "Confirmed", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "danger" },
  completed: { label: "Completed", tone: "neutral" },
};
const PAYMENT_LABEL: Record<Booking["payment"]["status"], string> = {
  paid: "Paid",
  authorized: "Authorised — charged at confirmation",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
  "partially-refunded": "Partially refunded",
};

export function useBooking(reference: string, seed?: Booking): Booking | undefined {
  const items = bookingsStore.use((s) => s.items);
  const overrides = bookingsStore.use((s) => s.overrides);
  const base = items.find((b) => b.reference === reference) ?? seed;
  if (!base) return undefined;
  const o = overrides[reference];
  return o ? { ...base, ...o } : base;
}

export function BookingView({ reference, seed, isNew }: { reference: string; seed?: Booking; isNew?: boolean }) {
  const hydrated = useHydrated();
  const booking = useBooking(reference, seed);
  const toast = useToast();
  const [manageOpen, setManageOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!hydrated && !seed) {
    return (
      <div className="container-page max-w-4xl space-y-4 py-12" aria-busy>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="container-page max-w-3xl py-16">
        <EmptyState
          icon={<FileSearch className="size-6" aria-hidden />}
          title="We couldn't find that booking"
          description={`No booking with reference ${reference} is saved on this device. Sign in to see bookings linked to your account, or check the reference in your confirmation email.`}
          action={
            <>
              <ButtonLink href="/account?tab=trips">Go to My Trips</ButtonLink>
              <ButtonLink href="/help" variant="secondary">
                Contact support
              </ButtonLink>
            </>
          }
        />
      </div>
    );
  }

  const today = todayISO();
  const refund = quoteRefund(booking, today);
  const deadline = freeCancellationDeadline(booking.cancellation, booking.startDate);
  const status = STATUS[booking.status];
  const nights = diffDays(booking.startDate, booking.endDate);
  const directions = booking.item.coordinates ? `https://www.google.com/maps/dir/?api=1&destination=${booking.item.coordinates.lat},${booking.item.coordinates.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.item.address ?? booking.item.destinationName)}`;
  const itemHref = `/${booking.type === "hotel" ? "hotels" : booking.type === "trip" ? "trips" : "experiences"}/${booking.item.slug}`;

  const doCancel = () => {
    updateBooking(booking.reference, {
      status: "cancelled",
      payment: { ...booking.payment, refundedAmount: booking.payment.refundedAmount + refund.refundAmount, status: refund.refundPercent === 100 ? "refunded" : refund.refundAmount > 0 ? "partially-refunded" : booking.payment.status },
    });
    setConfirmCancel(false);
    setManageOpen(false);
    toast.success("Booking cancelled", refund.refundAmount > 0 ? "Your refund is on its way — allow 5–10 business days." : "No refund was due under this rate.");
  };

  const action = "inline-flex h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-sand/60";

  return (
    <div className="container-page max-w-5xl pb-16 pt-8">
      {isNew && booking.status !== "cancelled" && (
        <div className="mb-8 animate-rise-in rounded-xl border border-success/20 bg-success-tint p-6 sm:p-8" role="status">
          <CheckCircle2 className="size-10 text-success" aria-hidden />
          <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">You&apos;re going to {booking.item.destinationName}!</h1>
          <p className="mt-2 text-ink-soft">
            Your booking is confirmed and a confirmation has been sent to <strong className="font-semibold">{booking.leadGuest.email}</strong>.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Confirmation number</p>
          <p className="font-display text-3xl tracking-[0.08em] text-gold">{booking.reference}</p>
        </div>
        <Badge tone={status.tone} className="h-8 self-start px-3 text-sm sm:self-auto">
          {status.label}
        </Badge>
      </div>

      <div data-no-print className="mt-6 flex flex-wrap gap-2">
        {isNew && (
          <ButtonLink href={`/booking/${booking.reference}`} variant="primary" iconLeft={<FileSearch className="size-4" aria-hidden />}>
            View booking
          </ButtonLink>
        )}
        <button type="button" className={action} onClick={() => downloadFile(`Oriel-${booking.reference}.html`, bookingToHtml(booking), "text/html")}>
          <Download className="size-4" aria-hidden /> Download confirmation
        </button>
        <button type="button" className={action} onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden /> Print
        </button>
        <button type="button" className={action} onClick={() => downloadFile(`Oriel-${booking.reference}.ics`, bookingToIcs(booking), "text/calendar")}>
          <CalendarPlus className="size-4" aria-hidden /> Add to calendar
        </button>
        <button type="button" className={action} onClick={() => setContactOpen(true)}>
          <Phone className="size-4" aria-hidden /> Contact {booking.type === "hotel" ? "property" : "operator"}
        </button>
        {booking.status !== "cancelled" && booking.status !== "completed" && (
          <button type="button" className={action} onClick={() => setManageOpen(true)}>
            <Settings2 className="size-4" aria-hidden /> Manage booking
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-line bg-surface" aria-labelledby="res-title">
            <div className="relative aspect-[21/9] bg-sand">
              <Image src={booking.item.image.src} alt={booking.item.image.alt} fill sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" />
            </div>
            <div className="p-6">
              <h2 id="res-title" className="font-display text-3xl text-ink">
                <Link href={itemHref} className="hover:underline">
                  {booking.item.title}
                </Link>
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="size-4" aria-hidden /> {booking.item.address ?? booking.item.destinationName}
              </p>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted">{booking.type === "hotel" ? "Check-in" : "Starts"}</dt>
                  <dd className="font-semibold text-ink">{formatDateLong(booking.startDate)}</dd>
                  {booking.item.checkInTime && <dd className="text-sm text-muted">From {booking.item.checkInTime}</dd>}
                  {booking.item.timeSlot && <dd className="text-sm text-muted">{booking.item.timeSlot}</dd>}
                </div>
                <div>
                  <dt className="text-sm text-muted">{booking.type === "hotel" ? "Check-out" : "Ends"}</dt>
                  <dd className="font-semibold text-ink">{formatDateLong(booking.endDate)}</dd>
                  {booking.item.checkOutTime && <dd className="text-sm text-muted">Until {booking.item.checkOutTime}</dd>}
                </div>
                <div>
                  <dt className="text-sm text-muted">Guests</dt>
                  <dd className="flex items-center gap-1.5 font-semibold text-ink">
                    <Users className="size-4 text-muted" aria-hidden />
                    {guestsLabel(booking.guests.adults, booking.guests.children, booking.type === "hotel" ? booking.guests.rooms : undefined)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{booking.type === "hotel" ? "Room" : "Duration"}</dt>
                  <dd className="font-semibold text-ink">{booking.item.roomName ?? (booking.type === "trip" ? plural(nights + 1, "day") : booking.item.timeSlot)}</dd>
                  {booking.type === "hotel" && <dd className="text-sm text-muted">{plural(nights, "night")}</dd>}
                </div>
              </dl>
              <a href={directions} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-navy hover:underline" data-no-print>
                <Navigation className="size-4" aria-hidden /> Get directions <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6" aria-labelledby="guest-title">
            <h2 id="guest-title" className="font-semibold text-ink">
              Guest information
            </h2>
            <dl className="mt-3 grid gap-3 text-[0.9375rem] sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted">Lead guest</dt>
                <dd>
                  {booking.leadGuest.firstName} {booking.leadGuest.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Country</dt>
                <dd>{booking.leadGuest.country}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Email</dt>
                <dd className="break-all">{booking.leadGuest.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Phone</dt>
                <dd>{booking.leadGuest.phone}</dd>
              </div>
              {booking.specialRequests && (
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted">Special requests</dt>
                  <dd>{booking.specialRequests}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6" aria-labelledby="cancel-title">
            <h2 id="cancel-title" className="flex items-center gap-2 font-semibold text-ink">
              <ShieldCheck className="size-5 text-muted" aria-hidden /> Cancellation policy
            </h2>
            <p className="mt-2 text-[0.9375rem] text-ink-soft">{booking.cancellation.summary}.</p>
            {deadline && booking.status === "confirmed" && (
              <p className={cn("mt-1 text-[0.9375rem] font-medium", today <= deadline ? "text-success" : "text-muted")}>
                {today <= deadline ? `Free cancellation until ${formatDateLong(deadline)}.` : `The free cancellation window closed on ${formatDateShort(deadline)}.`}
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="pay-title">
            <h2 id="pay-title" className="mb-4 font-semibold text-ink">
              Payment
            </h2>
            <dl className="mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Status</dt>
                <dd className="font-medium text-ink">{PAYMENT_LABEL[booking.payment.status]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Card</dt>
                <dd className="font-medium uppercase text-ink">
                  {booking.payment.cardBrand} •••• {booking.payment.last4}
                </dd>
              </div>
              {booking.payment.refundedAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Refunded</dt>
                  <dd className="font-medium text-success">
                    <Money usd={booking.payment.refundedAmount} cents />
                  </dd>
                </div>
              )}
            </dl>
            <PriceBreakdown price={booking.price} compact />
          </section>
        </aside>
      </div>

      <Modal open={contactOpen} onClose={() => setContactOpen(false)} title={`Contact ${booking.item.title}`} description={`Reference ${booking.reference}`}>
        <ul className="space-y-3">
          {booking.item.contact ? (
            <>
              <li>
                <a href={`tel:${booking.item.contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 rounded-lg border border-line p-4 hover:bg-sand/50">
                  <Phone className="size-5 text-gold" aria-hidden />
                  <span>
                    <span className="block font-medium">Call the property</span>
                    <span className="text-sm text-muted">{booking.item.contact.phone}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${booking.item.contact.email}?subject=${encodeURIComponent(`Booking ${booking.reference}`)}`} className="flex items-center gap-3 rounded-lg border border-line p-4 hover:bg-sand/50">
                  <Mail className="size-5 text-gold" aria-hidden />
                  <span>
                    <span className="block font-medium">Email the property</span>
                    <span className="text-sm text-muted">{booking.item.contact.email}</span>
                  </span>
                </a>
              </li>
            </>
          ) : null}
          <li>
            <Link href="/help" className="flex items-center gap-3 rounded-lg border border-line p-4 hover:bg-sand/50">
              <Clock className="size-5 text-gold" aria-hidden />
              <span>
                <span className="block font-medium">Oriel concierge — 24/7</span>
                <span className="text-sm text-muted">Changes, special requests and support</span>
              </span>
            </Link>
          </li>
        </ul>
      </Modal>

      <Modal
        open={manageOpen}
        onClose={() => {
          setManageOpen(false);
          setConfirmCancel(false);
        }}
        title="Manage booking"
        description={booking.reference}
        footer={
          confirmCancel ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
                Keep booking
              </Button>
              <Button variant="danger" onClick={doCancel} iconLeft={<XCircle className="size-4" aria-hidden />}>
                Yes, cancel booking
              </Button>
            </div>
          ) : undefined
        }
      >
        {!confirmCancel ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-line p-4">
              <p className="font-medium text-ink">Change dates or guests</p>
              <p className="mt-1 text-sm text-muted">Our concierge team can modify your booking, subject to availability and any price difference.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => { setManageOpen(false); setContactOpen(true); }}>
                Contact concierge
              </Button>
            </div>
            <div className="rounded-lg border border-line p-4">
              <p className="font-medium text-ink">Cancel booking</p>
              <p className="mt-1 text-sm text-muted">{refund.explanation}</p>
              <p className="mt-2 text-sm">
                Refund: <strong className="font-semibold"><Money usd={refund.refundAmount} cents /></strong>
                {refund.retained > 0 && (
                  <span className="text-muted">
                    {" "}
                    · non-refundable <Money usd={refund.retained} cents />
                  </span>
                )}
              </p>
              <Button variant="secondary" size="sm" className="mt-3 border-danger/40 text-danger hover:bg-danger-tint" onClick={() => setConfirmCancel(true)}>
                Cancel booking
              </Button>
            </div>
          </div>
        ) : (
          <Alert tone="warning" title="Cancel this booking?">
            You&apos;ll receive <strong><Money usd={refund.refundAmount} cents /></strong> back to your {booking.payment.cardBrand.toUpperCase()} ending {booking.payment.last4}. This can&apos;t be undone.
          </Alert>
        )}
      </Modal>
    </div>
  );
}
