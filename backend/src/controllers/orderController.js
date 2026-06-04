import pool from '../config/db.js';

const ALLOWED_PAYMENT_METHODS = new Set(['cod', 'sslcommerz']);
const ALLOWED_STATUSES = new Set(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);

const TRACKING_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

function maskAddress(addr) {
  if (!addr || typeof addr !== 'object') return null;
  const fullAddress = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
  return {
    city: addr.city || null,
    state: addr.state || null,
    region: fullAddress,
  };
}

export const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { shipping_address, payment_method = 'cod', phone, notes } = req.body;

    const method = ALLOWED_PAYMENT_METHODS.has(payment_method) ? payment_method : 'cod';

    if (method === 'cod' && (!phone || String(phone).trim().length < 7)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Phone number is required for cash on delivery orders.' });
    }

    if (!shipping_address || !shipping_address.fullName || !shipping_address.street || !shipping_address.city) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Shipping address is incomplete.' });
    }

    const cartResult = await client.query(
      `SELECT ci.*, p.name, p.price FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [req.user.id]
    );
    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }
    const items = cartResult.rows;
    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, shipping_address, total, payment_method, payment_status, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, JSON.stringify(shipping_address), total, method, 'unpaid', phone || null, notes || null]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.product_id, item.name, item.size, item.color, item.quantity, item.price]
      );
    }
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    await client.query('COMMIT');

    res.status(201).json({ ...order, items });
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
      `SELECT o.*, o.tracking_id,
              (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) as item_count
       FROM orders o WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
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
    let query = `SELECT o.*, u.name as user_name, u.email
                 FROM orders o JOIN users u ON o.user_id = u.id`;
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
    if (!ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
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

export const trackOrderPublic = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const normalized = String(trackingId || '').trim().toUpperCase();
    if (!/^SA\d{4,12}$/.test(normalized)) {
      return res.status(400).json({ message: 'Invalid tracking ID format.' });
    }
    const orderResult = await pool.query(
      `SELECT id, status, total, payment_method, payment_status, tracking_id, created_at, updated_at, shipping_address
       FROM orders WHERE tracking_id = $1`,
      [normalized]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found. Please check your tracking ID.' });
    }
    const order = orderResult.rows[0];
    const itemsResult = await pool.query(
      `SELECT product_name, size, color, quantity, price
       FROM order_items WHERE order_id = $1`,
      [order.id]
    );

    const response = {
      trackingId: order.tracking_id,
      status: order.status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      total: parseFloat(order.total),
      placedAt: order.created_at,
      lastUpdatedAt: order.updated_at,
      shippingCity: order.shipping_address?.city || null,
      shippingRegion: maskAddress(order.shipping_address),
      items: itemsResult.rows,
      timeline: TRACKING_STEPS.map((s) => ({
        key: s.key,
        label: s.label,
        completed: ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(order.status) >= TRACKING_STEPS.findIndex((t) => t.key === s.key) && order.status !== 'cancelled',
        current: order.status === s.key,
      })),
      cancelled: order.status === 'cancelled',
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
