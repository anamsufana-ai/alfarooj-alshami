import { locationById, locations, menuItems, offers, tableAreas, times } from "../../src/data.js";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, totals } from "../../src/pricing.js";
import { checkPassword, hashPassword, randomCode, sameSecret, secret, sign, verify } from "../lib/auth.mjs";
import { buildReport } from "../lib/reports.mjs";
import { getMany, openStore } from "../lib/store.mjs";

export const config = { path: "/api/*" };

const DAY_MS = 86400000;
const DUBAI_OFFSET_MS = 4 * 3600000; // Dubai is UTC+4 all year

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const fail = (status, message) => {
  throw new HttpError(status, message);
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const clean = (value, max) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export function dubaiDay(time = Date.now()) {
  return new Date(time + DUBAI_OFFSET_MS).toISOString().slice(0, 10);
}

function validDay(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function addDays(day, count) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + count * DAY_MS).toISOString().slice(0, 10);
}

function rangeFrom(params, fallbackDays = 0) {
  const today = dubaiDay();
  const to = validDay(params.get("to")) ? params.get("to") : today;
  const from = validDay(params.get("from")) ? params.get("from") : addDays(to, -fallbackDays);
  if (from > to) fail(400, "The start date is after the end date.");
  return { from, to };
}

async function body(req) {
  try {
    return await req.json();
  } catch {
    fail(400, "The request was not valid.");
  }
}

function bearer(req) {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

async function session(req, store) {
  const token = bearer(req);
  if (!token) return null;
  return verify(token, await secret(store));
}

async function requireAdmin(req, store) {
  const who = await session(req, store);
  if (who?.role !== "admin") fail(401, "Please sign in to the admin dashboard again.");
  return who;
}

async function requireCustomer(req, store) {
  const who = await session(req, store);
  if (who?.role !== "customer") fail(401, "Please sign in again.");
  const user = await store.get(`users/${who.email}`);
  if (!user) fail(401, "Please sign in again.");
  return user;
}

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address || null,
  createdAt: user.createdAt,
});

function publicOrder(order) {
  const { accessKey, stripeSessionId, ...rest } = order;
  return rest;
}

// ---------- customers ----------

function readProfile(input) {
  const name = clean(input.name, 80);
  const email = clean(input.email, 120).toLowerCase();
  const phone = clean(input.phone, 30);
  if (name.length < 2) fail(400, "Add your full name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail(400, "Add a valid email address.");
  if (phone.replace(/\D/g, "").length < 7) fail(400, "Add a phone number the café can call.");
  return { name, email, phone };
}

function readAddress(input) {
  const address = {
    area: clean(input?.area, 80),
    building: clean(input?.building, 80),
    apartment: clean(input?.apartment, 40),
    street: clean(input?.street, 120),
    landmark: clean(input?.landmark, 120),
  };
  if (address.area.length < 2) fail(400, "Add the area for delivery.");
  if (address.building.length < 1) fail(400, "Add the building or villa name.");
  if (address.apartment.length < 1) fail(400, "Add the flat, office or villa number.");
  return address;
}

async function register(req, store) {
  const input = await body(req);
  const profile = readProfile(input);
  const password = String(input.password || "");
  if (password.length < 8) fail(400, "Choose a password of at least 8 characters.");
  const user = {
    id: `cus_${randomCode(10)}`,
    ...profile,
    ...hashPassword(password),
    address: null,
    createdAt: new Date().toISOString(),
  };
  const { modified } = await store.set(`users/${profile.email}`, user, { onlyIfNew: true });
  if (!modified) fail(409, "This email already has an account. Sign in instead.");
  return json({ token: await customerToken(store, user), user: publicUser(user) }, 201);
}

async function customerToken(store, user) {
  return sign({ role: "customer", uid: user.id, email: user.email, exp: Date.now() + 30 * DAY_MS }, await secret(store));
}

async function login(req, store) {
  const input = await body(req);
  const email = clean(input.email, 120).toLowerCase();
  const user = await store.get(`users/${email}`);
  if (!user || !checkPassword(String(input.password || ""), user.salt, user.hash)) {
    fail(401, "The email or password is not right.");
  }
  return json({ token: await customerToken(store, user), user: publicUser(user) });
}

async function updateMe(req, store) {
  const user = await requireCustomer(req, store);
  const input = await body(req);
  const name = clean(input.name ?? user.name, 80);
  const phone = clean(input.phone ?? user.phone, 30);
  if (name.length < 2) fail(400, "Add your full name.");
  if (phone.replace(/\D/g, "").length < 7) fail(400, "Add a phone number the café can call.");
  const next = { ...user, name, phone, address: input.address ? readAddress(input.address) : user.address };
  await store.set(`users/${user.email}`, next);
  return json({ user: publicUser(next) });
}

async function myOrders(req, store) {
  const user = await requireCustomer(req, store);
  const keys = await store.list(`cust/${user.id}/`);
  const pointers = await getMany(store, keys);
  const orders = await getMany(store, pointers.map((pointer) => pointer.key));
  orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return json({ orders: orders.map(publicOrder) });
}

// ---------- orders ----------

function findPriced(id, branchId) {
  return (
    menuItems.find((item) => item.id === id && item.location === branchId) ||
    offers.find((offer) => offer.id === id && offer.location === branchId)
  );
}

function readLines(input, branchId) {
  const incoming = Array.isArray(input) ? input.slice(0, 60) : [];
  if (!incoming.length) fail(400, "Your basket is empty.");
  return incoming.map((line) => {
    const qty = Number(line.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) fail(400, "Check the quantities in your basket.");
    const entry = findPriced(line.id, branchId);
    if (!entry) fail(400, "An item in your basket is not on this branch menu. Please remove it.");
    const unit = Math.round(Number(entry.price) * 100);
    return {
      id: entry.id,
      name: entry.name,
      ar: entry.ar || "",
      category: entry.category || "offer",
      qty,
      price: Number(entry.price),
      unit,
      total: unit * qty,
    };
  });
}

async function newRef(store, branchId, day) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const ref = `${branchId.toUpperCase()}-${day.slice(2).replace(/-/g, "")}-${randomCode(4)}`;
    const { modified } = await store.set(`refs/${ref}`, { key: `orders/${day}/${ref}` }, { onlyIfNew: true });
    if (modified) return ref;
  }
  fail(503, "Could not create an order number. Please try again.");
}

