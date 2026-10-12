import { Link } from "react-router-dom";
import { useLang } from "../i18n";

export default function Legal({ kind }) {
  const { t } = useLang();

  if (kind === "missing") {
    return (
      <section className="page narrow">
        <p className="eyebrow">404</p>
        <h1>{t("That page is not on the menu")}</h1>
        <p>{t("This page does not exist. Start from the home page or the branch menu.")}</p>
        <Link className="btn solid" to="/">
          {t("Go home")}
        </Link>
      </section>
    );
  }

  if (kind === "privacy") {
    return (
      <section className="page narrow prose">
        <p className="eyebrow">{t("Privacy")}</p>
        <h1>{t("How we use your details")}</h1>
        <p>
          {t(
            "When you order, Al Farooj Al Shami keeps your name, phone, email, delivery address and order details so the branch can prepare and deliver your order, issue your VAT invoice and keep its sales records.",
          )}
        </p>
        <p>
          {t(
            "If you create an account, your password is stored scrambled (hashed), never in plain text. Online card payments are handled by Stripe; the restaurant never sees or stores your card number.",
          )}
        </p>
        <p>
          {t(
            "We do not sell your details. To see, correct or delete your data, call the branch you ordered from.",
          )}
        </p>
      </section>
    );
  }

  return (
    <section className="page narrow prose">
      <p className="eyebrow">{t("Terms")}</p>
      <h1>{t("How ordering works")}</h1>
      <p>
        {t(
          "Menu prices are shown before 5% VAT. At checkout we add 5% VAT on food and drinks and an AED 10 delivery fee for delivery orders. Pickup has no delivery fee. The total to pay is shown before you place the order.",
        )}
      </p>
      <p>
        {t(
          "You can pay cash on delivery, by card machine on delivery, or online by card through Stripe. Online payments are confirmed straight away; cash and card machine payments are collected by the rider or at the counter.",
        )}
      </p>
      <p>
        {t(
          "A dish can sell out. If anything changes, the branch calls you before preparing the order. Each branch has its own menu and prices; menu prices include 5% VAT.",
        )}
      </p>
    </section>
  );
}
