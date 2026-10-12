import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Icon from "../components/Icon";
import { BranchSwitch } from "../components/Layout";
import PageBanner from "../components/PageBanner";
import { IFTAR, occasions, tableAreas, times, todayInput } from "../data";
import { useLang } from "../i18n";
import { useCafe } from "../store";

export default function Book() {
  const { location, locationId, user } = useCafe();
  const { t, isAr } = useLang();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [occasion, setOccasion] = useState(occasions[0]);
  const [time, setTime] = useState("8:00 PM");
  const branch = isAr ? location.ar : location.name;
  const timeLabel = (value) => (value === IFTAR ? t(IFTAR) : isAr ? value.replace("AM", "ص").replace("PM", "م") : value);

  function pickOccasion(value) {
    setOccasion(value);
    if (value === "Ramadan iftar") setTime(IFTAR);
    if (value === "Ramadan suhoor") setTime("1:00 AM");
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api("/bookings", { method: "POST", body: { ...data, branchId: locationId, guests: Number(data.guests) } });
      setBooking(result.booking);
    } catch (problem) {
      setError(t(problem.message));
    } finally {
      setBusy(false);
    }
  }

  if (booking) {
    return (
      <section className="page narrow center">
        <span className="success-mark">
          <Icon name="check" size={30} />
        </span>
        <h1>{t("Request sent")}</h1>
        <p>
          {t("Al Farooj Al Shami")} {isAr ? location.ar : booking.branchName} · {booking.date} · {timeLabel(booking.time)} ·{" "}
          {booking.guests === 1 ? t("1 guest") : t("{count} guests", { count: booking.guests })}
        </p>
        <p className="muted">
          {t("Request number {id}. The branch will call {phone} to confirm your table.", { id: booking.id, phone: booking.phone })}
        </p>
        <div className="hero-actions">
          <Link className="btn solid" to="/menu">
            {t("Browse the menu")}
          </Link>
          <a className="btn ghost" href={location.phoneHref}>
            {t("Call {branch}", { branch })}
          </a>
        </div>
      </section>
    );
  }

  return (
    <>
      <PageBanner photo="/images/food/hero-mezze.webp" eyebrow={t("Book a table")} title={t("Reserve a table at {branch}", { branch })}>
        <p>{t("Lunch, dinner, family gatherings, and iftar or suhoor in Ramadan. Send a request and the branch calls you to confirm. No booking fee.")}</p>
        <BranchSwitch />
      </PageBanner>
      <section className="page narrow">
        <form className="panel stack-form" onSubmit={submit}>
          <fieldset className="occasion-pick">
            <legend>{t("Occasion")}</legend>
            <div className="chip-bar wrap">
              {occasions.map((value) => (
                <label key={value} className={occasion === value ? "chip active" : "chip"}>
                  <input type="radio" name="occasion" value={value} checked={occasion === value} onChange={() => pickOccasion(value)} />
                  {t(value)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="field-grid">
            <label>
              {t("Date")}
              <input name="date" type="date" required min={todayInput()} defaultValue={todayInput()} />
            </label>
            <label>
              {t("Time")}
              <select name="time" value={time} onChange={(event) => setTime(event.target.value)}>
                {times.map((value) => (
                  <option key={value} value={value}>
                    {timeLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Guests")}
              <select name="guests" defaultValue="2">
                {Array.from({ length: 30 }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Seating")}
              <select name="area" defaultValue={tableAreas[0]}>
                {tableAreas.map((area) => (
                  <option key={area} value={area}>
                    {t(area)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Name")}
              <input name="name" required minLength={2} defaultValue={user?.name || ""} autoComplete="name" />
            </label>
            <label>
              {t("Mobile number")}
              <input name="phone" required inputMode="tel" defaultValue={user?.phone || ""} autoComplete="tel" placeholder="05x xxx xxxx" />
            </label>
            <label className="wide">
              {t("Email (optional)")}
              <input name="email" type="email" defaultValue={user?.email || ""} autoComplete="email" />
            </label>
            <label className="wide">
              {t("Note")}
              <input name="note" placeholder={t("High chair, birthday cake, mixed grill ready on arrival…")} />
            </label>
          </div>
          {(occasion === "Ramadan iftar" || time === IFTAR) && (
            <p className="muted small">
              {t("Iftar tables fill up fast in Ramadan. Book a few days ahead; the branch calls you to confirm the exact sunset time and your table.")}
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="btn solid block big" disabled={busy}>
            {busy ? t("Sending…") : t("Send table request")}
          </button>
        </form>
      </section>
    </>
  );
}