function siteOrigin(req) {
  return new URL(req.url).origin;
}

async function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  const { default: Stripe } = await import("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

async function openCheckout(req, order) {
  const stripe = await stripeClient();
  if (!stripe) fail(503, "Online card payment is not switched on yet. Please choose cash or card machine on delivery.");
  const origin = siteOrigin(req);
  const back = `${origin}/order/${order.ref}?k=${order.accessKey}`;
  const lineItems = order.lines.map((line) => ({
    quantity: line.qty,
    price_data: { currency: "aed", unit_amount: line.unit, product_data: { name: line.name } },
  }));
  if (order.vat > 0) {
    lineItems.push({ quantity: 1, price_data: { currency: "aed", unit_amount: order.vat, product_data: { name: "VAT 5%" } } });
  }
  if (order.delivery > 0) {
    lineItems.push({
      quantity: 1,
      price_data: { currency: "aed", unit_amount: order.delivery, product_data: { name: "Delivery fee" } },
    });
  }
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.customer.email,
    client_reference_id: order.ref,
    success_url: `${back}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${back}&cancelled=1`,
    metadata: { ref: order.ref, branch: order.branchId },
    payment_intent_data: { description: `${order.ref} · ${order.branchName}`, metadata: { ref: order.ref } },
    line_items: lineItems,
  });
  return checkout;
}

