import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import './AdminDashboard.css';

const genders = ['men', 'women', 'kids', 'unisex'];

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getCategories();
      setCategories(res.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await adminAPI.deleteCategory(id);
      fetchCategories();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-page-header">
        <h1>Categories</h1>
        <button className="btn btn-primary" onClick={() => { setEditingCategory(null); setShowForm(true); }}>
          + Add Category
        </button>
      </div>

      {showForm && (
        <CategoryForm
          category={editingCategory}
          onClose={() => { setShowForm(false); setEditingCategory(null); }}
          onSaved={() => { setShowForm(false); setEditingCategory(null); fetchCategories(); }}
        />
      )}

      {loading ? <div className="spinner" /> : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Gender</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    {c.image_url ? <img src={c.image_url} alt="" className="admin-thumb" /> : '—'}
                  </td>
                  <td className="td-name">{c.name}</td>
                  <td className="td-sub">{c.slug}</td>
                  <td><span className="badge badge-gender">{c.gender || '—'}</span></td>
                  <td>{c.product_count || 0}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditingCategory(c); setShowForm(true); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.name)}>Delete</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && <tr><td colSpan={7} className="empty-state">No categories found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CategoryForm({ category, onClose, onSaved }) {
  const isEdit = !!category;
  const [form, setForm] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    image_url: category?.image_url || '',
    gender: category?.gender || 'unisex',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        image_url: form.image_url || null,
        gender: form.gender,
      };

      if (isEdit) {
        await adminAPI.updateCategory(category.id, data);
      } else {
        await adminAPI.createCategory(data);
      }
      onSaved();
    } catch (err) {
      alert('Failed to save category: ' + (err.response?.data?.message || err.message));
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit Category' : 'Add Category'}</h2>
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <input name="name" placeholder="Category Name" value={form.name} onChange={handleChange} required className="form-input" />
            <input name="slug" placeholder="Slug (auto-generated)" value={form.slug} onChange={handleChange} className="form-input" />
          </div>
          <input name="image_url" placeholder="Image URL (optional)" value={form.image_url} onChange={handleChange} className="form-input" />
          <select name="gender" value={form.gender} onChange={handleChange} className="form-input">
            {genders.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
