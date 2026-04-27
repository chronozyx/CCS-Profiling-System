/**
 * One-time fix: add schedules for subjects that have materials but no schedule.
 * Run: node src/config/fix_missing_schedules.js
 *
 * Subjects fixed:
 *   CS301 — Software Engineering    → Prof. Jose Reyes
 *   CS401 — Database Management Systems → Dr. Rosa Garcia
 *   CS402 — Database Management Lab → Dr. Rosa Garcia
 */
import pool from './db.js';

async function fix() {
  const conn = await pool.getConnection();
  try {
    // Resolve faculty IDs
    const [[f2]] = await conn.query(`SELECT id FROM faculty WHERE employee_id = '1000002'`); // Prof. Jose Reyes
    const [[f5]] = await conn.query(`SELECT id FROM faculty WHERE employee_id = '1000005'`); // Dr. Rosa Garcia

    if (!f2 || !f5) {
      console.error('❌ Faculty 1000002 or 1000005 not found. Run seed first.');
      process.exit(1);
    }

    // Resolve subject IDs
    const [[cs301]] = await conn.query(`SELECT id FROM subjects WHERE code = 'CS301'`);
    const [[cs401]] = await conn.query(`SELECT id FROM subjects WHERE code = 'CS401'`);
    const [[cs402]] = await conn.query(`SELECT id FROM subjects WHERE code = 'CS402'`);

    if (!cs301 || !cs401) {
      console.error('❌ Subjects CS301/CS401 not found. Run seed first.');
      process.exit(1);
    }

    // Use any available lecture room
    const [[room]] = await conn.query(`SELECT id FROM rooms WHERE type = 'LECTURE_ROOM' LIMIT 1`);
    const [[lab]]  = await conn.query(`SELECT id FROM rooms WHERE type = 'LABORATORY_ROOM' LIMIT 1`);

    const toInsert = [
      // CS301 Software Engineering — Prof. Jose Reyes
      [cs301.id, f2.id, room.id, 'BSCS-3B', 'Thursday',  '09:00', '12:00'],
      // CS401 Database Management Systems — Dr. Rosa Garcia
      [cs401.id, f5.id, room.id, 'BSIT-4C', 'Monday',    '13:00', '15:00'],
    ];

    if (cs402) {
      // CS402 Database Management Lab — Dr. Rosa Garcia
      toInsert.push([cs402.id, f5.id, lab.id, 'BSIT-4C', 'Wednesday', '13:00', '16:00']);
    }

    let added = 0;
    for (const row of toInsert) {
      const [result] = await conn.query(
        `INSERT IGNORE INTO schedules (subject_id,faculty_id,room_id,section,day,start_time,end_time)
         VALUES (?,?,?,?,?,?,?)`, row
      );
      if (result.affectedRows) {
        added++;
        console.log(`✅ Added schedule: subject_id=${row[0]}, faculty_id=${row[1]}, section=${row[3]}, ${row[4]} ${row[5]}–${row[6]}`);
      } else {
        console.log(`⚠  Already exists: subject_id=${row[0]}, section=${row[3]}`);
      }
    }

    console.log(`\nDone. ${added} schedule(s) added.`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

fix();
