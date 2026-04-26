import pool from '../config/db.js';

/**
 * GET /api/search?q=...
 * Role-scoped global search across students, faculty, events, research, subjects, rooms.
 */
export const globalSearch = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2)
      return res.json({ students: [], faculty: [], events: [], research: [], subjects: [], rooms: [] });

    const like = `%${q}%`;
    const { role, id: userId } = req.user;

    // ── Students ────────────────────────────────────────────────────────
    let students = [];
    if (role === 'admin') {
      const [rows] = await pool.query(
        `SELECT id, student_id, first_name, last_name, program, year_level
         FROM students
         WHERE first_name LIKE ? OR last_name LIKE ? OR student_id LIKE ?
            OR program LIKE ? OR section LIKE ? OR email LIKE ?
            OR CONCAT(first_name,' ',last_name) LIKE ?
            OR CONCAT(last_name,' ',first_name) LIKE ?
         LIMIT 20`,
        [like, like, like, like, like, like, like, like]
      );
      students = rows;
    } else if (role === 'faculty') {
      const [rows] = await pool.query(
        `SELECT s.id, s.student_id, s.first_name, s.last_name, s.program, s.year_level
         FROM students s
         INNER JOIN student_faculty sf ON sf.student_id = s.id
         WHERE sf.faculty_id = ?
           AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ?
             OR CONCAT(s.first_name,' ',s.last_name) LIKE ?
             OR CONCAT(s.last_name,' ',s.first_name) LIKE ?)
         LIMIT 20`,
        [userId, like, like, like, like, like]
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
         WHERE first_name LIKE ? OR last_name LIKE ? OR department LIKE ?
            OR employee_id LIKE ? OR specialization LIKE ?
            OR CONCAT(first_name,' ',last_name) LIKE ?
            OR CONCAT(title,' ',first_name,' ',last_name) LIKE ?
         LIMIT 20`,
        [like, like, like, like, like, like, like]
      );
      faculty = rows;
    }

    // ── Events (all roles) ───────────────────────────────────────────────
    const [evRows] = await pool.query(
      `SELECT id, title, type, status, date
       FROM events
       WHERE title LIKE ? OR type LIKE ? OR venue LIKE ?
       LIMIT 10`,
      [like, like, like]
    );

    // ── Research (admin only) ────────────────────────────────────────────
    let research = [];
    if (role === 'admin') {
      const [rows] = await pool.query(
        `SELECT r.id, r.title, r.category, r.year_published,
                GROUP_CONCAT(ra.author_name SEPARATOR ', ') AS authors
         FROM research r
         LEFT JOIN research_authors ra ON ra.research_id = r.id
         WHERE r.title LIKE ? OR r.category LIKE ? OR r.program LIKE ?
         GROUP BY r.id
         LIMIT 10`,
        [like, like, like]
      );
      research = rows;
    }

    // ── Subjects (admin + faculty) ───────────────────────────────────────
    let subjects = [];
    if (role === 'admin' || role === 'faculty') {
      const [rows] = await pool.query(
        `SELECT id, code, title, type, units
         FROM subjects
         WHERE code LIKE ? OR title LIKE ?
         LIMIT 10`,
        [like, like]
      );
      subjects = rows;
    }

    // ── Rooms (admin + faculty) ──────────────────────────────────────────
    let rooms = [];
    if (role === 'admin' || role === 'faculty') {
      const [rows] = await pool.query(
        `SELECT id, room_id, name, type, capacity
         FROM rooms
         WHERE room_id LIKE ? OR name LIKE ? OR building LIKE ?
         LIMIT 10`,
        [like, like, like]
      );
      rooms = rows;
    }

    res.json({ students, faculty, events: evRows, research, subjects, rooms });
  } catch (err) {
    console.error('[search]', err.message);
    res.status(500).json({ message: 'Search failed' });
  }
};
