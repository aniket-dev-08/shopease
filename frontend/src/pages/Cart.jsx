import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components.jsx';
import api, { errMsg, getCart, saveCart, inr, toast } from '../api.js';

export default function Cart({ loggedIn }) {
  const [cart, setCart] = useState(getCart());
  const navigate = useNavigate();

  const update = (next) => { setCart(next); saveCart(next); };

  // Compare the cart with live stock and fix anything that is out of date
  const syncStock = () => {
    const current = getCart();
    if (current.length === 0) return Promise.resolve();
    return api.get('/products').then(({ data }) => {
      const byId = new Map(data.map((p) => [p.id, p]));
      const next = [];
      current.forEach((c) => {
        const p = byId.get(c.productId);
        if (!p || p.stock === 0) {
          toast(`${c.name} is no longer available and was removed from your cart.`, 'warn', 'Cart updated');
          return;
        }
        let qty = c.quantity;
        if (qty > p.stock) {
          qty = p.stock;
          toast(`Only ${p.stock} of ${c.name} left. We changed the quantity to ${p.stock}.`, 'warn', 'Cart updated');
        }
        next.push({ ...c, price: p.price, stock: p.stock, imageUrl: p.imageUrl, quantity: qty });
      });
      update(next);
    }).catch(() => {});
  };

  useEffect(() => { syncStock(); }, []);

  const changeQty = (c, d) => {
    if (d > 0 && c.stock !== undefined && c.quantity >= c.stock)
      return toast(`Only ${c.stock} of ${c.name} available.`, 'warn', 'Stock limit reached');
    update(cart.map((x) => (x.productId === c.productId ? { ...x, quantity: Math.max(1, x.quantity + d) } : x)));
  };

  const remove = (c) => {
    update(cart.filter((x) => x.productId !== c.productId));
    toast(`${c.name} removed from your cart.`, 'info');
  };

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);

  const goCheckout = () => {
    if (!loggedIn) {
      toast('Log in to continue to checkout. Your cart will be kept.', 'info', 'Login required');
      return navigate('/login');
    }
    navigate('/checkout');
  };

  if (cart.length === 0)
    return (
      <div className="panel empty">
        <h3>Your cart is empty</h3>
        <p className="muted">Add something you like and it will show up here.</p>
        <Link className="btn btn-primary" to="/">Browse products</Link>
      </div>
    );

  return (
    <>
      <PageHeader pill="Shopping cart" title="Your cart" sub={`${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready for checkout`} />
      <div className="cart-layout">
        <div className="panel">
          {cart.map((c) => {
            const maxed = c.stock !== undefined && c.quantity >= c.stock;
            return (
              <div className="cart-row" key={c.productId}>
                <div className="cart-item">
                  {c.imageUrl && <img className="cart-thumb" src={c.imageUrl} alt="" />}
                  <div>
                  <strong>{c.name}</strong>
                  <div className="muted">{inr(c.price)} each</div>
                  {c.stock !== undefined && c.stock <= 5 && <div className="low-text">Only {c.stock} left in stock</div>}
                  </div>
                </div>
                <div className="qty">
                  <button aria-label="Decrease quantity" onClick={() => changeQty(c, -1)}>−</button>
                  <span>{c.quantity}</span>
                  <button className={maxed ? 'maxed' : ''} aria-label="Increase quantity" title={maxed ? `Maximum ${c.stock} available` : ''} onClick={() => changeQty(c, 1)}>+</button>
                </div>
                <strong>{inr(c.price * c.quantity)}</strong>
                <button className="link-btn" onClick={() => remove(c)}>Remove</button>
              </div>
            );
          })}
        </div>
        <aside className="panel summary">
          <h5 className="mb-3">Order summary</h5>
          <div className="line"><span className="muted">Subtotal</span><span>{inr(total)}</span></div>
          <div className="line"><span className="muted">Delivery</span><span>Free</span></div>
          <div className="line total"><span>Total</span><span>{inr(total)}</span></div>
          <button className="btn btn-primary btn-lg w-100 mt-2" onClick={goCheckout}>
            {loggedIn ? 'Proceed to checkout' : 'Log in to checkout'}
          </button>
        </aside>
      </div>
    </>
  );
}
