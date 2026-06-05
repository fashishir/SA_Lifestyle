import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
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

async function ensureDatabase() {
  const cfg = parseDbConfig();
  const adminClient = new Client({ ...cfg, database: 'postgres' });
  await adminClient.connect();
  const { rows } = await adminClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [cfg.database]
  );
  if (rows.length === 0) {
    console.log(`Creating database "${cfg.database}"...`);
    await adminClient.query(`CREATE DATABASE "${cfg.database}"`);
  } else {
    console.log(`Database "${cfg.database}" already exists.`);
  }
  await adminClient.end();
  return cfg;
}

function splitSql(sql) {
  const cleaned = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  const statements = [];
  let current = '';
  let inDollarQuote = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (!inDollarQuote && ch === '$' && next === '$') {
      inDollarQuote = true;
      current += '$$';
      i++;
      continue;
    }
    if (inDollarQuote && ch === '$' && next === '$') {
      inDollarQuote = false;
      current += '$$';
      i++;
      continue;
    }
    if (!inDollarQuote && ch === ';') {
      const stmt = current.trim();
      if (stmt.length > 0) statements.push(stmt);
      current = '';
      continue;
    }
    current += ch;
  }

  const tail = current.trim();
  if (tail.length > 0) statements.push(tail);

  return statements;
}

async function applyFile(client, filePath, label) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const allStatements = splitSql(sql);
  const statements = allStatements.filter(
    (s) => !s.trim().toUpperCase().startsWith('CREATE DATABASE')
  );
  console.log(`Applying ${label} (${statements.length} statements)...`);
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await client.query(stmt);
    } catch (err) {
      console.error(`  ✗ Failed at statement #${i + 1} in ${label}:`);
      console.error(`    ${stmt.slice(0, 120)}${stmt.length > 120 ? '…' : ''}`);
      console.error(`    → ${err.message}`);
      throw err;
    }
  }
  console.log(`  ✓ ${label} applied.`);
}

async function main() {
  const cfg = await ensureDatabase();
  const client = new Client(cfg);
  await client.connect();
  try {
    const schemaPath = path.join(REPO_ROOT, 'database', 'schema.sql');
    const seedPath   = path.join(REPO_ROOT, 'database', 'seed.sql');

    const args = new Set(process.argv.slice(2));
    if (args.has('--reset')) {
      console.log('Dropping all tables in public schema...');
      await client.query(`
        DO $$ DECLARE r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS public."' || r.tablename || '" CASCADE';
          END LOOP;
        END $$;
      `);
    }

    await applyFile(client, schemaPath, 'schema.sql');

    if (args.has('--with-seed') || !args.has('--schema-only')) {
      try {
        await applyFile(client, seedPath, 'seed.sql');
      } catch (err) {
        if (err.message.includes('duplicate key')) {
          console.log('  ! Seed data already loaded (skipped).');
        } else {
          throw err;
        }
      }
    }

    console.log('\n✓ Database ready.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('init-db failed:', err.message);
  process.exit(1);
});
