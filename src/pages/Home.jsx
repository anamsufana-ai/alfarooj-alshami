import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { aed, categoriesFor, categoryPhotos, galleryPhotos, locations, photoCategories, picksFor } from "../data";
import { useLang } from "../i18n";
import { useCafe } from "../store";

const CITIES = ["Dubai", "Sharjah", "Ajman"];

export function BranchPicker({ onPick }) {
  const { locationId, setLocationId } = useCafe();
  const { t, isAr } = useLang();
  return (
    <div className="branch-picker" role="group" aria-label={t("Choose your branch")}>
      {CITIES.map((city) => (
        <div key={city} className="branch-city">
          <span className="branch-city-name">{t(city)}</span>
          <div className="branch-city-list">
            {locations
              .filter((place) => place.city === city)
              .map((place) => (
                <button
                  key={place.id}
                  type="button"
                  aria-pressed={locationId === place.id}
                  onClick={() => {
                    setLocationId(place.id);
                    onPick?.(place);
                  }}
                >
                  <Icon name="pin" size={18} />
                  <span>
                    <strong>{isAr ? place.ar : place.name}</strong>
                    <small dir="ltr">{place.phone}</small>
                  </span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { location, locationId, setLocationId, addItem, lineQty } = useCafe();
  const { t, isAr, itemName, arrow } = useLang();
  const picks = picksFor(locationId);
  const categories = categoriesFor(locationId);
  const branch = isAr ? location.ar : location.name;

  return (
    <>
      <section className="hero brand-hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-tag arabic">لقمة أهل الشام</p>
            <h1>{t("Damascus cooking, from our charcoal to your table")}</h1>
            <p className="lede">
              {t("Shawarma, mixed grills, broasted chicken, fatteh and fresh manakish from five Al Farooj Al Shami branches in Dubai, Sharjah and Ajman.")}
            </p>
            <div className="hero-actions">
              <Link className="btn solid big" to="/menu">
                {t("Order from {branch}", { branch })}
              </Link>
              <a className="btn ghost big" href={location.phoneHref}>
                <Icon name="phone" size={18} /> <span dir="ltr">{location.phone}</span>
              </a>
            </div>
          </div>
          <div className="hero-plates" aria-hidden="true">
            <img className="plate plate-main" src="/images/food/hero-grill.webp" alt="" fetchpriority="high" />
            <img className="plate plate-a" src="/images/food/hero-mezze.webp" alt="" />
            <img className="plate plate-b" src="/images/food/broasted.webp" alt="" />
          </div>
        </div>
        <div className="hero-branches">
          <p className="picker-title">
            <span className="step-dot">1</span> {t("Choose your branch. Each branch has its own menu and prices.")}
          </p>
          <BranchPicker />
        </div>
      </section>

      <section className="feature-strip" aria-label={t("Why order from Al Farooj Al Shami")}>
        <div>
          <Icon name="flame" size={28} />
          <strong>{t("Grilled on charcoal")}</strong>
          <span>{t("Kebab, tikka, shish tawook and chicken, made when you order")}</span>
        </div>
        <div>
          <Icon name="pin" size={28} />
          <strong>{t("Five branches")}</strong>
          <span>{t("Al Rigga, International City, Muweilah, Sahara and Ajman")}</span>
        </div>
        <div>
          <Icon name="cash" size={28} />
          <strong>{t("Pay your way")}</strong>
          <span>{t("Cash or card machine at your door, or at the counter")}</span>
        </div>
        <div>
          <Icon name="receipt" size={28} />
          <strong>{t("Printed menu prices")}</strong>
          <span>{t("VAT is already included, with a VAT invoice for every order")}</span>
        </div>
      </section>

      {picks.length > 0 && (
        <section className="section" id="favourites">
          <div className="section-head centered">
            <p className="eyebrow ornament">{t("House favourites at {branch}", { branch })}</p>
            <h2>{t("The plates our guests order by name")}</h2>
          </div>
          <div className="pick-grid">
            {picks.map((item) => (
              <article key={item.id} className="pick-card">
                <div className="pick-photo">
                  <img src={item.photo} alt={itemName(item)} loading="lazy" />
                  <span className="pick-tag">{t(item.tag)}</span>
                </div>
                <div className="pick-body">
                  <h3 className="pick-name">{itemName(item)}</h3>
                  <p className="item-ar">{isAr ? item.name : item.ar}</p>
                  {item.note && <p className="pick-note">{t(item.note)}</p>}
                  <div className="pick-foot">
                    <strong className="pick-price">{aed(item.price)}</strong>
                    <button type="button" className="btn outline block" onClick={() => addItem(item)}>
                      {lineQty(item.id) ? t("Added · {count} in basket", { count: lineQty(item.id) }) : t("+ Add to order")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow ornament">{t("The {branch} menu", { branch })}</p>
            <h2>{t("Everything on the printed menu, one tap away")}</h2>
          </div>
          <Link to="/menu">
            {t("See the full menu")} {arrow}
          </Link>
        </div>
        <div className="photo-cats">
          {categories.map((category) => (
            <Link
              key={category.id}
              className={photoCategories.has(category.id) ? "photo-cat" : "photo-cat no-photo"}
              to={`/menu#${category.id}`}
            >
              {photoCategories.has(category.id) && <img src={categoryPhotos[category.id]} alt="" loading="lazy" />}
              <span>
                <strong>{isAr ? category.ar : category.name}</strong>
                <small>{isAr ? category.name : category.ar}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="branches">
        <div className="section-head">
          <div>
            <p className="eyebrow ornament">{t("Our branches")}</p>
            <h2>{t("Five kitchens across Dubai, Sharjah and Ajman")}</h2>
          </div>
        </div>
        <div className="branch-cards">
          {locations.map((place) => (
            <article key={place.id} className={place.id === locationId ? "branch-card current" : "branch-card"}>
              <p className="eyebrow">{t(place.city)}</p>
              <h3>{isAr ? place.ar : place.name}</h3>
              <ul className="branch-facts">
                <li>
                  <Icon name="pin" size={18} /> {isAr ? place.addressAr : place.address}
                </li>
                {place.phones.map((phone) => (
                  <li key={phone}>
                    <Icon name="phone" size={18} />{" "}
                    <a href={`tel:+971${phone.replace(/\D/g, "").slice(1)}`} dir="ltr">
                      {phone}
                    </a>
                  </li>
                ))}
                {place.hours && (
                  <li>
                    <Icon name="clock" size={18} /> {t(place.hours)}
                  </li>
                )}
                {place.deliveryNote && (
                  <li>
                    <Icon name="scooter" size={18} /> {t(place.deliveryNote)}
                  </li>
                )}
              </ul>
              <div className="row-actions">
                <Link className="btn solid small" to="/menu" onClick={() => setLocationId(place.id)}>
                  {t("Order here")}
                </Link>
                <a className="btn ghost small" href={place.maps} target="_blank" rel="noreferrer">
                  {t("Directions")}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow ornament">{t("From our kitchen")}</p>
            <h2>{t("Every plate tells a story")}</h2>
            <p className="arabic sub">من مطبخنا الشامي، الأكلات منقاية وكل طبق بيحكي حكاية</p>
          </div>
        </div>
        <div className="mosaic">
          {galleryPhotos.map((photo) => (
            <figure key={photo.src}>
              <img src={photo.src} alt={t(photo.caption)} loading="lazy" />
              <figcaption>
                <strong>{t(photo.caption)}</strong>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="section steps">
        <p className="eyebrow ornament">{t("How it works")}</p>
        <h2>{t("From craving to your door in four taps")}</h2>
        <ol>
          <li>
            <span className="step-badge">1</span>
            <strong>{t("Choose your branch")}</strong>
            <span>{t("The one closest to you. Its own menu opens.")}</span>
          </li>
          <li>
            <span className="step-badge">2</span>
            <strong>{t("Pick your dishes")}</strong>
            <span>{t("Grills, shawarma, appetizers, juices and more.")}</span>
          </li>
          <li>
            <span className="step-badge">3</span>
            <strong>{t("Pay your way")}</strong>
            <span>{t("Cash or card machine, at your door or at the counter.")}</span>
          </li>
          <li>
            <span className="step-badge">4</span>
            <strong>{t("Follow your order")}</strong>
            <span>{t("See every step live, from our kitchen to your door.")}</span>
          </li>
        </ol>
      </section>

      <section className="cta-banner" style={{ "--hero": "url(/images/food/fattah.webp)" }}>
        <div>
          <p className="arabic cta-ar">صحة و ألف عافية</p>
          <h2>{t("Hungry? The grill is already hot.")}</h2>
          <p>{t("Order online for delivery or pickup, or call your branch.")}</p>
          <div className="hero-actions">
            <Link className="btn solid big" to="/menu">
              {t("Start your order")}
            </Link>
            <a className="btn ghost big" href={location.phoneHref}>
              {t("Call {branch}", { branch })}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
