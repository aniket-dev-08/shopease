import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components.jsx';
import api, { errMsg, inr, toast } from '../api.js';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then((r) => setOrders(r.data))
      .catch((e) => { setError(errMsg(e)); toast(errMsg(e), 'err', 'Could not load orders'); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader pill="Order history" title="My orders" sub={loading ? 'Loading your orders...' : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} placed`} />
      {loading && <p className="muted">Loading your orders...</p>}
      {!loading && !error && orders.length === 0 && (
        <div className="panel empty">
          <h3>No orders yet</h3>
          <p className="muted">Once you place an order, it will appear here.</p>
          <Link className="btn btn-primary" to="/">Start shopping</Link>
        </div>
      )}
      {orders.map((o) => (
        <div className="panel order" key={o.id}>
          <div className="order-head">
            <div>
              <strong>Order #{o.id}</strong>
              <div className="muted">{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>
            <span className="pill ok">{o.status}</span>
          </div>
          {o.items.map((i, idx) => (
            <div className="order-item" key={idx}>
              <span>{i.productName} × {i.quantity}</span>
              <span>{inr(i.price * i.quantity)}</span>
            </div>
          ))}
          {o.fullName && (
            <div className="order-ship">
              <strong>Deliver to</strong>
              <span>{o.fullName}, {o.phone}</span>
              <span>{o.addressLine}, {o.city} - {o.pincode}</span>
              <span>Payment: {o.paymentMethod}</span>
            </div>
          )}
          <div className="order-foot">Total {inr(o.total)}</div>
        </div>
      ))}
    </>
  );
}
