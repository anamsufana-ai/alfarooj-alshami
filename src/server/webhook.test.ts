import Stripe from "stripe";
import { describe, expect, it } from "vitest";

describe("Stripe webhook signatures", () => {
  it("accepts a matching test signature and rejects a different secret", () => {
    const stripe = new Stripe("sk_test_123");
    const payload = JSON.stringify({
      id: "evt_signature",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test", object: "checkout.session", metadata: { orderId: "order_1" } } },
    });
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test" });
    const event = stripe.webhooks.constructEvent(payload, header, "whsec_test");
    expect(event.id).toBe("evt_signature");
    expect(() => stripe.webhooks.constructEvent(payload, header, "whsec_other")).toThrow();
  });
});
