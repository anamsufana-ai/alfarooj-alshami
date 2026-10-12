import PageBanner from "../components/PageBanner";
import { locations } from "../data";
import { useLang } from "../i18n";

export default function Contact() {
  const { t, isAr } = useLang();

  return (
    <>
    <PageBanner photo="/images/food/appetizers.webp" eyebrow={t("Contact")} title={t("Call the branch closest to you")}>
      <p>{t("Each branch has its own phone and its own menu.")}</p>
    </PageBanner>
    <section className="page contact-page">
      <div className="contact-grid">
        {locations.map((place) => (
          <article key={place.id}>
            <p className="eyebrow">{t(place.city)}</p>
            <h2>{isAr ? place.ar : place.name}</h2>
            <p>{isAr ? place.addressAr : place.address}</p>
            {place.hours && <p>{t(place.hours)}</p>}
            <p>
              {place.phones.map((phone, index) => (
                <span key={phone}>
                  {index > 0 && " · "}
                  <a href={`tel:+971${phone.replace(/\D/g, "").slice(1)}`} dir="ltr">
                    {phone}
                  </a>
                </span>
              ))}
            </p>
            <p>
              <a href={place.maps} target="_blank" rel="noreferrer">
                {t("Directions")}
              </a>
              {place.whatsapp && (
                <>
                  {" · "}
                  <a href={`https://wa.me/${place.whatsapp}`} target="_blank" rel="noreferrer">
                    {t("WhatsApp")}
                  </a>
                </>
              )}
            </p>
          </article>
        ))}
      </div>
    </section>
    </>
  );
}
