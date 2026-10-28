// Shared dark page banner, same look as the home page hero
export function PageHeader({ pill, title, sub, children }) {
  return (
    <section className="page-hero">
      <div>
        {pill && <span className="badge-pill">{pill}</span>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="page-hero-side">{children}</div>}
    </section>
  );
}
