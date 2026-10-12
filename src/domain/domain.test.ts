import { describe, expect, it } from "vitest";
import { canRecordDriverLocation, locationExpiresAt, roundCoordinate } from "./location-policy";
import { includedVatMinor, majorToMinor } from "./money";
import { addDays, mondayOnOrBefore, periodRange } from "./periods";
import { canAccessBranch, canProcessOrders, canViewReports } from "./permissions";
import { orderTotal, quoteLines, type PricedItem } from "./pricing";
import { summarizeOrders } from "./reports";
import { canTransition } from "./transitions";

const item: PricedItem = {
  id: "hummus",
  branchId: "b1",
  nameEn: "Homus",
  nameAr: "حمص",
  priceMinor: 1300,
  isAvailable: true,
  reviewStatus: "pending_review",
  groups: [
    {
      id: "g1",
      nameEn: "Choice",
      nameAr: "الخيار",
      required: true,
      minSelect: 1,
      maxSelect: 1,
      choices: [
        { id: "half", nameEn: "Half", nameAr: "نصف", priceDeltaMinor: 0, absolutePriceMinor: 2300 },
        { id: "full", nameEn: "Full", nameAr: "كامل", priceDeltaMinor: 0, absolutePriceMinor: 4500 },
      ],
    },
  ],
};

describe("money and totals", () => {
  it("converts printed prices to fils", () => {
    expect(majorToMinor("21")).toBe(2100);
    expect(majorToMinor("6.50")).toBe(650);
    expect(majorToMinor("3.15")).toBe(315);
    expect(majorToMinor("46.50")).toBe(4650);
  });

  it("prices a required absolute choice and refuses a missing one", () => {
    const chosen = quoteLines([item], [{ itemId: "hummus", quantity: 2, choiceIds: ["half"] }]);
    expect(chosen.errors).toEqual([]);
    expect(chosen.lines[0].lineTotalMinor).toBe(4600);
    const missing = quoteLines([item], [{ itemId: "hummus", quantity: 1, choiceIds: [] }]);
    expect(missing.errors[0]).toContain("choices");
    expect(orderTotal({ subtotalMinor: 4600, discountMinor: 0, deliveryFeeMinor: 0 })).toBe(4600);
  });

  it("calculates included VAT without adding it again", () => {
    expect(includedVatMinor(10500, 500)).toBe(500);
  });
});

describe("order transitions", () => {
  it("allows payment confirmation and blocks staff from skipping to delivered", () => {
    expect(canTransition({ from: "pending_payment", to: "confirmed", actor: "payment", fulfillmentType: "delivery" })).toBe(true);
    expect(canTransition({ from: "confirmed", to: "delivered", actor: "staff", fulfillmentType: "delivery" })).toBe(false);
    expect(canTransition({ from: "preparing", to: "out_for_delivery", actor: "staff", fulfillmentType: "pickup" })).toBe(false);
    expect(canTransition({ from: "preparing", to: "ready_for_pickup", actor: "staff", fulfillmentType: "pickup" })).toBe(true);
    expect(canTransition({ from: "pending_payment", to: "cancelled", actor: "customer", fulfillmentType: "delivery" })).toBe(true);
    expect(canTransition({ from: "confirmed", to: "cancelled", actor: "customer", fulfillmentType: "delivery" })).toBe(false);
  });
});

describe("permissions and reports", () => {
  const branchAdmin = { id: "u", role: "branch_admin" as const, branchIds: ["a"], disabled: false };
  it("stops a branch admin from another branch", () => {
    expect(canAccessBranch(branchAdmin, "b")).toBe(false);
    expect(canProcessOrders(branchAdmin, "a")).toBe(true);
    expect(canViewReports(branchAdmin, null)).toBe(false);
  });

  it("does not count unpaid orders as sales and subtracts refunds once", () => {
    const totals = summarizeOrders([
      { paymentStatus: "paid", fulfillmentStatus: "confirmed", subtotalMinor: 2000, discountMinor: 0, deliveryFeeMinor: 0, includedVatMinor: 95, totalMinor: 2000 },
      { paymentStatus: "unpaid", fulfillmentStatus: "pending_payment", subtotalMinor: 500, discountMinor: 0, deliveryFeeMinor: 0, includedVatMinor: null, totalMinor: 500 },
      { paymentStatus: "refunded", fulfillmentStatus: "refunded", subtotalMinor: 800, discountMinor: 0, deliveryFeeMinor: 0, includedVatMinor: 38, totalMinor: 800 },
      { paymentStatus: "failed", fulfillmentStatus: "cancelled", subtotalMinor: 100, discountMinor: 0, deliveryFeeMinor: 0, includedVatMinor: null, totalMinor: 100 },
    ]);
    expect(totals.grossSalesMinor).toBe(2000);
    expect(totals.refundsMinor).toBe(800);
    expect(totals.netMinor).toBe(1200);
    expect(totals.paidCount).toBe(1);
    expect(totals.placedCount).toBe(4);
  });
});

describe("Dubai periods and location privacy", () => {
  it("uses Asia/Dubai midnights and Monday weeks", () => {
    const day = periodRange("day", "2026-10-12");
    expect(day.start.toISOString()).toBe("2026-10-11T20:00:00.000Z");
    expect(day.end.toISOString()).toBe("2026-10-12T20:00:00.000Z");
    expect(mondayOnOrBefore("2026-10-12")).toBe("2026-10-12");
    expect(addDays("2026-10-12", 1)).toBe("2026-10-13");
  });

  it("records a driver only during an active consented delivery", () => {
    expect(canRecordDriverLocation({
      consent: true,
      role: "driver",
      assignmentActive: true,
      fulfillmentStatus: "out_for_delivery",
      shiftOpen: true,
    })).toBe(true);
    expect(canRecordDriverLocation({
      consent: true,
      role: "driver",
      assignmentActive: true,
      fulfillmentStatus: "delivered",
      shiftOpen: true,
    })).toBe(false);
    expect(roundCoordinate(25.123456)).toBe(25.1235);
    expect(locationExpiresAt(new Date("2026-10-12T00:00:00Z"), 7).toISOString()).toBe("2026-10-19T00:00:00.000Z");
  });
});
