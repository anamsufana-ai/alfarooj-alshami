import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { PaymentBadge, StatusBadge, addressText, dateTime } from "../components/OrderBits";
import { locationById } from "../data";
import { money } from "../pricing";
import { useLang } from "../i18n";
import { useCafe } from "../store";

function AuthForms() {
  const { signIn, notify } = useCafe();
  const { t } = useLang();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api(mode === "login" ? "/auth/login" : "/auth/register", { method: "POST", body: data });
      signIn(result);
      notify(t("Welcome, {name}", { name: result.user.name.split(" ")[0] }));
      const next = params.get("next");
      if (next && next.startsWith("/")) navigate(next);
    } catch (problem) {
      setError(t(problem.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page narrow">
      <p className="eyebrow">{t("My account")}</p>
      <h1>{mode === "login" ? t("Sign in") : t("Create your account")}</h1>
      <p className="muted">{t("See your orders, download invoices and check out faster with a saved address.")}</p>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => setMode("login")}>
          {t("Sign in")}
        </button>
        <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => setMode("register")}>
          {t("Create account")}
        </button>
      </div>
      <form className="panel stack-form" onSubmit={submit} key={mode}>
        {mode === "register" && (
          <>
            <label>
              {t("Full name")}
              <input name="name" required minLength={2} autoComplete="name" />
            </label>
            <label>
              {t("Mobile number")}
              <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="05x xxx xxxx" />
            </label>
          </>
        )}
        <label>
          {t("Email")}
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          {t("Password")}
          <input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : 1}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn solid block" type="submit" disabled={busy}>
          {busy ? t("Please wait…") : mode === "login" ? t("Sign in") : t("Create account")}
        </button>
      </form>
      <GuestOrders />
    </section>
  );
}

function GuestOrders() {
  const { recent } = useCafe();
  const { t, lang } = useLang();
  if (!recent.length) return null;
  return (
    <div className="panel">
      <h2>{t("Orders on this device")}</h2>
      <ul className="simple-list">
        {recent.map((entry) => (
          <li key={entry.ref}>
            <Link to={`/order/${entry.ref}?k=${entry.k}`}>{entry.ref}</Link>
            <span className="muted">
              {t(locationById(entry.branchId).name)} · {dateTime(entry.createdAt, lang)}
            </span>
            {entry.total ? <strong>{money(entry.total)}</strong> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfileCard() {
  const { user, token, setUser, notify } = useCafe();
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const { name, phone, ...address } = data;
    try {
      const result = await api("/me", {
        method: "PUT",
        token,
        body: { name, phone, address: address.area ? address : null },
      });
      setUser(result.user);
      setEditing(false);
      notify(t("Profile saved"));
    } catch (problem) {
      setError(t(problem.message));
    }
  }

  if (!editing) {
    return (
      <div className="panel">
        <h2>{t("Profile")}</h2>
        <p>
          <strong>{user.name}</strong>
          <br />
          {user.email}
          <br />
          {user.phone}
        </p>
        <p className="muted">{user.address ? addressText(user.address, t) : t("No delivery address saved yet.")}</p>
        <button type="button" className="btn ghost" onClick={() => setEditing(true)}>
          {t("Edit profile & address")}
        </button>
      </div>
    );
  }
  const a = user.address || {};
  return (
    <form className="panel stack-form" onSubmit={save}>
      <h2>{t("Edit profile")}</h2>
      <label>
        {t("Full name")}
        <input name="name" defaultValue={user.name} required />
      </label>
      <label>
        {t("Mobile number")}
        <input name="phone" defaultValue={user.phone} required />
      </label>
      <label>
        {t("Area")}
        <input name="area" defaultValue={a.area} />
      </label>
      <label>
        {t("Building / villa")}
        <input name="building" defaultValue={a.building} />
      </label>
      <label>
        {t("Flat / office / villa no.")}
        <input name="apartment" defaultValue={a.apartment} />
      </label>
      <label>
        {t("Street")}
        <input name="street" defaultValue={a.street} />
      </label>
      <label>
        {t("Landmark")}
        <input name="landmark" defaultValue={a.landmark} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="row-actions">
        <button className="btn solid" type="submit">
          {t("Save")}
        </button>
        <button className="btn ghost" type="button" onClick={() => setEditing(false)}>
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}

export default function Account() {
  const { user, token, signOut } = useCafe();
  const { t, lang } = useLang();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api("/me/orders", { token })
      .then((data) => setOrders(data.orders))
      .catch((problem) => {
        if (problem.status === 401) signOut();
        setError(t(problem.message));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!user) return <AuthForms />;

  const live = (orders || []).filter((order) => order.status !== "cancelled");
  const spent = live.reduce((sum, order) => sum + order.total, 0);

  return (
    <section className="page dashboard">
      <header className="menu-head">
        <div>
          <p className="eyebrow">{t("My account")}</p>
          <h1>{t("Hello, {name}", { name: user.name.split(" ")[0] })}</h1>
        </div>
        <div className="row-actions">
          <Link className="btn solid" to="/menu">
            {t("New order")}
          </Link>
          <button type="button" className="btn ghost" onClick={signOut}>
            {t("Sign out")}
          </button>
        </div>
      </header>
      <div className="kpis">
        <div className="kpi">
          <span>{t("Orders")}</span>
          <strong>{live.length}</strong>
        </div>
        <div className="kpi">
          <span>{t("Total spent")}</span>
          <strong>{money(spent)}</strong>
        </div>
        <div className="kpi">
          <span>{t("Open orders")}</span>
          <strong>{live.filter((order) => !["delivered", "collected"].includes(order.status)).length}</strong>
        </div>
      </div>
      <div className="dash-grid">
        <div className="panel">
          <h2>{t("My orders")}</h2>
          {error && <p className="form-error">{error}</p>}
          {orders === null && !error && <p className="muted">{t("Loading…")}</p>}
          {orders?.length === 0 && (
            <p className="muted">
              {t("No orders yet.")} <Link to="/menu">{t("Start your first order")}</Link>.
            </p>
          )}
          {orders?.length > 0 && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("Order")}</th>
                    <th>{t("Date")}</th>
                    <th>{t("Branch")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Payment")}</th>
                    <th className="num">{t("Total")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.ref}>
                      <td>
                        <Link to={`/order/${order.ref}`}>{order.ref}</Link>
                      </td>
                      <td>{dateTime(order.createdAt, lang)}</td>
                      <td>{t(order.branchName)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        <PaymentBadge order={order} />
                      </td>
                      <td className="num">{money(order.total)}</td>
                      <td>
                        <Link to={`/invoice/${order.ref}`}>{t("Invoice")}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <ProfileCard />
      </div>
    </section>
  );
}
