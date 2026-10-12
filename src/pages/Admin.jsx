import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Icon from "../components/Icon";
import { LinesTable, PaymentBadge, StatusBadge, addressText, dateTime, flowFor } from "../components/OrderBits";
import { locationById, locations } from "../data";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, labelOf, money } from "../pricing";
import { useCafe } from "../store";

const BRANCH_COLORS = { rigga: "#e98a12", intl: "#1f78a8", muweilah: "#2f7d4f", sahara: "#a3361f", ajman: "#7a3e9d" };
const TABS = [
  ["overview", "Live orders"],
  ["orders", "All orders"],
  ["reports", "Sales reports"],
  ["customers", "Customers"],
  ["bookings", "Table bookings"],
];

function dubaiToday() {
  return new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 10);
}

function shift(day, days) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

function presets() {
  const today = dubaiToday();
  return {
    today: [today, today],
    yesterday: [shift(today, -1), shift(today, -1)],
    week: [shift(today, -6), today],
    month: [`${today.slice(0, 7)}-01`, today],
    days30: [shift(today, -29), today],
    year: [`${today.slice(0, 4)}-01-01`, today],
  };
}

const PRESET_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Last 7 days",
  month: "This month",
  days30: "Last 30 days",
  year: "This year",
};

function downloadCsv(name, header, rows) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const text = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`﻿${text}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

const aedPlain = (fils) => (fils / 100).toFixed(2);

function useAdminApi() {
  const { adminToken, setAdminToken } = useCafe();
  return useCallback(
    async (path, options = {}) => {
      try {
        return await api(path, { ...options, token: adminToken });
      } catch (error) {
        if (error.status === 401) setAdminToken("");
        throw error;
      }
    },
    [adminToken, setAdminToken],
  );
}

function AdminLogin() {
  const { setAdminToken } = useCafe();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await api("/admin/login", {
        method: "POST",
        body: { password: new FormData(event.currentTarget).get("password") },
      });
      setAdminToken(token);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page narrow">
      <p className="eyebrow">Staff only</p>
      <h1>Al Farooj Al Shami admin</h1>
      <p className="muted">Orders, invoices and sales reports for all five branches.</p>
      <form className="panel stack-form" onSubmit={submit}>
        <label>
          Admin password
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn solid block" disabled={busy}>
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}

function BranchFilter({ value, onChange }) {
  return (
    <label className="inline-field">
      Branch
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">All branches</option>
        {locations.map((place) => (
          <option key={place.id} value={place.id}>
            {place.name} · {place.city}
          </option>
        ))}
      </select>
    </label>
  );
}

function RangeFilter({ from, to, onChange }) {
  const list = presets();
  return (
    <div className="range-filter">
      <div className="preset-row">
        {Object.entries(PRESET_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="chip"
            aria-pressed={list[key][0] === from && list[key][1] === to}
            onClick={() => onChange(...list[key])}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="inline-field">
        From
        <input type="date" value={from} max={to} onChange={(event) => onChange(event.target.value, to)} />
      </label>
      <label className="inline-field">
        To
        <input type="date" value={to} min={from} onChange={(event) => onChange(from, event.target.value)} />
      </label>
    </div>
  );
}

function OrderDrawer({ order, onClose, onSaved }) {
  const call = useAdminApi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [staffNote, setStaffNote] = useState(order.staffNote || "");

  async function update(patch) {
    setBusy(true);
    setError("");
    try {
      const { order: next } = await call(`/admin/orders/${order.ref}`, { method: "PATCH", body: patch });
      onSaved(next);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }

  const whatsapp = `https://wa.me/${order.customer.phone.replace(/\D/g, "").replace(/^0/, "971")}`;

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Order ${order.ref}`} onClick={(event) => event.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <p className="eyebrow">
              {order.branchName} · {dateTime(order.createdAt)}
            </p>
            <h2>{order.ref}</h2>
            <p className="badges">
              <StatusBadge status={order.status} />
              <PaymentBadge order={order} />
            </p>
          </div>
          <button type="button" className="btn ghost small" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="drawer-grid">
          <div>
            <h3>Customer</h3>
            <p>
              <strong>{order.customer.name}</strong>
              {order.customer.userId ? <span className="badge subtle">Registered</span> : <span className="badge subtle">Guest</span>}
              <br />
              <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a> ·{" "}
              <a href={whatsapp} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <br />
              <a href={`mailto:${order.customer.email}`}>{order.customer.email}</a>
            </p>
          </div>
          <div>
            <h3>{order.orderType === "delivery" ? "Delivery address" : "Pickup"}</h3>
            <p>{order.orderType === "delivery" ? addressText(order.address) : `At ${order.branchName}`}</p>
            <p className="muted">When: {order.when}</p>
            {order.note && <p className="note">Customer note: {order.note}</p>}
          </div>
        </div>

        <h3>Move the order</h3>
        <div className="status-buttons">
          {[...flowFor(order.orderType), "cancelled"].map((status) => (
            <button
              key={status}
              type="button"
              className={order.status === status ? "chip active" : "chip"}
              disabled={busy || order.status === status}
              onClick={() => update({ status })}
            >
              {labelOf(ORDER_STATUSES, status)}
            </button>
          ))}
        </div>
        <h3>Payment</h3>
        <div className="status-buttons">
          {PAYMENT_STATUSES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={order.paymentStatus === entry.id ? "chip active" : "chip"}
              disabled={busy || order.paymentStatus === entry.id}
              onClick={() => update({ paymentStatus: entry.id })}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <label className="stack-form">
          Staff note (only staff see this)
          <textarea rows="2" value={staffNote} onChange={(event) => setStaffNote(event.target.value)} />
        </label>
        <button type="button" className="btn ghost small" disabled={busy} onClick={() => update({ staffNote })}>
          Save note
        </button>
        {error && <p className="form-error">{error}</p>}

        <h3>Items</h3>
        <LinesTable order={order} />

        <p className="row-actions">
          <Link className="btn solid" to={`/invoice/${order.ref}`} target="_blank">
            <Icon name="receipt" size={18} /> Invoice
          </Link>
        </p>
        <h3>History</h3>
        <ul className="history">
          {order.history.map((entry, index) => (
            <li key={index}>
              <span>{dateTime(entry.at)}</span> {labelOf(ORDER_STATUSES, entry.status)} <small>({entry.by})</small>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function OrdersTable({ orders, onOpen }) {
  if (!orders.length) return <p className="muted">No orders here yet.</p>;
  return (
    <div className="table-wrap">
      <table className="data-table clickable">
        <thead>
          <tr>
            <th>Order</th>
            <th>Time</th>
            <th>Branch</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Payment</th>
            <th>Status</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.ref} onClick={() => onOpen(order)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onOpen(order)}>
              <td>
                <strong>{order.ref}</strong>
              </td>
              <td>{dateTime(order.createdAt)}</td>
              <td>{order.branchName}</td>
              <td>
                {order.customer.name}
                <br />
                <small className="muted">{order.customer.phone}</small>
              </td>
              <td>{order.orderType === "delivery" ? "Delivery" : "Pickup"}</td>
              <td>
                <PaymentBadge order={order} />
              </td>
              <td>
                <StatusBadge status={order.status} />
              </td>
              <td className="num">{money(order.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Overview({ branch }) {
  const call = useAdminApi();
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");

  const load = useCallback(() => {
    const today = dubaiToday();
    const since = shift(today, -1);
    Promise.all([
      call(`/admin/orders?from=${since}&to=${today}&branch=${branch}&status=open`),
      call(`/admin/reports?from=${today}&to=${today}&branch=${branch}&group=day`),
    ])
      .then(([list, summary]) => {
        setOrders(list.orders);
        setReport(summary);
        setUpdated(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Dubai" }));
        setError("");
      })
      .catch((problem) => setError(problem.message));
  }, [call, branch]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const columns = [
    ["new", "New"],
    ["accepted", "Accepted"],
    ["preparing", "Preparing"],
    ["on_the_way", "Ready / on the way"],
  ];
  const columnOf = (order) => (["ready", "out_for_delivery"].includes(order.status) ? "on_the_way" : order.status);
  const g = report?.grand;

  return (
    <>
      <div className="kpis">
        <div className="kpi">
          <span>Orders today</span>
          <strong>{g ? g.orders : "–"}</strong>
        </div>
        <div className="kpi">
          <span>Sales today (incl. VAT)</span>
          <strong>{g ? money(g.total) : "–"}</strong>
        </div>
        <div className="kpi">
          <span>VAT collected today</span>
          <strong>{g ? money(g.vat) : "–"}</strong>
        </div>
        <div className="kpi">
          <span>Still to collect</span>
          <strong>{g ? money(g.unpaid) : "–"}</strong>
        </div>
      </div>
      {report?.branches?.length > 1 && (
        <div className="branch-split">
          {report.branches.map((row) => (
            <p key={row.branchId}>
              <span className="swatch" style={{ background: BRANCH_COLORS[row.branchId] }} />
              {locationById(row.branchId).name}: <strong>{row.orders}</strong> {row.orders === 1 ? "order" : "orders"} · <strong>{money(row.total)}</strong>
            </p>
          ))}
        </div>
      )}
      <p className="muted small">
        Open orders from today and yesterday. Refreshes every 15 seconds{updated ? ` · last update ${updated}` : ""}.
      </p>
      {error && <p className="form-error">{error}</p>}
      <div className="board">
        {columns.map(([id, label]) => {
          const list = orders.filter((order) => columnOf(order) === id);
          return (
            <section key={id} className="board-col">
              <h3>
                {label} <span className="count">{list.length}</span>
              </h3>
              {list.map((order) => (
                <button key={order.ref} type="button" className={`ticket ${order.status === "new" ? "fresh" : ""}`} onClick={() => setOpen(order)}>
                  <span className="ticket-top">
                    <strong>{order.ref}</strong>
                    <span>{new Date(order.createdAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit" })}</span>
                  </span>
                  <span>
                    {order.customer.name} · {order.orderType === "delivery" ? order.address?.area : "Pickup"}
                  </span>
                  <span className="ticket-foot">
                    <span>{labelOf(PAYMENT_METHODS, order.paymentMethod)}</span>
                    <strong>{money(order.total)}</strong>
                  </span>
                </button>
              ))}
            </section>
          );
        })}
      </div>
      {open && (
        <OrderDrawer
          order={open}
          onClose={() => setOpen(null)}
          onSaved={(next) => {
            setOpen(next);
            load();
          }}
        />
      )}
    </>
  );
}

function OrdersTab({ branch }) {
  const call = useAdminApi();
  const [[from, to], setRange] = useState(presets().week);
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const query = new URLSearchParams({ from, to, branch, status, payment, q });
    call(`/admin/orders?${query}`)
      .then((data) => {
        setOrders(data.orders);
        setError("");
      })
      .catch((problem) => setError(problem.message));
  }, [call, from, to, branch, status, payment, q]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  function exportCsv() {
    downloadCsv(
      `alfarooj-orders-${from}-to-${to}.csv`,
      ["Order", "Date", "Branch", "Customer", "Email", "Phone", "Type", "Address", "Items", "Subtotal", "VAT", "Delivery", "Total", "Payment method", "Payment status", "Status"],
      (orders || []).map((order) => [
        order.ref,
        dateTime(order.createdAt),
        order.branchName,
        order.customer.name,
        order.customer.email,
        order.customer.phone,
        order.orderType,
        addressText(order.address),
        order.lines.map((line) => `${line.qty} x ${line.name}`).join("; "),
        aedPlain(order.subtotal),
        aedPlain(order.vat),
        aedPlain(order.delivery),
        aedPlain(order.total),
        labelOf(PAYMENT_METHODS, order.paymentMethod),
        labelOf(PAYMENT_STATUSES, order.paymentStatus),
        labelOf(ORDER_STATUSES, order.status),
      ]),
    );
  }

  const shown = orders || [];
  const total = shown.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0);

  return (
    <>
      <div className="filters">
        <RangeFilter from={from} to={to} onChange={(a, b) => setRange([a, b])} />
        <label className="inline-field">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All</option>
            <option value="open">Open only</option>
            {ORDER_STATUSES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-field">
          Payment
          <select value={payment} onChange={(event) => setPayment(event.target.value)}>
            <option value="all">All</option>
            {PAYMENT_METHODS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
            {PAYMENT_STATUSES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-field grow">
          Search
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Order no., name, phone, email" />
        </label>
      </div>
      <div className="table-head">
        <p>
          <strong>{shown.length}</strong> orders · sales <strong>{money(total)}</strong> (cancelled excluded)
        </p>
        <button type="button" className="btn ghost small" onClick={exportCsv} disabled={!shown.length}>
          Download Excel (CSV)
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {orders === null ? <p className="muted">Loading…</p> : <OrdersTable orders={shown} onOpen={setOpen} />}
      {open && (
        <OrderDrawer
          order={open}
          onClose={() => setOpen(null)}
          onSaved={(next) => {
            setOpen(next);
            load();
          }}
        />
      )}
    </>
  );
}

function shortLabel(period) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return period.slice(5);
  if (period.includes("-W")) return period.split(" ")[0].slice(5);
  return period;
}

function SalesChart({ rows }) {
  const [hover, setHover] = useState(null);
  const periods = [...new Set(rows.map((row) => row.period))].reverse().slice(-24);
  const branchIds = [...new Set(rows.map((row) => row.branchId))].sort();
  const value = (period, id) => rows.find((row) => row.period === period && row.branchId === id)?.total || 0;
  const max = Math.max(1, ...periods.flatMap((period) => branchIds.map((id) => value(period, id))));
  const height = 200;
  const groupWidth = Math.max(28, Math.min(80, 760 / Math.max(1, periods.length)));
  const barWidth = Math.max(6, (groupWidth - 10) / branchIds.length - 2);
  const width = Math.max(320, periods.length * groupWidth + 50);
  const ticks = [0, 0.5, 1].map((part) => Math.round(max * part));
  if (!periods.length) return null;

  return (
    <figure className="chart">
      <figcaption>
        Sales incl. VAT by period
        <span className="legend">
          {branchIds.map((id) => (
            <span key={id}>
              <span className="swatch" style={{ background: BRANCH_COLORS[id] }} /> {locationById(id).name}
            </span>
          ))}
        </span>
      </figcaption>
      <div className="chart-scroll">
        <svg width={width} height={height + 44} role="img" aria-label="Sales by period and branch. The table below has the same numbers.">
          {ticks.map((tick) => {
            const y = 10 + height - (tick / max) * height;
            return (
              <g key={tick}>
                <line x1="46" x2={width} y1={y} y2={y} className="grid" />
                <text x="42" y={y + 4} textAnchor="end" className="axis">
                  {Math.round(tick / 100).toLocaleString("en-US")}
                </text>
              </g>
            );
          })}
          {periods.map((period, index) => {
            const x0 = 54 + index * groupWidth;
            return (
              <g key={period}>
                {branchIds.map((id, bar) => {
                  const v = value(period, id);
                  const h = Math.max(v ? 2 : 0, (v / max) * height);
                  const x = x0 + bar * (barWidth + 2);
                  return (
                    <g key={id} onMouseEnter={() => setHover({ period, id, v, x, y: 10 + height - h })} onMouseLeave={() => setHover(null)}>
                      <rect x={x - 2} y="10" width={barWidth + 4} height={height} fill="transparent" />
                      <path
                        d={`M${x},${10 + height} V${10 + height - h + Math.min(4, h)} q0,-${Math.min(4, h)} ${Math.min(4, barWidth / 2)},-${Math.min(4, h)} H${x + barWidth - Math.min(4, barWidth / 2)} q${Math.min(4, barWidth / 2)},0 ${Math.min(4, barWidth / 2)},${Math.min(4, h)} V${10 + height} Z`}
                        fill={BRANCH_COLORS[id] || "#888"}
                      />
                    </g>
                  );
                })}
                <text x={x0 + (groupWidth - 10) / 2} y={height + 28} textAnchor="middle" className="axis">
                  {shortLabel(period)}
                </text>
              </g>
            );
          })}
          {hover && (
            <g className="tip" transform={`translate(${Math.min(hover.x, width - 150)},${Math.max(0, hover.y - 46)})`}>
              <rect width="146" height="40" rx="6" />
              <text x="8" y="16">
                {hover.period.split(" ")[0]} · {locationById(hover.id).name}
              </text>
              <text x="8" y="32" className="tip-value">
                {money(hover.v)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </figure>
  );
}

function ReportsTab({ branch }) {
  const call = useAdminApi();
  const [group, setGroup] = useState("day");
  const [[from, to], setRange] = useState(presets().days30);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setReport(null);
    call(`/admin/reports?${new URLSearchParams({ from, to, branch, group })}`)
      .then(setReport)
      .catch((problem) => setError(problem.message));
  }, [call, from, to, branch, group]);

  function pickGroup(next) {
    setGroup(next);
    const list = presets();
    if (next === "year") setRange([`${Number(dubaiToday().slice(0, 4)) - 2}-01-01`, dubaiToday()]);
    else if (next === "month") setRange(list.year);
    else if (next === "week") setRange([shift(dubaiToday(), -83), dubaiToday()]);
    else setRange(list.days30);
  }

  function exportCsv() {
    downloadCsv(
      `alfarooj-sales-${group}-${from}-to-${to}.csv`,
      ["Period", "Branch", "Orders", "Cancelled", "Sales before VAT", "VAT 5%", "Delivery fees", "Total", "Cash", "Card machine", "Online card", "Paid", "Still to collect"],
      report.rows.map((row) => [
        row.period,
        locationById(row.branchId).name,
        row.orders,
        row.cancelled,
        aedPlain(row.subtotal),
        aedPlain(row.vat),
        aedPlain(row.delivery),
        aedPlain(row.total),
        aedPlain(row.cash),
        aedPlain(row.card_machine),
        aedPlain(row.online),
        aedPlain(row.paid),
        aedPlain(row.unpaid),
      ]),
    );
  }

  const g = report?.grand;
  return (
    <>
      <div className="filters">
        <div className="segmented" role="group" aria-label="Group by">
          {[
            ["day", "Daily"],
            ["week", "Weekly"],
            ["month", "Monthly"],
            ["year", "Yearly"],
          ].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={group === id} onClick={() => pickGroup(id)}>
              {label}
            </button>
          ))}
        </div>
        <RangeFilter from={from} to={to} onChange={(a, b) => setRange([a, b])} />
      </div>
      {error && <p className="form-error">{error}</p>}
      {!report ? (
        <p className="muted">Building the report…</p>
      ) : (
        <>
          <div className="kpis">
            <div className="kpi">
              <span>Orders</span>
              <strong>{g.orders}</strong>
              <small>{g.cancelled} cancelled</small>
            </div>
            <div className="kpi">
              <span>Total sales (incl. VAT)</span>
              <strong>{money(g.total)}</strong>
              <small>Average {money(g.orders ? Math.round(g.total / g.orders) : 0)}</small>
            </div>
            <div className="kpi">
              <span>VAT 5%</span>
              <strong>{money(g.vat)}</strong>
              <small>Before VAT {money(g.subtotal)}</small>
            </div>
            <div className="kpi">
              <span>Delivery fees</span>
              <strong>{money(g.delivery)}</strong>
              <small>
                {g.deliveryOrders} delivery · {g.pickupOrders} pickup
              </small>
            </div>
          </div>
          <div className="kpis">
            <div className="kpi">
              <span>Cash</span>
              <strong>{money(g.cash)}</strong>
            </div>
            <div className="kpi">
              <span>Card machine</span>
              <strong>{money(g.card_machine)}</strong>
            </div>
            <div className="kpi">
              <span>Online card (Stripe)</span>
              <strong>{money(g.online)}</strong>
            </div>
            <div className="kpi">
              <span>Still to collect</span>
              <strong>{money(g.unpaid)}</strong>
            </div>
          </div>

          <SalesChart rows={report.rows} />

          <div className="panel">
            <div className="table-head">
              <h2>Per branch</h2>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th className="num">Orders</th>
                    <th className="num">Before VAT</th>
                    <th className="num">VAT</th>
                    <th className="num">Delivery</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.branches.map((row) => (
                    <tr key={row.branchId}>
                      <td>{locationById(row.branchId).name}</td>
                      <td className="num">{row.orders}</td>
                      <td className="num">{money(row.subtotal)}</td>
                      <td className="num">{money(row.vat)}</td>
                      <td className="num">{money(row.delivery)}</td>
                      <td className="num">
                        <strong>{money(row.total)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="table-head">
              <h2>{{ day: "Daily", week: "Weekly", month: "Monthly", year: "Yearly" }[group]} sales</h2>
              <button type="button" className="btn ghost small" onClick={exportCsv} disabled={!report.rows.length}>
                Download Excel (CSV)
              </button>
            </div>
            {report.rows.length === 0 ? (
              <p className="muted">No orders in this period.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Branch</th>
                      <th className="num">Orders</th>
                      <th className="num">Before VAT</th>
                      <th className="num">VAT</th>
                      <th className="num">Delivery</th>
                      <th className="num">Total</th>
                      <th className="num">Cash</th>
                      <th className="num">Machine</th>
                      <th className="num">Online</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr key={`${row.period}-${row.branchId}`}>
                        <td>{row.period}</td>
                        <td>{locationById(row.branchId).name}</td>
                        <td className="num">{row.orders}</td>
                        <td className="num">{money(row.subtotal)}</td>
                        <td className="num">{money(row.vat)}</td>
                        <td className="num">{money(row.delivery)}</td>
                        <td className="num">
                          <strong>{money(row.total)}</strong>
                        </td>
                        <td className="num">{money(row.cash)}</td>
                        <td className="num">{money(row.card_machine)}</td>
                        <td className="num">{money(row.online)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {report.topItems.length > 0 && (
            <div className="panel">
              <h2>Best sellers</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Branch</th>
                      <th className="num">Qty</th>
                      <th className="num">Sales (menu prices, incl. VAT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topItems.map((item) => (
                      <tr key={`${item.branchId}-${item.name}`}>
                        <td>{item.name}</td>
                        <td>{locationById(item.branchId).name}</td>
                        <td className="num">{item.qty}</td>
                        <td className="num">{money(item.sales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function CustomersTab() {
  const call = useAdminApi();
  const [customers, setCustomers] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    call("/admin/customers")
      .then((data) => setCustomers(data.customers))
      .catch((problem) => setError(problem.message));
  }, [call]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (customers || []).filter((row) => !needle || [row.name, row.email, row.phone].join(" ").toLowerCase().includes(needle));
  }, [customers, q]);

  return (
    <>
      <div className="filters">
        <label className="inline-field grow">
          Search
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, phone, email" />
        </label>
        <button
          type="button"
          className="btn ghost small"
          disabled={!shown.length}
          onClick={() =>
            downloadCsv(
              "alfarooj-customers.csv",
              ["Name", "Email", "Phone", "Account", "Orders", "Spent", "Last order", "Last address", "Branches"],
              shown.map((row) => [
                row.name,
                row.email,
                row.phone,
                row.registered ? "Registered" : "Guest",
                row.orders,
                aedPlain(row.spent),
                row.lastOrder ? dateTime(row.lastOrder) : "",
                addressText(row.lastAddress),
                row.branches.join(" / "),
              ]),
            )
          }
        >
          Download Excel (CSV)
        </button>
      </div>
      <p className="muted small">Customers who ordered in the last 12 months.</p>
      {error && <p className="form-error">{error}</p>}
      {customers === null ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Last address</th>
                <th className="num">Orders</th>
                <th className="num">Spent</th>
                <th>Last order</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.email || row.phone}>
                  <td>
                    {row.name} {row.registered && <span className="badge subtle">Registered</span>}
                  </td>
                  <td>
                    <a href={`tel:${row.phone}`}>{row.phone}</a>
                  </td>
                  <td>
                    <a href={`mailto:${row.email}`}>{row.email}</a>
                  </td>
                  <td>{addressText(row.lastAddress) || "Pickup"}</td>
                  <td className="num">{row.orders}</td>
                  <td className="num">{money(row.spent)}</td>
                  <td>{row.lastOrder ? dateTime(row.lastOrder) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function BookingsTab({ branch }) {
  const call = useAdminApi();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    call("/admin/bookings")
      .then((data) => setBookings(data.bookings))
      .catch((problem) => setError(problem.message));
  }, [call]);

  useEffect(load, [load]);

  async function setStatus(id, status) {
    try {
      await call(`/admin/bookings/${id}`, { method: "PATCH", body: { status } });
      load();
    } catch (problem) {
      setError(problem.message);
    }
  }

  const shown = (bookings || []).filter((entry) => branch === "all" || entry.branchId === branch);
  return (
    <>
      <p className="muted small">Table requests from the last 7 days and the next 60 days. Call the guest, then confirm.</p>
      {error && <p className="form-error">{error}</p>}
      {bookings === null ? (
        <p className="muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="muted">No table requests.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Branch</th>
                <th>Guest</th>
                <th>Party</th>
                <th>Note</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    {entry.date} · {entry.time}
                  </td>
                  <td>{entry.branchName}</td>
                  <td>
                    {entry.name}
                    <br />
                    <a href={`tel:${entry.phone}`}>{entry.phone}</a>
                  </td>
                  <td>
                    {entry.guests} · {entry.area}
                    {entry.occasion && entry.occasion !== "Regular visit" && <span className="badge subtle">{entry.occasion}</span>}
                  </td>
                  <td>{entry.note}</td>
                  <td>
                    <span className={`badge booking-${entry.status}`}>{entry.status.replace("_", " ")}</span>
                  </td>
                  <td className="row-actions">
                    {["confirmed", "declined", "seated", "no_show"].map((status) => (
                      <button key={status} type="button" className="chip cap" disabled={entry.status === status} onClick={() => setStatus(entry.id, status)}>
                        {status.replace("_", " ")}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function Admin() {
  const { adminToken, setAdminToken } = useCafe();
  const [tab, setTab] = useState("overview");
  const [branch, setBranch] = useState("all");

  if (!adminToken) return <AdminLogin />;

  return (
    <section className="page admin">
      <header className="menu-head">
        <div>
          <p className="eyebrow">Al Farooj Al Shami admin</p>
          <h1>{TABS.find(([id]) => id === tab)[1]}</h1>
        </div>
        <div className="row-actions">
          <BranchFilter value={branch} onChange={setBranch} />
          <button type="button" className="btn ghost small" onClick={() => setAdminToken("")}>
            Sign out
          </button>
        </div>
      </header>
      <nav className="tabs admin-tabs" aria-label="Admin sections">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "overview" && <Overview branch={branch} />}
      {tab === "orders" && <OrdersTab branch={branch} />}
      {tab === "reports" && <ReportsTab branch={branch} />}
      {tab === "customers" && <CustomersTab />}
      {tab === "bookings" && <BookingsTab branch={branch} />}
    </section>
  );
}
