import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, getCart, saveCart, inr, toast } from '../api.js';
import { Icon } from '../icons.jsx';

const QUICK = [
  { label: 'Under ₹1,000', min: '', max: '1000' },
  { label: '₹1,000 – ₹2,500', min: '1000', max: '2500' },
  { label: 'Over ₹2,500', min: '2500', max: '' },
];

export default function Products() {
  const [all, setAll] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [cats, setCats] = useState([]);
  const [minP, setMinP] = useState('');
  const [maxP, setMaxP] = useState('');
  const [sort, setSort] = useState('relevance');
  const [inStock, setInStock] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/products')
      .then((r) => setAll(r.data))
      .catch((e) => { setError(errMsg(e)); toast(errMsg(e), 'err', 'Could not load products'); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const needle = q.trim().toLowerCase();
  const catOf = (p) => p.category || 'General';

  // Hero slides: up to 3 products that are in stock
  const featured = useMemo(() => {
    const inS = all.filter((p) => p.stock > 0);
    return (inS.length ? inS : all).slice(0, 3);
  }, [all]);
  const cur = featured[slide % Math.max(featured.length, 1)];

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (featured.length < 2 || paused || reduce) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length, paused]);

  const go = (d) => setSlide((s) => (s + d + featured.length) % featured.length);

  const categories = useMemo(() => ['All', ...[...new Set(all.map(catOf))].sort()], [all]);
  const counts = useMemo(() => {
    const m = { All: all.length };
    all.forEach((p) => { m[catOf(p)] = (m[catOf(p)] || 0) + 1; });
    return m;
  }, [all]);

  const toggleCat = (c) => {
    if (c === 'All') return setCats([]);
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const lo = minP === '' ? 0 : Number(minP);
  const hi = maxP === '' ? Infinity : Number(maxP);
  const priceOn = minP !== '' || maxP !== '';
  const filterCount = [cats.length > 0, priceOn, inStock].filter(Boolean).length;
  const filtersOn = filterCount > 0 || sort !== 'relevance' || needle !== '';
  const clearAll = () => { setQ(''); setCats([]); setMinP(''); setMaxP(''); setSort('relevance'); setInStock(false); };

  const results = useMemo(() => {
    const list = all.filter((p) =>
      (!needle || `${p.name} ${p.description || ''}`.toLowerCase().includes(needle)) &&
      (cats.length === 0 || cats.includes(catOf(p))) &&
      p.price >= lo && p.price <= hi &&
      (!inStock || p.stock > 0));
    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    if (sort === 'high') list.sort((a, b) => b.price - a.price);
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [all, needle, cats, lo, hi, inStock, sort]);

  const suggestions = useMemo(() => {
    if (!needle) return [];
    const starts = (p) => Number(p.name.toLowerCase().startsWith(needle));
    return all
      .filter((p) => p.name.toLowerCase().includes(needle))
      .sort((a, b) => starts(b) - starts(a))
      .slice(0, 6);
  }, [all, needle]);

  const highlight = (name) => {
    const i = name.toLowerCase().indexOf(needle);
    if (i < 0 || !needle) return name;
    return (<>{name.slice(0, i)}<mark>{name.slice(i, i + needle.length)}</mark>{name.slice(i + needle.length)}</>);
  };

  const choose = (p) => { setQ(p.name); setOpen(false); setActive(-1); };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (active >= 0 && suggestions[active]) choose(suggestions[active]); else setOpen(false); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const addToCart = (p) => {
    const cart = getCart();
    const line = cart.find((c) => c.productId === p.id);
    const inCart = line ? line.quantity : 0;
    if (inCart >= p.stock)
      return toast(
        inCart > 0 ? `All ${p.stock} available units of ${p.name} are already in your cart.` : `${p.name} is out of stock.`,
        'warn', 'Stock limit reached');
    if (line) { line.quantity += 1; line.stock = p.stock; line.imageUrl = p.imageUrl; }
    else cart.push({ productId: p.id, name: p.name, price: p.price, quantity: 1, stock: p.stock, imageUrl: p.imageUrl });
    saveCart(cart);
    toast(`${p.name} added to your cart.`, 'ok', 'Added to cart');
  };

  const stockPill = (s) =>
    s === 0 ? <span className="pill out">Out of stock</span>
    : s <= 5 ? <span className="pill low">Only {s} left</span>
    : <span className="pill ok">In stock</span>;

  const heading = needle ? `Results for “${q.trim()}”`
    : cats.length === 1 ? cats[0]
    : cats.length > 1 ? `${cats.length} categories`
    : 'All products';

  return (
    <>
      <section className="hero2" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="hero2-bg">
          {featured.map((p, i) => (
            <img key={p.id} src={p.imageUrl} alt="" className={i === slide % featured.length ? 'on' : ''} />
          ))}
        </div>
        <div className="hero2-shade" />

        <div className="hero2-content">
          <span className="badge-pill"><Icon name="sparkle" size={15} /> New arrivals</span>
          <h1>Everyday gear, <span className="accent">delivered.</span></h1>
          <p>Headphones, bags, shoes and more. Start typing to find a product.</p>

          <div className="search-wrap">
            <form className="searchbar" onSubmit={(e) => { e.preventDefault(); setOpen(false); }}>
              <span className="s-ic"><Icon name="search" size={20} /></span>
              <input
                role="combobox"
                aria-expanded={open && suggestions.length > 0}
                aria-controls="suggest-list"
                aria-label="Search products"
                placeholder="Search for headphones, shoes, bags..."
                value={q}
                autoComplete="off"
                onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={onKeyDown}
              />
              {q && (
                <button type="button" className="clear" aria-label="Clear search" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(''); setActive(-1); }}>✕</button>
              )}
              <button className="btn btn-primary">Search</button>
            </form>
            {open && suggestions.length > 0 && (
              <ul className="suggest" id="suggest-list" role="listbox">
                {suggestions.map((p, i) => (
                  <li key={p.id} role="option" aria-selected={i === active} className={i === active ? 'active' : ''}
                      onMouseDown={(e) => { e.preventDefault(); choose(p); }} onMouseEnter={() => setActive(i)}>
                    <img src={p.imageUrl} alt="" />
                    <span className="s-name">{highlight(p.name)}</span>
                    <span className="s-price">{inr(p.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="hero-perks">
            <span><Icon name="truck" size={17} /> Free delivery</span>
            <span><Icon name="shield" size={17} /> Cash on delivery</span>
            <span><Icon name="refresh" size={17} /> Live stock updates</span>
          </div>
        </div>

        {cur && (
          <>
            <Link className="hero2-caption" to={`/product/${cur.id}`}>
              <span>{cur.name}</span><b>{inr(cur.price)}</b>
            </Link>
            {featured.length > 1 && (
              <>
                <div className="hero2-nav">
                  <button aria-label="Previous slide" onClick={() => go(-1)}><Icon name="left" /></button>
                  <button aria-label="Next slide" onClick={() => go(1)}><Icon name="right" /></button>
                </div>
                <div className="hero2-dots">
                  {featured.map((p, i) => (
                    <button key={p.id} aria-label={`Show slide ${i + 1}`} className={i === slide % featured.length ? 'on' : ''} onClick={() => setSlide(i)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      <div className="shop">
        <aside className={`panel sidebar ${showFilters ? 'open' : ''}`}>
          <div className="side-head">
            <h5 className="m-0">Filters</h5>
            {filtersOn && <button className="link-btn clear-all" onClick={clearAll}>Clear all</button>}
          </div>

          <div className="side-block">
            <h6>Category</h6>
            <div className="cat-list">
              {categories.map((c) => (
                <label key={c} className="cat-row">
                  <input type="checkbox" checked={c === 'All' ? cats.length === 0 : cats.includes(c)} onChange={() => toggleCat(c)} />
                  <span>{c}</span>
                  <small>{counts[c] || 0}</small>
                </label>
              ))}
            </div>
          </div>

          <div className="side-block">
            <h6>Price (₹)</h6>
            <div className="price-inputs">
              <input className="form-control" type="number" min="0" placeholder="Min" aria-label="Minimum price" value={minP} onChange={(e) => setMinP(e.target.value)} />
              <input className="form-control" type="number" min="0" placeholder="Max" aria-label="Maximum price" value={maxP} onChange={(e) => setMaxP(e.target.value)} />
            </div>
            <div className="price-quick">
              {QUICK.map((r) => (
                <button key={r.label} className={`mini-chip ${minP === r.min && maxP === r.max ? 'on' : ''}`}
                        onClick={() => { setMinP(r.min); setMaxP(r.max); }}>{r.label}</button>
              ))}
            </div>
          </div>

          <div className="side-block">
            <h6>Availability</h6>
            <label className="check">
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In stock only
            </label>
          </div>
        </aside>

        <section>
          <div className="toolbar">
            <div>
              <h2>{heading}</h2>
              <span className="muted">{results.length} {results.length === 1 ? 'item' : 'items'}</span>
            </div>
            <div className="toolbar-right">
              <button className="btn btn-outline-secondary filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                Filters{filterCount > 0 && <span className="cart-badge">{filterCount}</span>}
              </button>
              <select className="form-select sort-select" aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="relevance">Sort: Default</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="panel empty">
              <h3>Products could not be loaded</h3>
              <p className="muted">{error}</p>
              <button className="btn btn-primary" onClick={load}>Try again</button>
            </div>
          )}
          {loading && <p className="muted">Loading products...</p>}
          {!loading && !error && results.length === 0 && (
            <div className="panel empty">
              <h3>No products match your search or filters</h3>
              <p className="muted">Check the spelling, widen the price range, or clear the filters.</p>
              <button className="btn btn-primary" onClick={clearAll}>Clear all filters</button>
            </div>
          )}

          <div className="grid">
            {results.map((p, idx) => (
              <article className="pcard" key={p.id} style={{ '--i': Math.min(idx, 8) }}>
                <Link to={`/product/${p.id}`} className="imgwrap"><img src={p.imageUrl} alt={p.name} loading="lazy" /></Link>
                <div className="pbody">
                  <span className="pcat">{catOf(p)}</span>
                  <h3 className="pname"><Link to={`/product/${p.id}`} className="plink">{p.name}</Link></h3>
                  <p className="pdesc">{p.description}</p>
                  <div className="pfoot">
                    <span className="price">{inr(p.price)}</span>
                    {stockPill(p.stock)}
                  </div>
                  <button className="btn btn-primary w-100 mt-2" disabled={p.stock === 0} onClick={() => addToCart(p)}>Add to cart</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
