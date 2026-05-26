import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Client } = pkg;

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
};

async function init() {
  const client = new Client(config);
  try {
    await client.connect();
    await client.query('DROP DATABASE IF EXISTS sa_lifestyle');
    await client.query('CREATE DATABASE sa_lifestyle');
    console.log('Database created');
    await client.end();
  } catch (err) {
    console.error('Error creating database:', err.message);
    await client.end();
    return;
  }

  const dbClient = new Client({ ...config, database: 'sa_lifestyle' });
  try {
    await dbClient.connect();
    const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    // Skip the CREATE DATABASE line
    const statements = schema.split(';').filter(s => s.trim() && !s.trim().toUpperCase().startsWith('CREATE DATABASE'));
    for (const stmt of statements) {
      await dbClient.query(stmt);
    }
    console.log('Schema created');

    const seed = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');
    const seedStatements = seed.split(';').filter(s => s.trim());
    for (const stmt of seedStatements) {
      await dbClient.query(stmt);
    }
    console.log('Seed data inserted');
    await dbClient.end();
  } catch (err) {
    console.error('Error:', err.message);
    if (dbClient) await dbClient.end();
  }
}

init();
