import { useEffect, useState } from 'react';
import { PageHeader } from '../components.jsx';
import api, { errMsg, inr, toast, confirmDialog } from '../api.js';

const empty = { name: '', description: '', price: '', imageUrl: '', stock: '', category: '' };

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.get('/products')
      .then((r) => setProducts(r.data))
      .catch((e) => toast(errMsg(e), 'err'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    window.addEventListener('focus', load); // refresh stock when returning to this tab
    return () => window.removeEventListener('focus', load);
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const reset = () => { setForm(empty); setEditId(null); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = { ...form, price: Number(form.price), stock: Number(form.stock) };
    try {
      if (editId) await api.put(`/products/${editId}`, body);
      else await api.post('/products', body);
      toast(editId ? 'Your changes were saved.' : 'The product is now in the store.', 'ok', editId ? 'Product updated' : 'Product added');
      reset();
      load();
    } catch (err) {
      toast(errMsg(err), 'err');
    }
    setBusy(false);
  };

  const edit = (p) => {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description || '', price: p.price, imageUrl: p.imageUrl || '', stock: p.stock, category: p.category || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (p) => {
    const ok = await confirmDialog({
      title: 'Delete product',
      message: `“${p.name}” will be removed from the store. This cannot be undone.`,
      confirmText: 'Delete product',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast(`${p.name} was deleted.`, 'ok', 'Product deleted');
      load();
    } catch (e) {
      toast(errMsg(e), 'err');
    }
  };

  const low = products.filter((p) => p.stock <= 5).length;
  const stockPill = (s) => <span className={`pill ${s === 0 ? 'out' : s <= 5 ? 'low' : 'ok'}`}>{s}</span>;

  return (
    <>
      <PageHeader pill="Admin" title="Manage products"
        sub={`${products.length} products${low > 0 ? `, ${low} low or out of stock` : ''}`}>
        <button className="btn btn-light" onClick={() => { load(); toast('Stock levels refreshed.', 'info'); }}>Refresh stock</button>
      </PageHeader>

      <form className="panel admin-form" onSubmit={submit}>
        <div className="span2">
          <label htmlFor="f-name">Product name</label>
          <input id="f-name" className="form-control" name="name" value={form.name} onChange={change} required />
        </div>
        <div className="span2">
          <label htmlFor="f-img">Image URL</label>
          <input id="f-img" className="form-control" name="imageUrl" value={form.imageUrl} onChange={change} />
        </div>
        <div>
          <label htmlFor="f-price">Price (₹)</label>
          <input id="f-price" className="form-control" type="number" min="1" name="price" value={form.price} onChange={change} required />
        </div>
        <div>
          <label htmlFor="f-stock">Stock</label>
          <input id="f-stock" className="form-control" type="number" min="0" name="stock" value={form.stock} onChange={change} required />
        </div>
        <div className="span2">
          <label htmlFor="f-cat">Category</label>
          <input id="f-cat" className="form-control" name="category" list="cat-list" placeholder="e.g. Electronics" value={form.category} onChange={change} />
          <datalist id="cat-list">
            {[...new Set(products.map((p) => p.category).filter(Boolean))].map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div className="span4">
          <label htmlFor="f-desc">Description</label>
          <input id="f-desc" className="form-control" name="description" value={form.description} onChange={change} />
        </div>
        <div className="full">
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : editId ? 'Save changes' : 'Add product'}</button>
          {editId && <button type="button" className="btn btn-outline-secondary" onClick={reset}>Cancel</button>}
        </div>
      </form>

      <div className="panel admin-list">
        <div className="admin-row head">
          <span></span><span>Product</span><span>Price</span><span>Stock left</span><span></span>
        </div>
        {loading && <div className="admin-row"><span className="muted">Loading products...</span></div>}
        {!loading && products.length === 0 && <div className="admin-row"><span className="muted">No products yet. Add your first one above.</span></div>}
        {products.map((p) => (
          <div className="admin-row" key={p.id}>
            {p.imageUrl ? <img className="a-thumb" src={p.imageUrl} alt="" /> : <span className="a-thumb" />}
            <span className="a-name" title={p.name}>{p.name}</span>
            <span className="a-price">{inr(p.price)}</span>
            <span className="a-stock" data-label="Stock left">{stockPill(p.stock)}</span>
            <span className="a-actions">
              <button className="btn btn-outline-primary btn-sm" onClick={() => edit(p)}>Edit</button>
              <button className="btn btn-outline-danger btn-sm" onClick={() => remove(p)}>Delete</button>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
