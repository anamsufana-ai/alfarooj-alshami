import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import Icon from "../components/Icon";
import { LinesTable, PaymentBadge, StatusBadge, Timeline, addressText, dateTime } from "../components/OrderBits";
import { useLang } from "../i18n";
import { useCafe } from "../store";

export default function OrderStatus() {
  const { ref } = useParams();
  const [params] = useSearchParams();
  const { token, adminToken } = useCafe();
  const { t, lang } = useLang();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const k = params.get("k") || "";
  const sessionId = params.get("session_id") || "";
  const query = `?k=${encodeURIComponent(k)}${sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : ""}`;

  const load = useCallback(() => {
    api(`/orders/${ref}${query}`, { token: k ? "" : adminToken || token })
      .then((data) => setOrder(data.order))
      .catch((problem) => setError(t(problem.message)));
  }, [ref, query, k, token, adminToken]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 20000);
    return () => clearInterval(timer);
  }, [load]);

  async function payNow() {
    setPaying(true);
    try {
      const data = await api(`/orders/${ref}/pay?k=${encodeURIComponent(k)}`, { method: "POST", token: k ? "" : token });
      window.location.assign(data.checkoutUrl);
    } catch (problem) {
      setError(t(problem.message));
      setPaying(false);
    }
  }

  if (error && !order) {
    return (
      <section className="page narrow center">
        <h1>{t("We could not open this order")}</h1>
        <p className="muted">{error}</p>
        <Link className="btn solid" to="/account">
          {t("See my orders")}
        </Link>
      </section>
    );
  }
  if (!order) return <section className="page narrow center muted">{t("Loading your order…")}</section>;

  const invoiceLink = `/invoice/${order.ref}${k ? `?k=${encodeURIComponent(k)}` : ""}`;
  const awaiting = order.paymentStatus === "awaiting_online";

  return (
    <section className="page order-status">
      <header className="status-head">
        {params.get("new") || order.paymentStatus === "paid" ? (
          <span className="success-mark">
            <Icon name="check" size={30} />
          </span>
        ) : null}
        <div>
          <p className="eyebrow">{t("Order {ref}", { ref: order.ref })}</p>
          <h1>
            {order.status === "cancelled"
              ? t("Order cancelled")
              : awaiting
                ? t("Waiting for your card payment")
                : t("Thank you, {name}!", { name: order.customer.name.split(" ")[0] })}
          </h1>
          <p className="muted">
            {t(order.branchName)} · {t("placed")} {dateTime(order.createdAt, lang)} · {t(order.when)}
          </p>
          <p className="badges">
            <StatusBadge status={order.status} />
            <PaymentBadge order={order} />
          </p>
        </div>
      </header>

      {awaiting && order.status !== "cancelled" && (
        <div className="panel notice">
          <p>
            {params.get("cancelled")
              ? t("The card payment was not finished, so nothing was charged.")
              : t("If you already paid, this page updates in a few seconds.")}{" "}
            {t("You can pay now, or call {phone} to pay on delivery instead.", { phone: `\u2066${order.branchPhone}\u2069` })}
          </p>
          <button type="button" className="btn solid" onClick={payNow} disabled={paying}>
            {paying ? t("Opening…") : t("Pay now by card")}
          </button>
          {error && <p className="form-error">{error}</p>}
        </div>
      )}

      <div className="status-grid">
        <div className="panel">
          <h2>{t("Order progress")}</h2>
          <Timeline order={order} />
          <p className="muted small">{t("This page refreshes by itself. Questions? Call {phone}.", { phone: `\u2066${order.branchPhone}\u2069` })}</p>
        </div>
        <div className="panel">
          <h2>{order.orderType === "delivery" ? t("Delivery to") : t("Pickup from")}</h2>
          <p>
            <strong>{order.customer.name}</strong>
            <br />
            {order.customer.phone} · {order.customer.email}
          </p>
          <p>{order.orderType === "delivery" ? addressText(order.address, t) : t(order.branchAddress)}</p>
          {order.note && <p className="muted">{t("Note:")} {order.note}</p>}
          <Link className="btn ghost" to={invoiceLink}>
            <Icon name="receipt" size={18} /> {t("View / print invoice")}
          </Link>
        </div>
      </div>

      <div className="panel">
        <h2>{t("Items")}</h2>
        <LinesTable order={order} />
      </div>
      <p className="center">
        <Link to="/menu">{t("Order something else")}</Link>
      </p>
    </section>
  );
}
