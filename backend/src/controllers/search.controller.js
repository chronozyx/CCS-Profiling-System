import pool from '../config/db.js';

/**
 * GET /api/search?q=...
 * Role-scoped global search across students, faculty, and events.
 */
export const globalSearch = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2)
      return res.json({ students: [], faculty: [], events: [] });

    const like = `%${q}%`;
    const { role, id: userId } = req.user;

    // ── Students ────────────────────────────────────────────────────────
    let students = [];
    if (role === 'admin') {
      const [rows] = await pool.query(
        `SELECT id, student_id, first_name, last_name, program, year_level
         FROM students
         WHERE first_name LIKE ? OR last_name LIKE ? OR student_id LIKE ? OR program LIKE ?
         LIMIT 6`,
        [like, like, like, like]
      );
      students = rows;
    } else if (role === 'faculty') {
      const [rows] = await pool.query(
        `SELECT s.id, s.student_id, s.first_name, s.last_name, s.program, s.year_level
         FROM students s
         INNER JOIN student_faculty sf ON sf.student_id = s.id
         WHERE sf.faculty_id = ?
           AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ?)
         LIMIT 6`,
        [userId, like, like, like]
      );
      students = rows;
    } else if (role === 'student') {
      const [rows] = await pool.query(
        `SELECT id, student_id, first_name, last_name, program, year_level
         FROM students WHERE user_id = ? LIMIT 1`,
        [userId]
      );
      students = rows;
    }

    // ── Faculty (admin only) ─────────────────────────────────────────────
    let faculty = [];
    if (role === 'admin') {
      const [rows] = await pool.query(
        `SELECT id, employee_id, first_name, last_name, title, department
         FROM faculty
         WHERE first_name LIKE ? OR last_name LIKE ? OR department LIKE ? OR employee_id LIKE ?
         LIMIT 6`,
        [like, like, like, like]
      );
      faculty = rows;
    }

    // ── Events (all roles) ───────────────────────────────────────────────
    const [evRows] = await pool.query(
      `SELECT id, title, type, status, date
       FROM events
       WHERE title LIKE ? OR type LIKE ? OR venue LIKE ?
       LIMIT 6`,
      [like, like, like]
    );

    res.json({ students, faculty, events: evRows });
  } catch (err) {
    console.error('[search]', err.message);
    res.status(500).json({ message: 'Search failed' });
  }
};
