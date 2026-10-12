import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import Icon from "../components/Icon";
import { BranchSwitch } from "../components/Layout";
import { aed } from "../data";
import { useLang } from "../i18n";
import { ORDER_TYPES, PAYMENT_METHODS, VAT_RATE, money } from "../pricing";
import { useCafe } from "../store";

const WHEN = ["As soon as possible", "In 30 minutes", "In 1 hour", "In 2 hours"];
const paymentIcon = { cash: "cash", card_machine: "machine", online: "card" };

function choiceLabel(id, orderType) {
  const pickup = orderType === "pickup";
  if (id === "cash") return pickup ? "Cash at pickup" : "Cash on delivery";
  if (id === "card_machine") return pickup ? "Card machine at pickup" : "Card machine on delivery";
  return "Pay online by card";
}

export default function Checkout() {
  const { location, locationId, cart, setQty, sums, user, token, setUser, clearCart, remember } = useCafe();
  const { t, lineName, isAr } = useLang();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    orderType: "delivery",
    area: user?.address?.area || "",
    building: user?.address?.building || "",
    apartment: user?.address?.apartment || "",
    street: user?.address?.street || "",
    landmark: user?.address?.landmark || "",
    when: WHEN[0],
    note: "",
    paymentMethod: "cash",
  }));

  useEffect(() => {
    api("/health")
      .then(setHealth)
      .catch(() => setHealth({ onlinePayments: false }));
  }, []);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const choose = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const s = sums(form.orderType);
  const onlineReady = Boolean(health?.onlinePayments);

  async function placeOrder(event) {
    event.preventDefault();
    setError("");
    if (form.paymentMethod === "online" && !onlineReady) {
      setError(t("Online card payment is not switched on yet. Please choose cash or card machine."));
      return;
    }
    setBusy(true);
    const address = {
      area: form.area,
      building: form.building,
      apartment: form.apartment,
      street: form.street,
      landmark: form.landmark,
    };
    try {
      const result = await api("/orders", {
        method: "POST",
        token,
        body: {
          branchId: locationId,
          customer: { name: form.name, email: form.email, phone: form.phone },
          orderType: form.orderType,
          address: form.orderType === "delivery" ? address : null,
          when: form.when,
          note: form.note,
          paymentMethod: form.paymentMethod,
          lines: cart.map((line) => ({ id: line.id, qty: line.qty })),
        },
      });
      const { order, accessKey, checkoutUrl } = result;
      remember({ ref: order.ref, k: accessKey, branchId: order.branchId, createdAt: order.createdAt, total: order.total });
      if (token && form.orderType === "delivery") {
        api("/me", { method: "PUT", token, body: { address } })
          .then((data) => setUser(data.user))
          .catch(() => {});
      }
      clearCart();
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }
      navigate(`/order/${order.ref}?k=${accessKey}&new=1`);
    } catch (problem) {
      setError(t(problem.message));
      setBusy(false);
    }
  }

  if (!cart.length) {
    return (
      <section className="page narrow center">
        <Icon name="bag" size={44} />
        <h1>{t("Your basket is empty")}</h1>
        <p className="muted">{t("Pick your branch and add something tasty.")}</p>
        <BranchSwitch />
        <Link className="btn solid big" to="/menu">
          {t("Open the {branch} menu", { branch: t(location.name) })}
        </Link>
      </section>
    );
  }

  return (
    <section className="page checkout-page">
      <header className="menu-head">
        <div>
          <p className="eyebrow">{t("Checkout")}</p>
          <h1>{t("Almost there")}</h1>
          <p className="muted">
            {t("Ordering from")} <strong>{t("Al Farooj Al Shami")} {isAr ? location.ar : location.name}</strong>, {t(location.city)}.{" "}
            <Link to="/menu">{t("Add more items")}</Link>
          </p>
        </div>
      </header>

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div className="checkout-steps">
          <fieldset className="panel">
            <legend>
              <span className="step-no">1</span> {t("Your details")}
            </legend>
            {!user && (
              <p className="muted small">
                {t("Have an account?")} <Link to="/account?next=/checkout">{t("Sign in")}</Link>{" "}
                {t("to fill this in and see your orders later.")}
              </p>
            )}
            <div className="field-grid">
              <label>
                {t("Full name")}
                <input value={form.name} onChange={set("name")} autoComplete="name" required minLength={2} />
              </label>
              <label>
                {t("Mobile number")}
                <input
                  value={form.phone}
                  onChange={set("phone")}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="05x xxx xxxx"
                  required
                />
              </label>
              <label className="wide">
                {t("Email (for your invoice)")}
                <input type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
              </label>
            </div>
          </fieldset>

          <fieldset className="panel">
            <legend>
              <span className="step-no">2</span> {t("Delivery or pickup")}
            </legend>
            <div className="choice-grid">
              {ORDER_TYPES.map((type) => (
                <label key={type.id} className={form.orderType === type.id ? "choice selected" : "choice"}>
                  <input
                    type="radio"
                    name="orderType"
                    value={type.id}
                    checked={form.orderType === type.id}
                    onChange={() => choose("orderType", type.id)}
                  />
                  <Icon name={type.id === "delivery" ? "scooter" : "bag"} size={26} />
                  <span>
                    <strong>{t(type.label)}</strong>
                    <small>{t(type.hint)}</small>
                  </span>
                </label>
              ))}
            </div>
            {form.orderType === "delivery" ? (
              <div className="field-grid">
                <label>
                  {t("Area")}
                  <input value={form.area} onChange={set("area")} placeholder={t(location.city)} required />
                </label>
                <label>
                  {t("Building / villa")}
                  <input value={form.building} onChange={set("building")} placeholder={t("Building or villa name")} required />
                </label>
                <label>
                  {t("Flat / office / villa no.")}
                  <input value={form.apartment} onChange={set("apartment")} required />
                </label>
                <label>
                  {t("Street")}
                  <input value={form.street} onChange={set("street")} autoComplete="address-line1" />
                </label>
                <label className="wide">
                  {t("Landmark or directions for the rider")}
                  <input value={form.landmark} onChange={set("landmark")} placeholder={t("Near the metro, blue gate…")} />
                </label>
              </div>
            ) : (
              <p className="muted">
                {t("Collect at {branch}: {address}.", { branch: t(location.name), address: t(location.address) })}
              </p>
            )}
            <div className="field-grid">
              <label>
                {t("When")}
                <select value={form.when} onChange={set("when")}>
                  {WHEN.map((option) => (
                    <option key={option} value={option}>
                      {t(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("Note for the kitchen")}
                <input value={form.note} onChange={set("note")} placeholder={t("Extra garlic, no pickles…")} />
              </label>
            </div>
          </fieldset>

          <fieldset className="panel">
            <legend>
              <span className="step-no">3</span> {t("Payment")}
            </legend>
            <div className={onlineReady ? "choice-grid three" : "choice-grid"}>
              {PAYMENT_METHODS.filter((method) => method.id !== "online" || onlineReady).map((method) => {
                const off = method.id === "online" && health && !onlineReady;
                return (
                  <label
                    key={method.id}
                    className={`choice${form.paymentMethod === method.id ? " selected" : ""}${off ? " disabled" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      disabled={off}
                      checked={form.paymentMethod === method.id}
                      onChange={() => choose("paymentMethod", method.id)}
                    />
                    <Icon name={paymentIcon[method.id]} size={26} />
                    <span>
                      <strong>{t(choiceLabel(method.id, form.orderType))}</strong>
                      <small>{off ? t("Coming soon") : t(method.hint)}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <aside className="panel summary">
          <h2>{t("Order summary")}</h2>
          <ul className="cart-lines">
            {cart.map((line) => (
              <li key={line.id}>
                <div>
                  <strong>{lineName(line)}</strong>
                  <span className="muted">{t("{price} each", { price: aed(line.price) })}</span>
                </div>
                <div className="qty">
                  <button type="button" onClick={() => setQty(line.id, line.qty - 1)} aria-label={t("Remove one {name}", { name: lineName(line) })}>
                    −
                  </button>
                  <span>{line.qty}</span>
                  <button type="button" onClick={() => setQty(line.id, line.qty + 1)} aria-label={t("Add one {name}", { name: lineName(line) })}>
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <dl className="sums">
            <div>
              <dt>{t("Subtotal")}</dt>
              <dd>{money(s.subtotal)}</dd>
            </div>
            <div>
              <dt>{t("VAT {rate}%", { rate: Math.round(VAT_RATE * 100) })}</dt>
              <dd>{money(s.vat)}</dd>
            </div>
            <div>
              <dt>{t("Delivery fee")}</dt>
              <dd>{s.delivery ? money(s.delivery) : t("Free (pickup)")}</dd>
            </div>
            <div className="grand">
              <dt>{t("Total to pay")}</dt>
              <dd>{money(s.total)}</dd>
            </div>
          </dl>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn solid block big" type="submit" disabled={busy}>
            {busy
              ? t("Placing order…")
              : form.paymentMethod === "online"
                ? t("Pay {total} by card", { total: money(s.total) })
                : t("Place order · {total}", { total: money(s.total) })}
          </button>
          <p className="muted small">
            {t("By placing the order you agree to the")} <Link to="/terms">{t("terms")}</Link>.{" "}
            {t("You get a VAT invoice for every order.")}
          </p>
        </aside>
      </form>
    </section>
  );
}
