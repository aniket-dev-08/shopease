import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (e) => {
  if (!e.response) return 'Cannot reach the server. Make sure the backend is running on port 8080.';
  const msg = e.response.data?.message;
  if (msg) return msg;
  const status = e.response.status;
  const what = `${(e.config?.method || '').toUpperCase()} ${e.config?.url || ''}`.trim();
  if (status === 401 || status === 403) return 'Your session has expired or is not valid. Please log out and log in again.';
  if (status === 404) return `The server has no route for ${what} (404). Restart the backend after a clean build.`;
  if (status >= 500) return `The server had a problem with ${what} (${status}). Check the backend terminal for the error.`;
  return `Request failed: ${what} (${status}).`;
};

export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

// Cart (localStorage) and a window event so the navbar badge stays in sync
export const getCart = () => JSON.parse(localStorage.getItem('cart') || '[]');
export const cartCount = () => getCart().reduce((s, c) => s + c.quantity, 0);
export const saveCart = (cart) => {
  localStorage.setItem('cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cart'));
};

// Toast: type is 'ok' | 'err' | 'warn' | 'info'
export const toast = (text, type = 'ok', title) =>
  window.dispatchEvent(new CustomEvent('toast', { detail: { text, type, title } }));

// Confirmation popup: await confirmDialog({ title, message, confirmText, danger }) -> true / false
export const confirmDialog = (opts) =>
  new Promise((resolve) => window.dispatchEvent(new CustomEvent('confirm', { detail: { ...opts, resolve } })));

export default api;