async function createOrder(req, store) {
  const input = await body(req);
  const branchId = locations.some((place) => place.id === input.branchId) ? input.branchId : "";
  if (!branchId) fail(400, "Choose a branch.");
  const branch = locationById(branchId);
  const customer = readProfile(input.customer || {});
  const orderType = input.orderType === "pickup" ? "pickup" : "delivery";
  const address = orderType === "delivery" ? readAddress(input.address) : null;
  const paymentMethod = PAYMENT_METHODS.some((method) => method.id === input.paymentMethod) ? input.paymentMethod : "";
  if (!paymentMethod) fail(400, "Choose how you will pay.");
  if (paymentMethod === "online" && !process.env.STRIPE_SECRET_KEY) {
    fail(503, "Online card payment is not switched on yet. Please choose cash or card machine on delivery.");
  }
  const lines = readLines(input.lines, branchId);
  const sums = totals(lines, orderType, branch.deliveryFee);

  const who = await session(req, store);
  const userId = who?.role === "customer" ? who.uid : null;
  const now = Date.now();
  const day = dubaiDay(now);
  const ref = await newRef(store, branchId, day);
  const createdAt = new Date(now).toISOString();
  const order = {
    ref,
    accessKey: randomCode(16),
    day,
    createdAt,
    branchId,
    branchName: branch.name,
    branchAddress: branch.address,
    branchPhone: branch.phone,
    customer: { ...customer, userId },
    orderType,
    address,
    when: clean(input.when, 40) || "As soon as possible",
    note: clean(input.note, 300),
    lines,
    ...sums,
    paymentMethod,
    paymentStatus: paymentMethod === "online" ? "awaiting_online" : "pending",
    status: "new",
    history: [{ status: "new", at: createdAt, by: "customer" }],
  };

  let checkoutUrl = "";
  if (paymentMethod === "online") {
    try {
      const checkout = await openCheckout(req, order);
      order.stripeSessionId = checkout.id;
      checkoutUrl = checkout.url;
    } catch (error) {
      await store.delete(`refs/${ref}`);
      if (error instanceof HttpError) throw error;
      console.error(error);
      fail(502, "The card payment page could not open. Nothing was charged. Please try again or pay on delivery.");
    }
  }

  await store.set(`orders/${day}/${ref}`, order);
  if (userId) await store.set(`cust/${userId}/${ref}`, { key: `orders/${day}/${ref}` });
  return json({ order: publicOrder(order), accessKey: order.accessKey, checkoutUrl }, 201);
}

async function loadOrder(store, ref) {
  if (!/^[A-Z0-9-]{6,30}$/.test(ref || "")) fail(404, "Order not found.");
  const pointer = await store.get(`refs/${ref}`);
  const order = pointer ? await store.get(pointer.key) : null;
  if (!order) fail(404, "Order not found.");
  return { order, key: pointer.key };
}

async function canSee(req, store, order, params) {
  if (params.get("k") && sameSecret(params.get("k"), order.accessKey)) return true;
  const who = await session(req, store);
  if (who?.role === "admin") return true;
  return who?.role === "customer" && who.uid === order.customer.userId;
}

async function markPaid(store, key, order, by) {
  if (order.paymentStatus === "paid") return order;
  const at = new Date().toISOString();
  const next = { ...order, paymentStatus: "paid", paidAt: at, history: [...order.history, { status: "paid", at, by }] };
  await store.set(key, next);
  return next;
}

async function syncStripe(store, key, order) {
  if (order.paymentMethod !== "online" || order.paymentStatus === "paid" || !order.stripeSessionId) return order;
  const stripe = await stripeClient();
  if (!stripe) return order;
  try {
    const checkout = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    if (checkout.payment_status === "paid") return markPaid(store, key, order, "stripe");
  } catch (error) {
    console.error(error);
  }
  return order;
}

async function getOrder(req, store, ref, params) {
  const found = await loadOrder(store, ref);
  if (!(await canSee(req, store, found.order, params))) fail(404, "Order not found.");
  const order = await syncStripe(store, found.key, found.order);
  return json({ order: publicOrder(order), stripeReady: Boolean(process.env.STRIPE_SECRET_KEY) });
}

async function retryPayment(req, store, ref, params) {
  const found = await loadOrder(store, ref);
  if (!(await canSee(req, store, found.order, params))) fail(404, "Order not found.");
  const order = await syncStripe(store, found.key, found.order);
  if (order.paymentStatus === "paid") fail(400, "This order is already paid.");
  if (order.status === "cancelled") fail(400, "This order was cancelled.");
  const checkout = await openCheckout(req, order);
  await store.set(found.key, { ...order, paymentMethod: "online", paymentStatus: "awaiting_online", stripeSessionId: checkout.id });
  return json({ checkoutUrl: checkout.url });
}

async function stripeWebhook(req, store) {
  const stripe = await stripeClient();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) fail(404, "Not found.");
  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    fail(400, "Bad signature.");
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const checkout = event.data.object;
    const ref = checkout.client_reference_id || checkout.metadata?.ref;
    if (ref && checkout.payment_status === "paid") {
      const found = await loadOrder(store, ref);
      await markPaid(store, found.key, found.order, "stripe");
    }
  }
  return json({ received: true });
}

// ---------- bookings ----------

