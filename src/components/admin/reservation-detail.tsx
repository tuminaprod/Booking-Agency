"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CircleDot } from "lucide-react";
import type { Booking } from "@/lib/models";
import { todayISO } from "@/lib/dates";
import { formatDateLong, formatMoney, guestsLabel } from "@/lib/format";
import { quoteRefund } from "@/lib/booking/cancellation";
import { availableActions, createRefundCase, REFUND_ACTION_LABEL, transition, type RefundCase } from "@/lib/admin/refund-workflow";
import { useSession } from "@/lib/auth";
import { PriceBreakdown } from "@/components/booking/price-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

const TONE = { confirmed: "success", pending: "warning", cancelled: "danger", completed: "neutral" } as const;
const REASONS = ["Guest request", "Property unable to accommodate", "Force majeure / travel disruption", "Duplicate booking", "Payment dispute", "Other"];

export function ReservationDetail({ booking: initial, customerSince }: { booking: Booking; customerSince?: string }) {
  const toast = useToast();
  const admin = useSession();
  const actor = admin ? `${admin.firstName} ${admin.lastName}` : "Admin";
  const [booking, setBooking] = useState(initial);
  const [refundCase, setRefundCase] = useState<RefundCase | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const policy = quoteRefund(booking, todayISO());
  const [amount, setAmount] = useState(String(policy.refundAmount));
  const [amountError, setAmountError] = useState<string>();
  const refundable = booking.payment.amount - booking.payment.refundedAmount;

  const startRefund = (value: number, why: string) => {
    setRefundCase(createRefundCase(booking.reference, value, why, actor));
  };

  const confirmCancel = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0 || value > refundable) return setAmountError(`Enter an amount between $0 and ${formatMoney(refundable, "USD", { cents: true })}`);
    setBooking((b) => ({ ...b, status: "cancelled" }));
    if (value > 0) startRefund(value, `${reason}${note ? ` — ${note}` : ""}`);
    setCancelOpen(false);
    toast.success(`Reservation ${booking.reference} cancelled`, value > 0 ? `Refund of ${formatMoney(value, "USD", { cents: true })} opened for approval.` : "No refund issued.");
  };

  const act = (a: Parameters<typeof transition>[1]) => {
    if (!refundCase) return;
    const next = transition(refundCase, a, a === "settle" || a === "fail" ? "Payment provider (simulated)" : actor);
    setRefundCase(next);
    if (next.state === "refunded") {
      setBooking((b) => ({ ...b, payment: { ...b.payment, refundedAmount: b.payment.refundedAmount + next.amount, status: b.payment.refundedAmount + next.amount >= b.payment.amount ? "refunded" : "partially-refunded" } }));
      toast.success("Refund settled", `${formatMoney(next.amount, "USD", { cents: true })} returned to the customer.`);
    }
  };

  return (
    <div>
      <Link href="/admin/reservations" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All reservations
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-sm tracking-wider text-gold">{booking.reference}</p>
          <h1 className="font-display text-4xl text-ink">{booking.item.title}</h1>
          <p className="text-muted">
            {formatDateLong(booking.startDate)} – {formatDateLong(booking.endDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TONE[booking.status]} className="h-8 px-3 text-sm">
            {booking.status}
          </Badge>
          {booking.status !== "cancelled" && booking.status !== "completed" && (
            <Button variant="secondary" className="border-danger/40 text-danger hover:bg-danger-tint" onClick={() => setCancelOpen(true)}>
              Cancel reservation
            </Button>
          )}
          {booking.status === "cancelled" && !refundCase && refundable > 0 && (
            <Button variant="secondary" onClick={() => setRefundOpen(true)}>
              Issue refund
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-line bg-surface p-5" aria-labelledby="bk">
          <h2 id="bk" className="mb-3 font-semibold text-ink">
            Booking
          </h2>
          <dl className="space-y-2 text-sm">
            {[
              ["Type", booking.type],
              ["Destination", booking.item.destinationName],
              ["Room / slot", booking.item.roomName ?? booking.item.timeSlot ?? "—"],
              ["Guests", guestsLabel(booking.guests.adults, booking.guests.children, booking.type === "hotel" ? booking.guests.rooms : undefined)],
              ["Booked", new Date(booking.createdAt).toLocaleString("en-GB")],
              ["Cancellation", booking.cancellation.summary],
              ["Promo", booking.promoCode ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7rem_1fr] gap-2">
                <dt className="text-muted">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {booking.specialRequests && <p className="mt-3 rounded-md bg-sand p-3 text-sm">“{booking.specialRequests}”</p>}
        </section>

        <section className="rounded-lg border border-line bg-surface p-5" aria-labelledby="cust">
          <h2 id="cust" className="mb-3 font-semibold text-ink">
            Customer
          </h2>
          <p className="font-medium text-ink">
            {booking.leadGuest.firstName} {booking.leadGuest.lastName}
          </p>
          <p className="text-sm text-muted">{booking.leadGuest.email}</p>
          <p className="text-sm text-muted">{booking.leadGuest.phone}</p>
          <p className="text-sm text-muted">{booking.leadGuest.country}</p>
          {customerSince && <p className="mt-3 text-xs text-muted">Customer since {new Date(customerSince).getFullYear()}</p>}
          <a href={`mailto:${booking.leadGuest.email}?subject=${encodeURIComponent(`Your booking ${booking.reference}`)}`} className="mt-4 inline-block text-sm font-medium text-navy hover:underline">
            Email customer
          </a>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5" aria-labelledby="pay">
          <h2 id="pay" className="mb-3 font-semibold text-ink">
            Payment
          </h2>
          <dl className="mb-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Transaction</dt>
              <dd className="font-mono text-xs">{booking.payment.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Method</dt>
              <dd className="uppercase">
                {booking.payment.cardBrand} •••• {booking.payment.last4}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Status</dt>
              <dd className="capitalize">{booking.payment.status.replace("-", " ")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Captured</dt>
              <dd className="tabular-nums">{formatMoney(booking.payment.amount, "USD", { cents: true })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Refunded</dt>
              <dd className="tabular-nums">{formatMoney(booking.payment.refundedAmount, "USD", { cents: true })}</dd>
            </div>
          </dl>
          <details>
            <summary className="cursor-pointer text-sm font-medium text-navy">Price breakdown</summary>
            <PriceBreakdown price={booking.price} compact className="mt-3" />
          </details>
        </section>
      </div>

      {refundCase && (
        <section className="mt-6 rounded-lg border border-line bg-surface p-5" aria-labelledby="rf">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="rf" className="font-semibold text-ink">
              Refund {formatMoney(refundCase.amount, "USD", { cents: true })} · <span className="capitalize">{refundCase.state}</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {availableActions(refundCase.state).map((a) => (
                <Button key={a} size="sm" variant={a === "reject" || a === "fail" ? "secondary" : "primary"} onClick={() => act(a)}>
                  {REFUND_ACTION_LABEL[a]}
                </Button>
              ))}
            </div>
          </div>
          <ol className="mt-4 space-y-3 border-l border-line pl-5">
            {refundCase.events.map((e, i) => (
              <li key={i} className="relative text-sm">
                <CircleDot className="absolute -left-[27px] top-0.5 size-3.5 bg-surface text-gold" aria-hidden />
                <span className="font-medium capitalize text-ink">{e.state}</span> <span className="text-muted">· {e.actor} · {new Date(e.at).toLocaleTimeString("en-GB")}</span>
                {e.note && <p className="text-ink-soft">{e.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={`Cancel ${booking.reference}`}
        description="The customer is notified by email when you confirm."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep reservation
            </Button>
            <Button variant="danger" onClick={confirmCancel}>
              Confirm cancellation
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Alert tone="info" title="Policy guidance">
            {policy.explanation} Suggested refund: <strong>{formatMoney(policy.refundAmount, "USD", { cents: true })}</strong>.
          </Alert>
          <Field label="Reason">
            {(p) => (
              <Select id={p.id} value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Refund amount (USD)" hint={`Up to ${formatMoney(refundable, "USD", { cents: true })} was paid. Override the policy amount if needed.`} error={amountError}>
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setAmountError(undefined); }} />}
          </Field>
          <Field label="Internal note" optional>
            {(p) => <Textarea id={p.id} value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" />}
          </Field>
        </div>
      </Modal>

      <Modal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title="Issue refund"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const v = Number(amount);
                if (!Number.isFinite(v) || v <= 0 || v > refundable) return setAmountError(`Enter an amount up to ${formatMoney(refundable, "USD", { cents: true })}`);
                startRefund(v, reason);
                setRefundOpen(false);
              }}
            >
              Open refund
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Amount (USD)" error={amountError}>
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} invalid={p.invalid} inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setAmountError(undefined); }} />}
          </Field>
          <Field label="Reason">
            {(p) => (
              <Select id={p.id} value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Modal>
    </div>
  );
}
