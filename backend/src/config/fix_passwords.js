/**
 * fix_passwords.js
 * Re-hashes every student/faculty user whose stored password doesn't match
 * their plain_password (login_id). Run once after bulk_seed.
 *
 * Run: node src/config/fix_passwords.js
 */
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

async function fixPasswords() {
  const [rows] = await pool.query(
    `SELECT id, login_id, plain_password FROM users
     WHERE role IN ('student','faculty') AND plain_password IS NOT NULL`
  );

  console.log(`Found ${rows.length} student/faculty accounts to fix...`);
  let fixed = 0, skipped = 0;

  for (const row of rows) {
    const pw = row.plain_password || row.login_id;
    if (!pw) { skipped++; continue; }

    // Check if current hash already matches
    const match = await bcrypt.compare(pw, row.password || '');
    if (match) { skipped++; continue; }

    const hashed = await bcrypt.hash(pw, 8);
    await pool.query('UPDATE users SET password=? WHERE id=?', [hashed, row.id]);
    fixed++;
    if (fixed % 100 === 0) process.stdout.write(`  Fixed ${fixed}...\r`);
  }

  console.log(`\nDone. Fixed: ${fixed} | Already correct: ${skipped}`);
  process.exit(0);
}

fixPasswords().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
