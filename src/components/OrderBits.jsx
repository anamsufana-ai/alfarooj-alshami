import { useLang } from "../i18n";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, VAT_RATE, labelOf, money } from "../pricing";

export const flowFor = (orderType) =>
  orderType === "pickup"
    ? ["new", "accepted", "preparing", "ready", "collected"]
    : ["new", "accepted", "preparing", "out_for_delivery", "delivered"];

export function addressText(address, t = (text) => text) {
  if (!address) return "";
  return [
    address.apartment && `${t("Flat/Villa")} ${address.apartment}`,
    address.building,
    address.street,
    address.area,
    address.landmark && `(${address.landmark})`,
  ]
    .filter(Boolean)
    .join(", ");
}

export function dateTime(iso, lang = "en") {
  return new Date(iso).toLocaleString(lang === "ar" ? "ar-AE" : "en-GB", {
    timeZone: "Asia/Dubai",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatusBadge({ status }) {
  const { t } = useLang();
  return <span className={`badge status-${status}`}>{t(labelOf(ORDER_STATUSES, status))}</span>;
}

export function PaymentBadge({ order }) {
  const { t } = useLang();
  return (
    <span className={`badge pay-${order.paymentStatus}`}>
      {t(labelOf(PAYMENT_METHODS, order.paymentMethod))} · {t(labelOf(PAYMENT_STATUSES, order.paymentStatus))}
    </span>
  );
}

export function Timeline({ order }) {
  const { t, lang } = useLang();
  if (order.status === "cancelled") {
    return <p className="form-error">{t("This order was cancelled. Please call the branch if you have questions.")}</p>;
  }
  const flow = flowFor(order.orderType);
  const reached = flow.indexOf(order.status);
  return (
    <ol className="timeline">
      {flow.map((step, index) => {
        const when = order.history?.find((entry) => entry.status === step);
        return (
          <li key={step} className={index <= reached ? "done" : ""} aria-current={index === reached ? "step" : undefined}>
            <span className="dot" />
            <strong>{t(labelOf(ORDER_STATUSES, step))}</strong>
            {when && <small>{dateTime(when.at, lang)}</small>}
          </li>
        );
      })}
    </ol>
  );
}

export function LinesTable({ order }) {
  const { t, isAr } = useLang();
  return (
    <table className="lines-table">
      <thead>
        <tr>
          <th>{t("Item")}</th>
          <th className="num">{t("Qty")}</th>
          <th className="num">{t("Unit")}</th>
          <th className="num">{t("Amount")}</th>
        </tr>
      </thead>
      <tbody>
        {order.lines.map((line) => (
          <tr key={line.id}>
            <td>
              {(isAr && line.ar) || t(line.name)}
              {line.ar && <span className="item-ar">{isAr ? line.name : line.ar}</span>}
            </td>
            <td className="num">{line.qty}</td>
            <td className="num">{money(line.unit)}</td>
            <td className="num">{money(line.total)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan="3">{t("Subtotal (before VAT)")}</td>
          <td className="num">{money(order.subtotal)}</td>
        </tr>
        <tr>
          <td colSpan="3">{t("VAT {rate}%", { rate: Math.round(VAT_RATE * 100) })}</td>
          <td className="num">{money(order.vat)}</td>
        </tr>
        <tr>
          <td colSpan="3">{t("Delivery fee")}</td>
          <td className="num">{money(order.delivery)}</td>
        </tr>
        <tr className="grand">
          <td colSpan="3">{t("Total")}</td>
          <td className="num">{money(order.total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
