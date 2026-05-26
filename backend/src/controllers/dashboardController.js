import pool from '../config/db.js';

export const getDashboard = async (req, res) => {
  try {
    const [productCount, orderCount, userCount, revenue, recentOrders, topProducts] =
      await Promise.all([
        pool.query('SELECT COUNT(*)::int FROM products'),
        pool.query('SELECT COUNT(*)::int FROM orders'),
        pool.query("SELECT COUNT(*)::int FROM users WHERE role = 'customer'"),
        pool.query("SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled'"),
        pool.query(
          'SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5'
        ),
        pool.query(
          `SELECT oi.product_name, SUM(oi.quantity)::int as sold,
                  (p.image_urls)[1] as image_url
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           GROUP BY oi.product_name, p.image_urls
           ORDER BY sold DESC LIMIT 5`
        ),
      ]);

    res.json({
      totalProducts: productCount.rows[0].count,
      totalOrders: orderCount.rows[0].count,
      totalUsers: userCount.rows[0].count,
      totalRevenue: parseFloat(revenue.rows[0].coalesce),
      recentOrders: recentOrders.rows,
      topProducts: topProducts.rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
