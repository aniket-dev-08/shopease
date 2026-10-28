import { useState } from 'react';
import { Icon } from '../icons.jsx';
import api, { errMsg, toast } from '../api.js';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(isRegister ? '/auth/register' : '/auth/login', form);
      onLogin(data);
    } catch (err) {
      toast(errMsg(err), 'err', isRegister ? 'Sign up failed' : 'Login failed');
    }
    setBusy(false);
  };

  return (
    <div className="panel auth">
      <div className="auth-side">
        <h2>Shop smarter with <span className="accent">ShopEase.</span></h2>
        <ul>
          <li><Icon name="cart" size={18} /> Save your cart and check out in one step</li>
          <li><Icon name="truck" size={18} /> See all your past orders in one place</li>
          <li><Icon name="refresh" size={18} /> Live stock levels on every product</li>
        </ul>
      </div>
      <div className="auth-form">
        <h3 className="mb-1">{isRegister ? 'Create your account' : 'Welcome back'}</h3>
        <p className="muted mb-3">{isRegister ? 'It takes less than a minute.' : 'Log in to continue.'}</p>
        <form onSubmit={submit}>
          {isRegister && (
            <input className="form-control mb-2" name="name" placeholder="Full name" value={form.name} onChange={change} required />
          )}
          <input className="form-control mb-2" type="email" name="email" placeholder="Email address" value={form.email} onChange={change} required />
          <input className="form-control mb-3" type="password" name="password" placeholder="Password (6+ characters)" value={form.password} onChange={change} required />
          <button className="btn btn-primary btn-lg w-100" disabled={busy}>
            {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>
        <button className="btn btn-link mt-2 p-0 text-start" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Log in' : 'New to ShopEase? Create an account'}
        </button>
      </div>
    </div>
  );
}
