import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, productAPI } from '../services/api';
import { formatBDT } from '../utils/format';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    productAPI.getCategories().then((r) => setCategories(r.data)).catch(() => {});
  }, [user]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productAPI.getAll({ limit: 100 });
      setProducts(res.data.products);
    } catch {}
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await adminAPI.getOrders({});
      setOrders(res.data);
    } catch {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    if (tab === 'products') fetchProducts().finally(() => setLoading(false));
    else if (tab === 'orders') fetchOrders().finally(() => setLoading(false));
    else if (tab === 'users') fetchUsers().finally(() => setLoading(false));
  }, [tab, fetchProducts, fetchOrders, fetchUsers]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await adminAPI.deleteProduct(id);
    fetchProducts();
  };

  const handleStatusChange = async (id, status) => {
    await adminAPI.updateOrderStatus(id, status);
    fetchOrders();
  };

  return (
    <div className="page admin-page">
      <div className="container">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Products</button>
          <button className={`admin-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Orders</button>
          <button className={`admin-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Users</button>
        </div>

        {tab === 'products' && (
          <section>
            <div className="admin-toolbar">
              <span>{products.length} products</span>
              <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setShowForm(true); }}>Add Product</button>
            </div>
            {showForm && (
              <ProductForm
                product={editingProduct}
                categories={categories}
                onClose={() => { setShowForm(false); setEditingProduct(null); }}
                onSaved={() => { setShowForm(false); setEditingProduct(null); fetchProducts(); }}
              />
            )}
            {loading ? <div className="spinner" /> : (
              <table className="admin-table">
                <thead>
                  <tr><th>Image</th><th>Name</th><th>Price</th><th>Category</th><th>Gender</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td><img src={p.image_urls?.[0] || ''} alt="" className="admin-thumb" /></td>
                      <td>{p.name}</td>
                      <td>{formatBDT(p.price)}</td>
                      <td>{p.category_name}</td>
                      <td>{p.gender}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => { setEditingProduct(p); setShowForm(true); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {tab === 'orders' && (
          <section>
            {loading ? <div className="spinner" /> : (
              <table className="admin-table">
                <thead>
                  <tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>#{o.id}</td>
                      <td>{o.user_name}<br /><span className="admin-email">{o.email}</span></td>
                      <td>{formatBDT(o.total)}</td>
                      <td><span className={`order-status status-${o.status}`}>{o.status}</span></td>
                      <td>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td>
                        <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)} className="status-select">
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {tab === 'users' && (
          <section>
            {loading ? <div className="spinner" /> : (
              <table className="admin-table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    price: product?.price || '',
    compare_price: product?.compare_price || '',
    category_id: product?.category_id || '',
    sizes: product?.sizes?.join(', ') || '',
    colors: product?.colors?.map((c) => `${c.name}:${c.hex}`).join(', ') || '',
    gender: product?.gender || 'unisex',
    featured: product?.featured || false,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleCheck = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.checked }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('slug', form.slug || form.name.toLowerCase().replace(/\s+/g, '-'));
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('compare_price', form.compare_price || '');
      fd.append('category_id', form.category_id);
      fd.append('sizes', JSON.stringify(form.sizes.split(',').map((s) => s.trim()).filter(Boolean)));
      fd.append('colors', JSON.stringify(form.colors.split(',').map((s) => {
        const [name, hex] = s.trim().split(':');
        return { name: name?.trim() || '', hex: hex?.trim() || '#000000' };
      }).filter((c) => c.name)));
      fd.append('gender', form.gender);
      fd.append('featured', form.featured);

      // We use JSON API instead of FormData for simplicity (no file upload)
      const data = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description,
        price: parseFloat(form.price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        category_id: parseInt(form.category_id),
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map((s) => {
          const [name, hex] = s.trim().split(':');
          return { name: name?.trim() || '', hex: hex?.trim() || '#000000' };
        }).filter((c) => c.name),
        gender: form.gender,
        featured: form.featured,
      };

      if (isEdit) {
        await adminAPI.updateProduct(product.id, data);
      } else {
        await adminAPI.createProduct(data);
      }
      onSaved();
    } catch (err) {
      alert('Failed to save product: ' + (err.response?.data?.message || err.message));
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} required className="form-input" />
            <input name="slug" placeholder="Slug (auto-generated)" value={form.slug} onChange={handleChange} className="form-input" />
          </div>
          <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} className="form-textarea" />
          <div className="form-row">
            <input name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={handleChange} required className="form-input" />
            <input name="compare_price" type="number" step="0.01" placeholder="Compare Price (optional)" value={form.compare_price} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-row">
            <select name="category_id" value={form.category_id} onChange={handleChange} required className="form-input">
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select name="gender" value={form.gender} onChange={handleChange} className="form-input">
              <option value="men">Men</option><option value="women">Women</option>
              <option value="kids">Kids</option><option value="unisex">Unisex</option>
            </select>
          </div>
          <div className="form-row">
            <input name="sizes" placeholder="Sizes (comma-separated: 6,7,8,9)" value={form.sizes} onChange={handleChange} className="form-input" />
            <input name="colors" placeholder="Colors (name:#hex, name:#hex)" value={form.colors} onChange={handleChange} className="form-input" />
          </div>
          <label className="checkbox-label">
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleCheck} />
            Featured Product
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
