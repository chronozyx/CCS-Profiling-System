/**
 * Run once to create the default admin account:
 *   node src/config/admin_seed.js
 */
import pool from './db.js';
import bcrypt from 'bcryptjs';

const admins = [
  { name: 'System Admin', email: 'admin@ccs.edu', password: 'admin123' },
];

async function seed() {
  for (const a of admins) {
    const [ex] = await pool.query('SELECT id FROM users WHERE email = ?', [a.email]);
    if (ex.length) { console.log(`⚠  ${a.email} already exists`); continue; }
    const hashed = await bcrypt.hash(a.password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [a.name, a.email, hashed, 'admin']
    );
    console.log(`✅ Admin created: ${a.email} / ${a.password}`);
  }
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
