// One place for the money rules. The browser and the server both use it,
// so the total the customer sees is the total the café records.
// Amounts are kept in fils (1 AED = 100 fils) to avoid rounding drift.

export const VAT_RATE = 0.05;
// Every Al Farooj Al Shami menu prints "All prices include 5% VAT".
// The customer pays the printed price; the VAT inside it is worked out and
// shown on the invoice. Set to false only if the accountant says otherwise.
export const PRICES_INCLUDE_VAT = true;
// Delivery fee per branch lives in src/data.js (deliveryFee, in AED).
// VAT on the delivery fee: ask the accountant before charging a fee.
export const VAT_ON_DELIVERY = false;

export const ORDER_TYPES = [
  { id: "delivery", label: "Delivery", hint: "To your door" },
  { id: "pickup", label: "Pickup", hint: "Collect at the branch" },
];

export const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", hint: "Pay the rider or the counter in cash" },
  { id: "card_machine", label: "Card machine", hint: "The rider brings a card machine" },
  { id: "online", label: "Online card", hint: "Visa, Mastercard, Apple Pay via Stripe" },
];

export const ORDER_STATUSES = [
  { id: "new", label: "New" },
  { id: "accepted", label: "Accepted" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "collected", label: "Collected" },
  { id: "cancelled", label: "Cancelled" },
];

export const PAYMENT_STATUSES = [
  { id: "pending", label: "To collect" },
  { id: "awaiting_online", label: "Awaiting online payment" },
  { id: "paid", label: "Paid" },
  { id: "failed", label: "Payment failed" },
  { id: "refunded", label: "Refunded" },
];

export function labelOf(list, id) {
  return list.find((entry) => entry.id === id)?.label || id || "";
}

export function toFils(aedValue) {
  return Math.round(Number(aedValue) * 100);
}

// items = what the printed prices add up to. subtotal = the same before VAT.
// total = items + delivery (+ VAT on delivery only if switched on).
export function totals(lines, orderType, deliveryFeeAed = 0) {
  const items = lines.reduce((sum, line) => sum + toFils(line.price) * line.qty, 0);
  const delivery = orderType === "delivery" && items > 0 ? toFils(deliveryFeeAed || 0) : 0;
  const deliveryVat = VAT_ON_DELIVERY ? Math.round(delivery * VAT_RATE) : 0;
  const itemsVat = PRICES_INCLUDE_VAT ? Math.round((items * VAT_RATE) / (1 + VAT_RATE)) : Math.round(items * VAT_RATE);
  const subtotal = PRICES_INCLUDE_VAT ? items - itemsVat : items;
  const vat = itemsVat + deliveryVat;
  return { items, subtotal, vat, delivery, total: subtotal + vat + delivery };
}

export function money(fils) {
  const value = (Number(fils) || 0) / 100;
  return `AED ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
