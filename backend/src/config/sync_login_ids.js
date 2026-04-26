/**
 * One-time migration: sync users.login_id to match
 * the linked student's student_id or faculty's employee_id.
 *
 * Run: node src/config/sync_login_ids.js
 */

import pool from '../config/db.js';

async function syncLoginIds() {
  let fixed = 0, skipped = 0, conflicts = 0;

  // ── Faculty ──────────────────────────────────────────────────────────────
  const [facultyRows] = await pool.query(`
    SELECT u.id AS user_id, u.login_id, f.employee_id
    FROM users u
    JOIN faculty f ON f.user_id = u.id
    WHERE u.role = 'faculty'
  `);

  console.log(`\nFound ${facultyRows.length} faculty accounts to check…`);

  for (const row of facultyRows) {
    if (row.login_id === row.employee_id) {
      skipped++;
      continue;
    }

    // Check if the target login_id is already taken by someone else
    const [[conflict]] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? AND id != ?',
      [row.employee_id, row.user_id]
    );
    if (conflict) {
      console.warn(`  ⚠ SKIP faculty user_id=${row.user_id}: employee_id=${row.employee_id} already used by user ${conflict.id}`);
      conflicts++;
      continue;
    }

    await pool.query('UPDATE users SET login_id = ? WHERE id = ?', [row.employee_id, row.user_id]);
    console.log(`  ✓ Faculty user_id=${row.user_id}: ${row.login_id} → ${row.employee_id}`);
    fixed++;
  }

  // ── Students ─────────────────────────────────────────────────────────────
  const [studentRows] = await pool.query(`
    SELECT u.id AS user_id, u.login_id, s.student_id
    FROM users u
    JOIN students s ON s.user_id = u.id
    WHERE u.role = 'student'
  `);

  console.log(`\nFound ${studentRows.length} student accounts to check…`);

  for (const row of studentRows) {
    if (row.login_id === row.student_id) {
      skipped++;
      continue;
    }

    const [[conflict]] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? AND id != ?',
      [row.student_id, row.user_id]
    );
    if (conflict) {
      console.warn(`  ⚠ SKIP student user_id=${row.user_id}: student_id=${row.student_id} already used by user ${conflict.id}`);
      conflicts++;
      continue;
    }

    await pool.query('UPDATE users SET login_id = ? WHERE id = ?', [row.student_id, row.user_id]);
    console.log(`  ✓ Student user_id=${row.user_id}: ${row.login_id} → ${row.student_id}`);
    fixed++;
  }

  console.log(`\nDone. Fixed: ${fixed} | Already correct: ${skipped} | Conflicts skipped: ${conflicts}`);
  process.exit(0);
}

syncLoginIds().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
