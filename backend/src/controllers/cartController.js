import pool from '../config/db.js';

export const getCart = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.*, p.name, p.price, p.image_urls, p.sizes, p.colors, p.slug
       FROM cart_items ci JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1 ORDER BY ci.id`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { product_id, size, color, quantity = 1 } = req.body;
    const existing = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4',
      [req.user.id, product_id, size, color || null]
    );
    if (existing.rows.length > 0) {
      const result = await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
        [quantity, existing.rows[0].id]
      );
      return res.json(result.rows[0]);
    }
    const result = await pool.query(
      'INSERT INTO cart_items (user_id, product_id, size, color, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, product_id, size, color || null, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    if (quantity < 1) {
      await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [id, req.user.id]);
      return res.json({ message: 'Item removed' });
    }
    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
