import { useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Products from './pages/Products.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Orders from './pages/Orders.jsx';
import Admin from './pages/Admin.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Checkout from './pages/Checkout.jsx';
import { cartCount } from './api.js';
import { Icon } from './icons.jsx';

const ICON = { ok: '✓', err: '✕', warn: '!', info: 'i' };
const TITLE = { ok: 'Success', err: 'Something went wrong', warn: 'Heads up', info: 'Note' };

export default function App() {
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem('token'),
    name: localStorage.getItem('name'),
    role: localStorage.getItem('role'),
  }));
  const [count, setCount] = useState(cartCount());
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setMenu(false); window.scrollTo(0, 0); }, [location.pathname]);

  useEffect(() => {
    const onCart = () => setCount(cartCount());
    const onToast = (e) => {
      const type = ICON[e.detail.type] ? e.detail.type : 'info';
      const ms = type === 'err' || type === 'warn' ? 6000 : 3800;
      const t = { id: Date.now() + Math.random(), ...e.detail, type, ms };
      setToasts((l) => [...l.slice(-3), t]);
      setTimeout(() => setToasts((l) => l.filter((x) => x.id !== t.id)), ms);
    };
    const onConfirm = (e) => setDialog(e.detail);
    window.addEventListener('cart', onCart);
    window.addEventListener('toast', onToast);
    window.addEventListener('confirm', onConfirm);
    return () => {
      window.removeEventListener('cart', onCart);
      window.removeEventListener('toast', onToast);
      window.removeEventListener('confirm', onConfirm);
    };
  }, []);

  const closeToast = (id) => setToasts((l) => l.filter((x) => x.id !== id));
  const closeDialog = (result) => { dialog?.resolve(result); setDialog(null); };

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => e.key === 'Escape' && closeDialog(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('name', data.name);
    localStorage.setItem('role', data.role);
    setAuth(data);
    navigate('/');
  };

  const logout = () => {
    ['token', 'name', 'role', 'cart'].forEach((k) => localStorage.removeItem(k));
    setAuth({ token: null, name: null, role: null });
    setCount(0);
    navigate('/login');
  };

  const isAdmin = auth.role === 'ROLE_ADMIN';

  const authButtons = auth.token ? (
    <>
      <span className="hello"><Icon name="user" size={18} /> Hi, {auth.name}</span>
      <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Log out</button>
    </>
  ) : (
    <Link className="btn btn-primary btn-sm" to="/login">Log in</Link>
  );

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link to="/" className="brand"><span className="brand-mark">S</span>ShopEase</Link>
          <nav className={`navlinks ${menu ? 'open' : ''}`}>
            <NavLink to="/" end>Shop</NavLink>
            {auth.token && <NavLink to="/orders">My orders</NavLink>}
            {isAdmin && <NavLink to="/admin">Manage products</NavLink>}
            <div className="menu-auth">{authButtons}</div>
          </nav>
          <div className="nav-right">
            <Link to="/cart" className="cart-link" aria-label={`Cart, ${count} items`}>
              <Icon name="cart" size={22} />
              {count > 0 && <span key={count} className="cart-badge">{count}</span>}
            </Link>
            <div className="nav-right auth-desktop">{authButtons}</div>
          </div>
          <button className="menu-btn" aria-label="Toggle menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
            {menu ? '✕' : '☰'}
          </button>
        </div>
      </header>

      <main className="page">
        <div className="page-fade" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={auth.token ? <Checkout /> : <Navigate to="/login" />} />
            <Route path="/cart" element={<Cart loggedIn={!!auth.token} />} />
            <Route path="/login" element={<Login onLogin={login} />} />
            <Route path="/orders" element={auth.token ? <Orders /> : <Navigate to="/login" />} />
            <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-in">
          <div>
            <Link to="/" className="brand"><span className="brand-mark">S</span>ShopEase</Link>
            <p className="muted mb-0 mt-2">Everyday gear, delivered.</p>
          </div>
          <nav className="footer-links">
            <Link to="/">Shop</Link>
            <Link to="/cart">Cart</Link>
            {auth.token && <Link to="/orders">My orders</Link>}
          </nav>
        </div>
        <div className="footer-copy">© 2026 ShopEase. Built with Spring Boot and React. Developed By Aniket Atole</div>
      </footer>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.type}`} role={t.type === 'err' ? 'alert' : 'status'}>
            <span className="t-icon" aria-hidden="true">{ICON[t.type]}</span>
            <div className="t-body">
              <strong>{t.title || TITLE[t.type]}</strong>
              <span>{t.text}</span>
            </div>
            <button className="t-close" aria-label="Dismiss" onClick={() => closeToast(t.id)}>✕</button>
            <i className="t-bar" style={{ animationDuration: `${t.ms}ms` }} />
          </div>
        ))}
      </div>

      {dialog && (
        <div className="modal-back" onMouseDown={() => closeDialog(false)}>
          <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" onMouseDown={(e) => e.stopPropagation()}>
            <h3 id="dlg-title">{dialog.title}</h3>
            <p className="muted">{dialog.message}</p>
            <div className="dialog-actions">
              <button className="btn btn-outline-secondary" autoFocus onClick={() => closeDialog(false)}>Cancel</button>
              <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => closeDialog(true)}>
                {dialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
