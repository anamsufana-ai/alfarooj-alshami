import { Link } from "react-router-dom";
import PageBanner from "../components/PageBanner";
import { galleryPhotos, locations } from "../data";
import { useLang } from "../i18n";
import { useCafe } from "../store";

export default function About() {
  const { t, isAr } = useLang();
  const { setLocationId } = useCafe();
  return (
    <>
      <PageBanner photo="/images/food/oven.webp" eyebrow={t("About")} title={t("Al Farooj Al Shami")}>
        <p className="arabic">مطعم الفروج الشامي · لقمة أهل الشام</p>
      </PageBanner>
      <section className="page">
        <div className="about-grid">
          <article>
            <h2>{t("Food from Al Sham")}</h2>
            <p>
              {t("Al Farooj Al Shami cooks the dishes of Damascus and the Levant: charcoal grills and chicken, shawarma, fatteh and foul, hot and cold appetizers, oven trays and fresh manakish.")}
            </p>
            <p>{t("Each branch prints its own menu, so dishes and prices can differ. Choose your branch first and you see exactly what that kitchen makes.")}</p>
          </article>
          <article className="about-photo">
            <img src="/images/storefront-rigga.webp" alt={t("The Al Farooj Al Shami restaurant on Al Rigga Street at night")} loading="lazy" />
          </article>
        </div>
        <div className="about-photos">
          {galleryPhotos.slice(0, 3).map((photo) => (
            <img key={photo.src} src={photo.src} alt={t(photo.caption)} loading="lazy" />
          ))}
        </div>
        <div className="branch-cards">
          {locations.map((place) => (
            <article key={place.id} className="branch-card">
              <p className="eyebrow">{t(place.city)}</p>
              <h3>{isAr ? place.ar : place.name}</h3>
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
              <Link className="btn solid small" to="/menu" onClick={() => setLocationId(place.id)}>
                {t("Order here")}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
