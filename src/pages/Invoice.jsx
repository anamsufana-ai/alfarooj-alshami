import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import Logo from "../components/Logo";
import { LinesTable, addressText, dateTime } from "../components/OrderBits";
import { locationById } from "../data";
import { PAYMENT_METHODS, PAYMENT_STATUSES, labelOf } from "../pricing";
import { useLang } from "../i18n";
import { useCafe } from "../store";

export default function Invoice() {
  const { ref } = useParams();
  const [params] = useSearchParams();
  const { token, adminToken } = useCafe();
  const { t, lang, isAr } = useLang();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const k = params.get("k") || "";

  useEffect(() => {
    api(`/orders/${ref}?k=${encodeURIComponent(k)}`, { token: k ? "" : adminToken || token })
      .then((data) => setOrder(data.order))
      .catch((problem) => setError(t(problem.message)));
  }, [ref, k, token, adminToken]);

  if (error) {
    return (
      <div className="invoice-page">
        <p>{error}</p>
        <Link to="/">{t("Back to Al Farooj Al Shami")}</Link>
      </div>
    );
  }
  if (!order) return <div className="invoice-page">{t("Loading invoice…")}</div>;
  const branch = locationById(order.branchId);

  return (
    <div className="invoice-page">
      <div className="invoice-actions no-print">
        <Link to={`/order/${order.ref}${k ? `?k=${encodeURIComponent(k)}` : ""}`}>{isAr ? "→" : "←"} {t("Back to order")}</Link>
        <button type="button" className="btn solid" onClick={() => window.print()}>
          {t("Print / save as PDF")}
        </button>
      </div>
      <article className="invoice">
        <header>
          <div className="invoice-brand">
            <Logo />
            <div>
              <strong>{t("Al Farooj Al Shami Restaurant")}</strong>
              <span>{t(branch.name)}</span>
              <span>{t(branch.address)}</span>
              <span dir="ltr">{branch.phone}</span>
              {branch.trn && <span>{t("TRN")} {branch.trn}</span>}
            </div>
          </div>
          <div className="invoice-meta">
            <h1>{isAr ? "فاتورة ضريبية" : "Tax invoice"}</h1>
            <span>{isAr ? "Tax invoice" : "فاتورة ضريبية"}</span>
            <dl>
              <dt>{t("Invoice no.")}</dt>
              <dd>{order.ref}</dd>
              <dt>{t("Date")}</dt>
              <dd>{dateTime(order.createdAt, lang)}</dd>
              <dt>{t("Order type")}</dt>
              <dd>{order.orderType === "delivery" ? t("Delivery") : t("Pickup")}</dd>
            </dl>
          </div>
        </header>
        <section className="invoice-party">
          <div>
            <h2>{t("Bill to")}</h2>
            <p>
              <strong>{order.customer.name}</strong>
              <br />
              {order.customer.phone}
              <br />
              {order.customer.email}
            </p>
          </div>
          <div>
            <h2>{order.orderType === "delivery" ? t("Deliver to") : t("Pickup at")}</h2>
            <p>{order.orderType === "delivery" ? addressText(order.address, t) : t(order.branchAddress)}</p>
          </div>
          <div>
            <h2>{t("Payment")}</h2>
            <p>
              {t(labelOf(PAYMENT_METHODS, order.paymentMethod))}
              <br />
              {t(labelOf(PAYMENT_STATUSES, order.paymentStatus))}
              {order.paidAt && (
                <>
                  <br />
                  {dateTime(order.paidAt, lang)}
                </>
              )}
            </p>
          </div>
        </section>
        <LinesTable order={order} />
        <footer>
          <p>{t("Amounts in UAE dirhams (AED). Prices include 5% VAT. Thank you for ordering from Al Farooj Al Shami.")}</p>
        </footer>
      </article>
    </div>
  );
}