async function createBooking(req, store) {
  const input = await body(req);
  const branchId = locations.some((place) => place.id === input.branchId) ? input.branchId : "";
  if (!branchId) fail(400, "Choose a branch.");
  const name = clean(input.name, 80);
  const phone = clean(input.phone, 30);
  const email = clean(input.email, 120).toLowerCase();
  if (name.length < 2) fail(400, "Add your name.");
  if (phone.replace(/\D/g, "").length < 7) fail(400, "Add a phone number.");
  if (!validDay(input.date) || input.date < dubaiDay()) fail(400, "Choose today or a later date.");
  if (!times.includes(input.time)) fail(400, "Choose a time.");
  const guests = Number(input.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > 30) fail(400, "Choose the number of guests.");
  const area = tableAreas.includes(input.area) ? input.area : tableAreas[0];
  const id = `BK-${randomCode(6)}`;
  const booking = {
    id,
    branchId,
    branchName: locationById(branchId).name,
    name,
    phone,
    email,
    date: input.date,
    time: input.time,
    guests,
    area,
    note: clean(input.note, 300),
    status: "requested",
    createdAt: new Date().toISOString(),
  };
  await store.set(`bookings/${input.date}/${id}`, booking);
  await store.set(`bookingids/${id}`, { key: `bookings/${input.date}/${id}` });
  return json({ booking }, 201);
}

// ---------- admin ----------

async function adminLogin(req, store) {
  if (!process.env.ADMIN_PASSWORD) {
    fail(503, "The admin password is not set yet. Add ADMIN_PASSWORD in Netlify environment variables.");
  }
  const input = await body(req);
  if (!sameSecret(input.password, process.env.ADMIN_PASSWORD)) fail(401, "Wrong password.");
  const token = sign({ role: "admin", exp: Date.now() + 12 * 3600000 }, await secret(store));
  return json({ token });
}

async function ordersInRange(store, from, to) {
  const keys = (await store.list("orders/")).filter((key) => {
    const day = key.slice(7, 17);
    return day >= from && day <= to;
  });
  return getMany(store, keys);
}

function matches(order, params) {
  const branch = params.get("branch");
  const status = params.get("status");
  const payment = params.get("payment");
  const q = clean(params.get("q"), 80).toLowerCase();
  if (branch && branch !== "all" && order.branchId !== branch) return false;
  if (status === "open" && ["delivered", "collected", "cancelled"].includes(order.status)) return false;
  if (status && status !== "all" && status !== "open" && order.status !== status) return false;
  if (payment && payment !== "all" && order.paymentMethod !== payment && order.paymentStatus !== payment) return false;
  if (q) {
    const text = [order.ref, order.customer.name, order.customer.email, order.customer.phone].join(" ").toLowerCase();
    if (!text.includes(q)) return false;
  }
  return true;
}

async function adminOrders(req, store, params) {
  await requireAdmin(req, store);
  const { from, to } = rangeFrom(params, 0);
  const orders = (await ordersInRange(store, from, to)).filter((order) => matches(order, params));
  orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return json({ from, to, orders: orders.map((order) => ({ ...publicOrder(order) })) });
}

async function adminUpdateOrder(req, store, ref) {
  const who = await requireAdmin(req, store);
  const input = await body(req);
  const found = await loadOrder(store, ref);
  const order = { ...found.order, history: [...found.order.history] };
  const at = new Date().toISOString();
  if (input.status) {
    if (!ORDER_STATUSES.some((entry) => entry.id === input.status)) fail(400, "Unknown status.");
    order.status = input.status;
    order.history.push({ status: input.status, at, by: who.role });
  }
  if (input.paymentStatus) {
    if (!PAYMENT_STATUSES.some((entry) => entry.id === input.paymentStatus)) fail(400, "Unknown payment status.");
    order.paymentStatus = input.paymentStatus;
    if (input.paymentStatus === "paid") order.paidAt = at;
    order.history.push({ status: `payment: ${input.paymentStatus}`, at, by: who.role });
  }
  if (typeof input.staffNote === "string") order.staffNote = clean(input.staffNote, 300);
  await store.set(found.key, order);
  return json({ order: publicOrder(order) });
}

async function adminReports(req, store, params) {
  await requireAdmin(req, store);
  const group = ["day", "week", "month", "year"].includes(params.get("group")) ? params.get("group") : "day";
  const { from, to } = rangeFrom(params, 29);
  const orders = (await ordersInRange(store, from, to)).filter((order) => matches(order, params));
  return json({ from, to, ...buildReport(orders, group) });
}

