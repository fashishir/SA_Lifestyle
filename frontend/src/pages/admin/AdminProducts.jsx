import { useState, useEffect, useCallback } from 'react';
import { adminAPI, productAPI } from '../../services/api';
import { formatBDT } from '../../utils/format';
import './AdminDashboard.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    productAPI.getCategories().then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productAPI.getAll({ limit: 100 });
      setProducts(res.data.products);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await adminAPI.deleteProduct(id);
    fetchProducts();
  };

  return (
    <div className="admin-section">
      <div className="admin-page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
          + Add Product
        </button>
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
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Gender</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><img src={p.image_urls?.[0] || ''} alt="" className="admin-thumb" /></td>
                  <td className="td-name">{p.name}</td>
                  <td>{formatBDT(p.price)}</td>
                  <td>{p.category_name}</td>
                  <td><span className="badge badge-gender">{p.gender}</span></td>
                  <td>{p.featured ? <span className="badge badge-featured">Yes</span> : '—'}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditingProduct(p); setShowForm(true); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={7} className="empty-state">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
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
            <input name="price" type="number" step="0.01" placeholder="Price (৳)" value={form.price} onChange={handleChange} required className="form-input" />
            <input name="compare_price" type="number" step="0.01" placeholder="Compare Price (৳)" value={form.compare_price} onChange={handleChange} className="form-input" />
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
            <input name="sizes" placeholder="Sizes (comma: 6,7,8,9)" value={form.sizes} onChange={handleChange} className="form-input" />
            <input name="colors" placeholder="Colors (name:#hex, name:#hex)" value={form.colors} onChange={handleChange} className="form-input" />
          </div>
          <label className="checkbox-label">
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleCheck} />
            Featured Product
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
