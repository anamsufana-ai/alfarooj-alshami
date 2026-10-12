export const FULFILLMENT_STATUSES = [
  "pending_payment",
  "confirmed",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];
export type FulfillmentType = "delivery" | "pickup";
export type ActorKind = "customer" | "staff" | "payment";

const STAFF_EDGES: Record<string, FulfillmentStatus[]> = {
  confirmed: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["cancelled"],
  ready_for_pickup: ["delivered", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
};

export function canTransition(input: {
  from: FulfillmentStatus;
  to: FulfillmentStatus;
  actor: ActorKind;
  fulfillmentType: FulfillmentType;
}): boolean {
  const { from, to, actor, fulfillmentType } = input;
  if (from === to) return false;
  if (actor === "payment" && from === "pending_payment" && to === "confirmed") return true;
  if (actor === "payment" && to === "refunded" && from !== "pending_payment" && from !== "cancelled") {
    return true;
  }
  if (actor === "customer" && from === "pending_payment" && to === "cancelled") return true;
  if (actor !== "staff") return false;
  if (from === "preparing" && to === "ready_for_pickup") return fulfillmentType === "pickup";
  if (from === "preparing" && to === "out_for_delivery") return fulfillmentType === "delivery";
  return STAFF_EDGES[from]?.includes(to) ?? false;
}