async function adminCustomers(req, store, params) {
  await requireAdmin(req, store);
  const { from, to } = rangeFrom(params, 364);
  const orders = await ordersInRange(store, from, to);
  const byKey = new Map();
  for (const order of orders) {
    const key = order.customer.email || order.customer.phone;
    const row = byKey.get(key) || {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      registered: Boolean(order.customer.userId),
      orders: 0,
      spent: 0,
      lastOrder: "",
      lastAddress: null,
      branches: new Set(),
    };
    if (order.status !== "cancelled") {
      row.orders += 1;
      row.spent += order.total;
    }
    if (order.createdAt > row.lastOrder) {
      row.lastOrder = order.createdAt;
      row.name = order.customer.name;
      row.phone = order.customer.phone;
      if (order.address) row.lastAddress = order.address;
    }
    row.branches.add(order.branchName);
    byKey.set(key, row);
  }
  const customers = [...byKey.values()]
    .map((row) => ({ ...row, branches: [...row.branches] }))
    .sort((a, b) => b.spent - a.spent);
  return json({ from, to, customers });
}

async function adminBookings(req, store, params) {
  await requireAdmin(req, store);
  const today = dubaiDay();
  const from = validDay(params.get("from")) ? params.get("from") : addDays(today, -7);
  const to = validDay(params.get("to")) ? params.get("to") : addDays(today, 60);
  const keys = (await store.list("bookings/")).filter((key) => {
    const day = key.slice(9, 19);
    return day >= from && day <= to;
  });
  const bookings = await getMany(store, keys);
  bookings.sort((a, b) => (`${a.date}${a.time}` < `${b.date}${b.time}` ? -1 : 1));
  return json({ from, to, bookings });
}

async function adminUpdateBooking(req, store, id) {
  await requireAdmin(req, store);
  const input = await body(req);
  if (!["requested", "confirmed", "declined", "seated", "no_show"].includes(input.status)) fail(400, "Unknown status.");
  const pointer = await store.get(`bookingids/${id}`);
  const booking = pointer ? await store.get(pointer.key) : null;
  if (!booking) fail(404, "Booking not found.");
  const next = { ...booking, status: input.status };
  await store.set(pointer.key, next);
  return json({ booking: next });
}

// ---------- router ----------

export default async (req, context) => {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const route = `${req.method} /${parts.join("/")}`;
  const store = openStore(context);
  try {
    if (route === "GET /health") {
      return json({
        ok: true,
        onlinePayments: Boolean(process.env.STRIPE_SECRET_KEY),
        adminReady: Boolean(process.env.ADMIN_PASSWORD),
        today: dubaiDay(),
      });
    }
    if (route === "POST /auth/register") return await register(req, store);
    if (route === "POST /auth/login") return await login(req, store);
    if (route === "GET /me") return json({ user: publicUser(await requireCustomer(req, store)) });
    if (route === "PUT /me") return await updateMe(req, store);
    if (route === "GET /me/orders") return await myOrders(req, store);
    if (route === "POST /orders") return await createOrder(req, store);
    if (req.method === "GET" && parts[0] === "orders" && parts.length === 2) {
      return await getOrder(req, store, parts[1], url.searchParams);
    }
    if (req.method === "POST" && parts[0] === "orders" && parts[2] === "pay") {
      return await retryPayment(req, store, parts[1], url.searchParams);
    }
    if (route === "POST /bookings") return await createBooking(req, store);
    if (route === "POST /stripe/webhook") return await stripeWebhook(req, store);
    if (route === "POST /admin/login") return await adminLogin(req, store);
    if (route === "GET /admin/orders") return await adminOrders(req, store, url.searchParams);
    if (req.method === "PATCH" && parts[0] === "admin" && parts[1] === "orders" && parts[2]) {
      return await adminUpdateOrder(req, store, parts[2]);
    }
    if (route === "GET /admin/reports") return await adminReports(req, store, url.searchParams);
    if (route === "GET /admin/customers") return await adminCustomers(req, store, url.searchParams);
    if (route === "GET /admin/bookings") return await adminBookings(req, store, url.searchParams);
    if (req.method === "PATCH" && parts[0] === "admin" && parts[1] === "bookings" && parts[2]) {
      return await adminUpdateBooking(req, store, parts[2]);
    }
    return json({ error: "Not found." }, 404);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error(error);
    return json({ error: "Something went wrong on our side. Please try again." }, 500);
  }
};
