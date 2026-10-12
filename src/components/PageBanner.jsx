// Photo header for inner pages, using the restaurant's own food photography.
export default function PageBanner({ photo, eyebrow, title, children }) {
  return (
    <section className="page-banner" style={{ "--hero": `url(${photo})` }}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {children}
      </div>
    </section>
  );
}
