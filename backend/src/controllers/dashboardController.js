import pool from '../config/db.js';

const TIMEFRAME_DAYS = { week: 7, month: 30, year: 365 };

export const getDashboard = async (req, res) => {
  try {
    const [
      productCount, orderCount, userCount, revenue,
      recentOrders, topProducts, statusCounts,
      pendingOrders, confirmedOrders, shippedOrders, deliveredOrders, cancelledOrders,
      avgOrderValue,
      prevRevenue, prevOrderCount,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM products'),
      pool.query('SELECT COUNT(*)::int AS count FROM orders'),
      pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer'"),
      pool.query("SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status != 'cancelled'"),
      pool.query(
        `SELECT o.*, u.name AS user_name
         FROM orders o JOIN users u ON o.user_id = u.id
         ORDER BY o.created_at DESC LIMIT 10`
      ),
      pool.query(
        `SELECT oi.product_name, SUM(oi.quantity)::int AS sold,
                (p.image_urls)[1] AS image_url
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         GROUP BY oi.product_name, p.image_urls
         ORDER BY sold DESC LIMIT 5`
      ),
      pool.query(`SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`),
      pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'confirmed'"),
      pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'shipped'"),
      pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'delivered'"),
      pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'cancelled'"),
      pool.query("SELECT COALESCE(AVG(total), 0) AS avg FROM orders WHERE status != 'cancelled'"),
      pool.query(
        `SELECT COALESCE(SUM(total), 0) AS total
         FROM orders
         WHERE status != 'cancelled'
           AND created_at < NOW() - INTERVAL '7 days'`
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM orders
         WHERE created_at < NOW() - INTERVAL '7 days'`
      ),
    ]);

    const formatNumber = (row, key = 'coalesce') => parseFloat(row[key] || 0);

    res.json({
      totalProducts: productCount.rows[0].count,
      totalOrders: orderCount.rows[0].count,
      totalUsers: userCount.rows[0].count,
      totalRevenue: formatNumber(revenue.rows[0]),
      previousTotalRevenue: formatNumber(prevRevenue.rows[0]),
      previousTotalOrders: prevOrderCount.rows[0].count,
      previousTotalProducts: productCount.rows[0].count,
      previousTotalUsers: userCount.rows[0].count,
      recentOrders: recentOrders.rows,
      topProducts: topProducts.rows,
      pendingOrders: pendingOrders.rows[0].count,
      confirmedOrders: confirmedOrders.rows[0].count,
      shippedOrders: shippedOrders.rows[0].count,
      deliveredOrders: deliveredOrders.rows[0].count,
      cancelledOrders: cancelledOrders.rows[0].count,
      avgOrderValue: formatNumber(avgOrderValue.rows[0]),
      avgRating: 4.5,
      statusCounts: statusCounts.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: err.message });
  }
};

export { TIMEFRAME_DAYS };
