import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.resolve(REPO_ROOT, 'backend/.env') });

const { Client } = pkg;

function parseDbConfig() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
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

const STATEMENTS = [
  // payment_method
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'orders' AND column_name = 'payment_method'
     ) THEN
       ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) DEFAULT 'cod'
         CHECK (payment_method IN ('cod', 'sslcommerz'));
     END IF;
   END $$`,

  // payment_status
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'orders' AND column_name = 'payment_status'
     ) THEN
       ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid'
         CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'failed'));
     END IF;
   END $$`,

  // tracking_id
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'orders' AND column_name = 'tracking_id'
     ) THEN
       ALTER TABLE orders ADD COLUMN tracking_id VARCHAR(32) UNIQUE;
     END IF;
   END $$`,

  // phone
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'orders' AND column_name = 'phone'
     ) THEN
       ALTER TABLE orders ADD COLUMN phone VARCHAR(32);
     END IF;
   END $$`,

  // notes
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'orders' AND column_name = 'notes'
     ) THEN
       ALTER TABLE orders ADD COLUMN notes TEXT;
     END IF;
   END $$`,

  // updated_at
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'orders' AND column_name = 'updated_at'
     ) THEN
       ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
     END IF;
   END $$`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON orders(tracking_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,

  // Trigger function + trigger (idempotent)
  `CREATE OR REPLACE FUNCTION generate_tracking_id() RETURNS TRIGGER AS $fn$
   BEGIN
     IF NEW.tracking_id IS NULL OR NEW.tracking_id = '' THEN
       NEW.tracking_id := 'SA' || lpad(NEW.id::text, 6, '0');
     END IF;
     RETURN NEW;
   END;
   $fn$ LANGUAGE plpgsql`,

  `DROP TRIGGER IF EXISTS trg_orders_tracking_id ON orders`,
  `CREATE TRIGGER trg_orders_tracking_id
     BEFORE INSERT ON orders
     FOR EACH ROW
     EXECUTE FUNCTION generate_tracking_id()`,

  // Backfill: any pre-existing orders get a tracking_id
  `UPDATE orders
     SET tracking_id = 'SA' || lpad(id::text, 6, '0')
   WHERE tracking_id IS NULL OR tracking_id = ''`,
];

async function main() {
  const cfg = parseDbConfig();
  const client = new Client(cfg);
  await client.connect();
  try {
    console.log(`Connecting to ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database} ...`);
    for (let i = 0; i < STATEMENTS.length; i++) {
      const label = `step ${i + 1}/${STATEMENTS.length}`;
      try {
        await client.query(STATEMENTS[i]);
        console.log(`  ✓ ${label}`);
      } catch (err) {
        console.error(`  ✗ ${label}: ${err.message}`);
        throw err;
      }
    }
    const { rows } = await client.query(
      `SELECT COUNT(*)::int AS n FROM orders WHERE tracking_id IS NOT NULL`
    );
    console.log(`\n✓ Migration complete. ${rows[0].n} orders have tracking IDs.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
