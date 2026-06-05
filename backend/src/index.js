import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import diagRoutes from './routes/diag.js';
import pool from './config/db.js';
import { DEFAULT_JWT_SECRET } from './config/secrets.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors(corsOrigins.length ? { origin: corsOrigins, credentials: true } : undefined));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/diag', diagRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
let server;

async function checkTables() {
  try {
    const r = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    return r.rows.map((row) => row.table_name);
  } catch {
    return null;
  }
}

async function start() {
  try {
    await pool.query('SELECT NOW()');
  } catch (err) {
    console.error('\n[DB] Database connection failed:', err.message);
    console.error('     Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in backend/.env');
    console.error('     Then run:  cd backend && npm run db:init\n');
    process.exit(1);
  }

  const tables = await checkTables();
  if (tables === null) {
    console.error('[DB] Could not read information_schema.');
  } else if (tables.length === 0) {
    console.warn('[DB] Connected, but the database is EMPTY (no tables).');
    console.warn('     Run:  cd backend && npm run db:init');
    console.warn('     API requests will return 500 errors until schema is applied.\n');
  } else {
    const required = ['users', 'products', 'categories', 'orders', 'order_items', 'cart_items'];
    const missing = required.filter((t) => !tables.includes(t));
    if (missing.length > 0) {
      console.warn(`[DB] Connected, but tables missing: ${missing.join(', ')}`);
      console.warn('     Run:  cd backend && npm run db:init\n');
    } else {
      console.log(`[DB] Connected. Tables: ${tables.join(', ')}`);
    }
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_SECRET) {
    console.warn('[AUTH] JWT_SECRET is missing or still the default. Set a strong value in backend/.env');
  }

  server = app.listen(PORT, () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
}

start();

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      pool.end(() => {
        console.log('Database pool closed.');
        process.exit(0);
      });
    });
  } else {
    pool.end(() => {
      process.exit(0);
    });
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGUSR2', () => {
  // Nodemon restart signal
  gracefulShutdown();
});

