import pool from '../config/db.js';

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT c.*, COUNT(p.id)::int as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id ORDER BY c.name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug, image_url, gender } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, slug, image_url, gender) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug || name.toLowerCase().replace(/\s+/g, '-'), image_url || null, gender || 'unisex']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Category slug already exists' });
    res.status(500).json({ message: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, image_url, gender } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name = COALESCE($1, name), slug = COALESCE($2, slug), image_url = COALESCE($3, image_url), gender = COALESCE($4, gender) WHERE id = $5 RETURNING *',
      [name, slug, image_url, gender, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Category slug already exists' });
    res.status(500).json({ message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await pool.query('SELECT COUNT(*)::int FROM products WHERE category_id = $1', [id]);
    if (check.rows[0].count > 0) {
      return res.status(400).json({ message: `Cannot delete: ${check.rows[0].count} product(s) use this category` });
    }
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
