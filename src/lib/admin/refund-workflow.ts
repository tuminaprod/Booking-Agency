/**
 * Refund workflow architecture.
 *
 *   requested ──approve──▶ approved ──process──▶ processing ──settle──▶ refunded
 *       │                     │                       │
 *       └──reject──▶ rejected └──reject──▶ rejected   └──fail──▶ failed ──retry──▶ processing
 *
 * Each transition is recorded as an audit event. In production `process`
 * would call the payment provider's refund API and `settle`/`fail` would be
 * driven by its webhook.
 */
export type RefundState = "requested" | "approved" | "processing" | "refunded" | "rejected" | "failed";
export type RefundAction = "approve" | "reject" | "process" | "settle" | "fail" | "retry";

export interface RefundEvent {
  at: string;
  action: RefundAction | "request";
  actor: string;
  note?: string;
  state: RefundState;
}

export interface RefundCase {
  id: string;
  bookingRef: string;
  amount: number;
  reason: string;
  state: RefundState;
  events: RefundEvent[];
}

const TRANSITIONS: Record<RefundState, Partial<Record<RefundAction, RefundState>>> = {
  requested: { approve: "approved", reject: "rejected" },
  approved: { process: "processing", reject: "rejected" },
  processing: { settle: "refunded", fail: "failed" },
  failed: { retry: "processing" },
  refunded: {},
  rejected: {},
};

export const availableActions = (state: RefundState): RefundAction[] => Object.keys(TRANSITIONS[state]) as RefundAction[];

export function createRefundCase(bookingRef: string, amount: number, reason: string, actor: string, now = new Date().toISOString()): RefundCase {
  return { id: `rf_${bookingRef}`, bookingRef, amount, reason, state: "requested", events: [{ at: now, action: "request", actor, note: reason, state: "requested" }] };
}

export function transition(c: RefundCase, action: RefundAction, actor: string, note?: string, now = new Date().toISOString()): RefundCase {
  const next = TRANSITIONS[c.state][action];
  if (!next) throw new Error(`Cannot ${action} a refund that is ${c.state}`);
  return { ...c, state: next, events: [...c.events, { at: now, action, actor, note, state: next }] };
}

export const REFUND_ACTION_LABEL: Record<RefundAction, string> = {
  approve: "Approve refund",
  reject: "Reject",
  process: "Send to payment provider",
  settle: "Mark as settled",
  fail: "Mark as failed",
  retry: "Retry",
};
