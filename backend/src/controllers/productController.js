import pool from '../config/db.js';

export const getProducts = async (req, res) => {
  try {
    const { category, gender, search, minPrice, maxPrice, size, sort, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = 'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM products p JOIN categories c ON p.category_id = c.id WHERE 1=1';
    const params = [];
    const countParams = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND c.slug = $${paramIndex}`;
      countQuery += ` AND c.slug = $${paramIndex}`;
      params.push(category);
      countParams.push(category);
      paramIndex++;
    }
    if (gender) {
      query += ` AND p.gender = $${paramIndex}`;
      countQuery += ` AND p.gender = $${paramIndex}`;
      params.push(gender);
      countParams.push(gender);
      paramIndex++;
    }
    if (search) {
      query += ` AND (LOWER(p.name) LIKE $${paramIndex} OR LOWER(p.description) LIKE $${paramIndex})`;
      countQuery += ` AND (LOWER(p.name) LIKE $${paramIndex} OR LOWER(p.description) LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase()}%`);
      countParams.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }
    if (minPrice) {
      query += ` AND p.price >= $${paramIndex}`;
      countQuery += ` AND p.price >= $${paramIndex}`;
      params.push(minPrice);
      countParams.push(minPrice);
      paramIndex++;
    }
    if (maxPrice) {
      query += ` AND p.price <= $${paramIndex}`;
      countQuery += ` AND p.price <= $${paramIndex}`;
      params.push(maxPrice);
      countParams.push(maxPrice);
      paramIndex++;
    }
    if (size) {
      query += ` AND $${paramIndex} = ANY(p.sizes)`;
      countQuery += ` AND $${paramIndex} = ANY(p.sizes)`;
      params.push(size);
      countParams.push(size);
      paramIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    if (sort === 'price_asc') query += ' ORDER BY p.price ASC';
    else if (sort === 'price_desc') query += ' ORDER BY p.price DESC';
    else if (sort === 'newest') query += ' ORDER BY p.created_at DESC';
    else query += ' ORDER BY p.created_at DESC';

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    res.json({ products: result.rows, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE p.slug = $1',
      [slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE p.featured = true LIMIT 8'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, slug, description, price, compare_price, category_id, sizes, colors, gender, featured } = req.body;
    const imageUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    const result = await pool.query(
      `INSERT INTO products (name, slug, description, price, compare_price, category_id, image_urls, sizes, colors, gender, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, slug, description, price, compare_price || null, category_id, imageUrls, sizes || [], JSON.parse(colors || '[]'), gender || 'unisex', featured || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price, compare_price, category_id, sizes, colors, gender, featured } = req.body;
    const imageUrls = req.files && req.files.length > 0
      ? req.files.map(f => `/uploads/${f.filename}`)
      : undefined;
    let query = `UPDATE products SET name = $1, slug = $2, description = $3, price = $4, compare_price = $5,
      category_id = $6, sizes = $7, colors = $8, gender = $9, featured = $10, updated_at = NOW()`;
    const params = [name, slug, description, price, compare_price || null, category_id, sizes || [], JSON.parse(colors || '[]'), gender || 'unisex', featured || false];
    let idx = 11;
    if (imageUrls) {
      query += `, image_urls = $${idx}`;
      params.push(imageUrls);
      idx++;
    }
    query += ` WHERE id = $${idx} RETURNING *`;
    params.push(id);
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
