import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg, getCart, saveCart, inr, toast } from '../api.js';

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    setQty(1);
    api.get(`/products/${id}`)
      .then((r) => setP(r.data))
      .catch((e) => { setFailed(true); toast(errMsg(e), 'err', 'Could not load product'); })
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = () => {
    const cart = getCart();
    const line = cart.find((c) => c.productId === p.id);
    const inCart = line ? line.quantity : 0;
    const available = p.stock - inCart;
    if (available <= 0)
      return toast(`All ${p.stock} available units of ${p.name} are already in your cart.`, 'warn', 'Stock limit reached');
    if (qty > available)
      return toast(`You can add only ${available} more of ${p.name}.`, 'warn', 'Stock limit reached');
    if (line) { line.quantity += qty; line.stock = p.stock; line.imageUrl = p.imageUrl; }
    else cart.push({ productId: p.id, name: p.name, price: p.price, quantity: qty, stock: p.stock, imageUrl: p.imageUrl });
    saveCart(cart);
    toast(`${qty} × ${p.name} added to your cart.`, 'ok', 'Added to cart');
  };

  if (loading) return <p className="muted">Loading product...</p>;

  if (failed || !p)
    return (
      <div className="panel empty">
        <h3>Product not found</h3>
        <p className="muted">It may have been removed or the link is wrong.</p>
        <Link className="btn btn-primary" to="/">Back to shop</Link>
      </div>
    );

  const pill = p.stock === 0 ? <span className="pill out">Out of stock</span>
    : p.stock <= 5 ? <span className="pill low">Only {p.stock} left</span>
    : <span className="pill ok">In stock</span>;

  return (
    <>
      <Link className="back-link" to="/">← Back to shop</Link>
      <div className="panel detail">
        <img className="detail-img" src={p.imageUrl} alt={p.name} />
        <div>
          <span className="pcat">{p.category || 'General'}</span>
          <h1>{p.name}</h1>
          <div className="d-flex align-items-center gap-3 mb-3">
            <span className="price">{inr(p.price)}</span>
            {pill}
          </div>
          <p>{p.description || 'No description available.'}</p>

          <div className="detail-buy">
            <div className="qty">
              <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span>{qty}</span>
              <button
                aria-label="Increase quantity"
                className={qty >= p.stock ? 'maxed' : ''}
                onClick={() => (qty >= p.stock
                  ? toast(`Only ${p.stock} of ${p.name} available.`, 'warn', 'Stock limit reached')
                  : setQty(qty + 1))}
              >+</button>
            </div>
            <button className="btn btn-primary btn-lg" disabled={p.stock === 0} onClick={addToCart}>
              {p.stock === 0 ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>

          <ul className="detail-meta">
            <li>Free delivery on every order</li>
            <li>Secure checkout</li>
            <li>Live stock: {p.stock} {p.stock === 1 ? 'unit' : 'units'} available</li>
          </ul>
        </div>
      </div>
    </>
  );
}
