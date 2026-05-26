import pool from '../config/db.js';

export const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { shipping_address } = req.body;
    const cartResult = await client.query(
      `SELECT ci.*, p.name, p.price FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = $1`,
      [req.user.id]
    );
    if (cartResult.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    const items = cartResult.rows;
    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, shipping_address, total) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, JSON.stringify(shipping_address), total]
    );
    const order = orderResult.rows[0];
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, price) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.product_id, item.name, item.size, item.color, item.quantity, item.price]
      );
    }
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

export const getOrders = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );
    res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT o.*, u.name as user_name, u.email FROM orders o JOIN users u ON o.user_id = u.id';
    const params = [];
    if (status) {
      query += ' WHERE o.status = $1';
      params.push(status);
    }
    query += ' ORDER BY o.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOrderItems = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
