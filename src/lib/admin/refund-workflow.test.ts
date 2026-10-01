import { describe, expect, it } from "vitest";
import { availableActions, createRefundCase, transition } from "./refund-workflow";

describe("refund workflow", () => {
  it("follows the happy path and records an audit trail", () => {
    let c = createRefundCase("OR-TEST01", 500, "Guest cancelled", "admin");
    expect(availableActions(c.state)).toEqual(["approve", "reject"]);
    c = transition(c, "approve", "admin");
    c = transition(c, "process", "admin");
    c = transition(c, "settle", "provider");
    expect(c.state).toBe("refunded");
    expect(c.events.map((e) => e.state)).toEqual(["requested", "approved", "processing", "refunded"]);
  });

  it("rejects illegal transitions", () => {
    const c = createRefundCase("OR-TEST02", 100, "Duplicate", "admin");
    expect(() => transition(c, "settle", "admin")).toThrow();
  });

  it("allows retry after a failed provider refund", () => {
    let c = createRefundCase("OR-TEST03", 100, "Duplicate", "admin");
    c = transition(transition(transition(c, "approve", "a"), "process", "a"), "fail", "provider");
    expect(availableActions(c.state)).toEqual(["retry"]);
    expect(transition(c, "retry", "a").state).toBe("processing");
  });
});
