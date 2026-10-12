export type ReportOrder = {
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  fulfillmentStatus: string;
  subtotalMinor: number;
  discountMinor: number;
  deliveryFeeMinor: number;
  includedVatMinor: number | null;
  totalMinor: number;
};

export type ReportTotals = {
  placedCount: number;
  paidCount: number;
  cancelledUnpaidCount: number;
  refundedCount: number;
  grossSalesMinor: number;
  discountsMinor: number;
  feesMinor: number;
  includedVatMinor: number;
  refundsMinor: number;
  netMinor: number;
};

/**
 * Gross sales are the order totals of paid orders, including delivery fees and
 * after discounts. Included VAT is informational and is not added again.
 * Refunds are the totals of refunded orders and are subtracted once.
 * Unpaid, pending, and failed orders are counted as placed but not as sales.
 * A cancelled unpaid order is not a sale. A paid order that is later marked
 * refunded is counted as a refund, not also as a current sale.
 */
export function summarizeOrders(orders: ReportOrder[]): ReportTotals {
  const totals: ReportTotals = {
    placedCount: orders.length,
    paidCount: 0,
    cancelledUnpaidCount: 0,
    refundedCount: 0,
    grossSalesMinor: 0,
    discountsMinor: 0,
    feesMinor: 0,
    includedVatMinor: 0,
    refundsMinor: 0,
    netMinor: 0,
  };
  for (const order of orders) {
    if (order.paymentStatus === "paid") {
      totals.paidCount += 1;
      totals.grossSalesMinor += order.totalMinor;
      totals.discountsMinor += order.discountMinor;
      totals.feesMinor += order.deliveryFeeMinor;
      totals.includedVatMinor += order.includedVatMinor ?? 0;
    } else if (order.paymentStatus === "refunded") {
      totals.refundedCount += 1;
      totals.refundsMinor += order.totalMinor;
    } else if (order.fulfillmentStatus === "cancelled") {
      totals.cancelledUnpaidCount += 1;
    }
  }
  totals.netMinor = totals.grossSalesMinor - totals.refundsMinor;
  return totals;
}
