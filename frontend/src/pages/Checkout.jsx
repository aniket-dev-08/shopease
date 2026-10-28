import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components.jsx';
import api, { errMsg, getCart, saveCart, inr, toast } from '../api.js';

const savedShipping = () => {
  try { return JSON.parse(localStorage.getItem('shipping')) || {}; } catch { return {}; }
};

export default function Checkout() {
  const saved = savedShipping();
  const [form, setForm] = useState({
    fullName: saved.fullName || localStorage.getItem('name') || '',
    phone: saved.phone || '',
    addressLine: saved.addressLine || '',
    city: saved.city || '',
    pincode: saved.pincode || '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const cart = getCart();
  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const change = (e) => {
    const { name } = e.target;
    const value = name === 'phone' || name === 'pincode' ? e.target.value.replace(/\D/g, '') : e.target.value;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const er = {};
    if (!form.fullName.trim()) er.fullName = 'Enter the receiver’s name';
    if (!/^\d{10}$/.test(form.phone)) er.phone = 'Enter a 10-digit mobile number';
    if (!form.addressLine.trim()) er.addressLine = 'Enter the delivery address';
    if (!form.city.trim()) er.city = 'Enter your city';
    if (!/^\d{6}$/.test(form.pincode)) er.pincode = 'Enter a 6-digit pincode';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return toast('Please fix the highlighted fields.', 'warn', 'Check your details');
    setBusy(true);
    try {
      const { data } = await api.post('/orders', {
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        shipping: form,
      });
      localStorage.setItem('shipping', JSON.stringify(form));
      saveCart([]);
      setDone(data);
      toast('Your order has been placed.', 'ok', 'Order placed');
    } catch (err) {
      toast(errMsg(err), 'err', 'Order not placed');
    }
    setBusy(false);
  };

  const field = (name, label, extra = {}, wide = false) => (
    <div className={`field ${wide ? 'wide' : ''}`}>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} className={`form-control ${errors[name] ? 'is-invalid' : ''}`} value={form[name]} onChange={change} {...extra} />
      {errors[name] && <div className="field-err">{errors[name]}</div>}
    </div>
  );

  if (done)
    return (
      <div className="panel empty">
        <h3>Order #{done.id} placed</h3>
        <p className="muted">
          We will deliver it to {done.fullName}, {done.addressLine}, {done.city} - {done.pincode}.
          Please keep {inr(done.total)} ready to pay on delivery.
        </p>
        <Link className="btn btn-primary me-2" to="/orders">View my orders</Link>
        <Link className="btn btn-outline-secondary" to="/">Keep shopping</Link>
      </div>
    );

  if (cart.length === 0)
    return (
      <div className="panel empty">
        <h3>Your cart is empty</h3>
        <p className="muted">Add some products before checking out.</p>
        <Link className="btn btn-primary" to="/">Browse products</Link>
      </div>
    );

  return (
    <>
      <Link className="back-link" to="/cart">← Back to cart</Link>
      <PageHeader pill="Secure checkout" title="Checkout" sub="Add your delivery address and place your order." />
      <div className="cart-layout">
        <form className="panel checkout-form" onSubmit={submit} noValidate>
          <h5 className="mb-3">Delivery address</h5>
          <div className="form-grid">
            {field('fullName', 'Full name', { autoComplete: 'name' })}
            {field('phone', 'Mobile number', { inputMode: 'numeric', maxLength: 10, autoComplete: 'tel', placeholder: '10 digits' })}
            {field('addressLine', 'Address (house no., street, area)', { autoComplete: 'street-address' }, true)}
            {field('city', 'City', { autoComplete: 'address-level2' })}
            {field('pincode', 'Pincode', { inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code', placeholder: '6 digits' })}
          </div>

          <h5 className="mt-4 mb-2">Payment</h5>
          <label className="pay-box">
            <input type="radio" checked readOnly />
            <span><strong>Cash on Delivery</strong><span className="muted d-block">Pay in cash when your order arrives.</span></span>
          </label>

          <button className="btn btn-primary btn-lg w-100 mt-4" disabled={busy}>
            {busy ? 'Placing order...' : `Place order · ${inr(total)}`}
          </button>
        </form>

        <aside className="panel summary">
          <h5 className="mb-3">Order summary</h5>
          {cart.map((c) => (
            <div className="line" key={c.productId}>
              <span>{c.name} × {c.quantity}</span>
              <span>{inr(c.price * c.quantity)}</span>
            </div>
          ))}
          <div className="line"><span className="muted">Delivery</span><span>Free</span></div>
          <div className="line total"><span>Total</span><span>{inr(total)}</span></div>
        </aside>
      </div>
    </>
  );
}
