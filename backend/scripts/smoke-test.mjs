import pkg from 'pg';
import bcrypt from 'bcryptjs';
const { Client } = pkg;

const c = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'admin', database: 'sa_lifestyle' });
await c.connect();

const u = await c.query("SELECT id, name, email, role FROM users");
console.log('USERS:', JSON.stringify(u.rows, null, 2));

const p = await c.query("SELECT id, name, slug FROM products LIMIT 3");
console.log('PRODUCTS (3):', JSON.stringify(p.rows, null, 2));

const cat = await c.query("SELECT id, name, slug FROM categories");
console.log('CATEGORIES:', cat.rows.length, 'rows');

const adminHash = await c.query("SELECT password_hash FROM users WHERE email='admin@salifestyle.com'");
const match = bcrypt.compareSync('admin123', adminHash.rows[0].password_hash);
console.log('bcrypt(admin123) match:', match);

const slugCheck = await c.query("SELECT name, slug FROM products WHERE slug = 'salifestyle-air-force-1-07'");
console.log('Product by slug:', JSON.stringify(slugCheck.rows, null, 2));

await c.end();
