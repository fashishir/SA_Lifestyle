import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pkg;

// Build pool config. Precedence:
//   1. DATABASE_URL  (Railway / Heroku / cloud)
//   2. DB_*  individual vars (local dev)
function buildPoolConfig() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      ssl: url.searchParams.get('sslmode') === 'require' || url.searchParams.get('ssl') === 'true'
        ? { rejectUnauthorized: false }
        : false,
    };
  }
  return {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME     || 'sa_lifestyle',
  };
}

const pool = new Pool({
  ...buildPoolConfig(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

export default pool;
