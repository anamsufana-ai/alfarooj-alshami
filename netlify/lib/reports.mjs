// Sales reports: group orders by day, week, month or year, per branch.
// Cancelled orders are listed in the counts but never added to sales.

export function isoWeek(day) {
  const date = new Date(`${day}T00:00:00Z`);
  const weekday = (date.getUTCDay() + 6) % 7; // Monday = 0
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() - weekday + 3);
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const week =
    1 + Math.round(((thursday - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - weekday);
  return { label: `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`, start: monday.toISOString().slice(0, 10) };
}

export function periodOf(day, group) {
  if (group === "year") return day.slice(0, 4);
  if (group === "month") return day.slice(0, 7);
  if (group === "week") {
    const { label, start } = isoWeek(day);
    return `${label} (from ${start})`;
  }
  return day;
}

function emptyRow(period, branchId) {
  return {
    period,
    branchId,
    orders: 0,
    cancelled: 0,
    subtotal: 0,
    vat: 0,
    delivery: 0,
    total: 0,
    cash: 0,
    card_machine: 0,
    online: 0,
    paid: 0,
    unpaid: 0,
    deliveryOrders: 0,
    pickupOrders: 0,
  };
}

function addOrder(row, order) {
  if (order.status === "cancelled") {
    row.cancelled += 1;
    return;
  }
  row.orders += 1;
  row.subtotal += order.subtotal;
  row.vat += order.vat;
  row.delivery += order.delivery;
  row.total += order.total;
  row[order.paymentMethod] = (row[order.paymentMethod] || 0) + order.total;
  if (order.paymentStatus === "paid") row.paid += order.total;
  else row.unpaid += order.total;
  if (order.orderType === "delivery") row.deliveryOrders += 1;
  else row.pickupOrders += 1;
}

export function buildReport(orders, group) {
  const rows = new Map();
  const branchTotals = new Map();
  const items = new Map();
  const grand = emptyRow("All", "all");

  for (const order of orders) {
    const period = periodOf(order.day, group);
    const key = `${period}|${order.branchId}`;
    if (!rows.has(key)) rows.set(key, emptyRow(period, order.branchId));
    if (!branchTotals.has(order.branchId)) branchTotals.set(order.branchId, emptyRow("All", order.branchId));
    addOrder(rows.get(key), order);
    addOrder(branchTotals.get(order.branchId), order);
    addOrder(grand, order);
    if (order.status === "cancelled") continue;
    for (const line of order.lines) {
      const itemKey = `${order.branchId}|${line.name}`;
      const entry = items.get(itemKey) || { branchId: order.branchId, name: line.name, qty: 0, sales: 0 };
      entry.qty += line.qty;
      entry.sales += line.total;
      items.set(itemKey, entry);
    }
  }

  return {
    group,
    rows: [...rows.values()].sort((a, b) => (a.period < b.period ? 1 : a.period > b.period ? -1 : a.branchId.localeCompare(b.branchId))),
    branches: [...branchTotals.values()].sort((a, b) => a.branchId.localeCompare(b.branchId)),
    grand,
    topItems: [...items.values()].sort((a, b) => b.sales - a.sales).slice(0, 15),
  };
}
