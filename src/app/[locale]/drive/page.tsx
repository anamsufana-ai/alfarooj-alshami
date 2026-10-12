"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { copy, isLocale } from "@/i18n/copy";
import { locationAction } from "@/server/admin-actions";

export default function DrivePage() {
  const params = useParams<{ locale: string }>();
  const locale = isLocale(params.locale) ? params.locale : "en";
  const text = copy(locale);
  const [orderId, setOrderId] = useState("");
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!sharing || !orderId) return;
    const send = () => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const result = await locationAction({
          orderId,
          consent: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setMessage(result.ok ? text.lastUpdate : result.error);
      }, () => setMessage("location_denied"));
    };
    send();
    const timer = window.setInterval(send, 20000);
    return () => window.clearInterval(timer);
  }, [sharing, orderId, text.lastUpdate]);
  return (
    <section className="shell hero">
      <h1>{text.driverShare}</h1>
      <p>{text.driverHelp}</p>
      <label>Order id<input value={orderId} onChange={(event) => setOrderId(event.target.value)} /></label>
      <button type="button" onClick={() => setSharing((value) => !value)}>{sharing ? text.driverStop : text.driverShare}</button>
      <p aria-live="polite">{message}</p>
    </section>
  );
}
