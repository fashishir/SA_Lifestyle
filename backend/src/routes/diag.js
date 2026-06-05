import { Router } from 'express';
import pool from '../config/db.js';
import { DEFAULT_JWT_SECRET } from '../config/secrets.js';

const router = Router();

router.get('/', async (req, res) => {
  const diag = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV || 'development',
    jwt_secret: !!(process.env.JWT_SECRET && process.env.JWT_SECRET !== DEFAULT_JWT_SECRET),
    cors_origin: process.env.CORS_ORIGIN || '(open)',
    database: { connected: false, tables: [], counts: {} },
  };

  try {
    await pool.query('SELECT 1');
    diag.database.connected = true;

    const tbls = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    diag.database.tables = tbls.rows.map((r) => r.table_name);

    const tableNames = ['users', 'products', 'categories', 'orders', 'order_items', 'cart_items'];
    for (const t of tableNames) {
      if (diag.database.tables.includes(t)) {
        try {
          const r = await pool.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
          diag.database.counts[t] = r.rows[0].c;
        } catch (e) {
          diag.database.counts[t] = `error: ${e.message}`;
        }
      } else {
        diag.database.counts[t] = '(table missing)';
      }
    }
  } catch (err) {
    diag.database.connected = false;
    diag.database.error = err.message;
    diag.status = 'degraded';
  }

  res.json(diag);
});

export default router;
