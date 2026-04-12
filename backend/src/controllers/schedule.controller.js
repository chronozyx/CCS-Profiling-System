import pool from '../config/db.js';
import { parseId, requireString, requireEnum, sanitizeBody } from '../middlewares/sanitize.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_RE = /^\d{2}:\d{2}$/;

const requireTime = (val, field) => {
  const s = String(val || '').trim();
  if (!TIME_RE.test(s)) {
    const err = new Error(`${field} must be in HH:MM format`);
    err.status = 400;
    throw err;
  }
  return s;
};

export const getSchedules = async (req, res) => {
  try {
    // Faculty: only see their own schedules
    const { role, id: userId } = req.user;
    let facultyFilter = '';
    const params = [];

    if (role === 'faculty') {
      const [[fac]] = await pool.query('SELECT id FROM faculty WHERE user_id = ?', [userId]);
      if (!fac) return res.status(403).json({ message: 'Forbidden: faculty profile not found' });
      facultyFilter = 'WHERE s.faculty_id = ?';
      params.push(fac.id);
    } else if (role === 'student') {
      // Students see only schedules they are enrolled in
      const [[stu]] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userId]);
      if (!stu) return res.status(403).json({ message: 'Forbidden: student profile not found' });
      facultyFilter = 'WHERE s.id IN (SELECT schedule_id FROM enrollments WHERE student_id = ?)';
      params.push(stu.id);
    }

    const [rows] = await pool.query(`
      SELECT s.id, s.section, s.day, s.start_time, s.end_time,
        sub.code AS subject_code, sub.title AS subject_title, sub.type AS subject_type,
        sub.hours, sub.units,
        f.first_name AS faculty_first, f.last_name AS faculty_last,
        r.room_id AS room_code, r.name AS room_name, r.type AS room_type, r.capacity,
        (SELECT COUNT(*) FROM enrollments e WHERE e.schedule_id = s.id) AS enrolled
      FROM schedules s
      JOIN subjects sub ON s.subject_id = sub.id
      JOIN faculty  f   ON s.faculty_id  = f.id
      JOIN rooms    r   ON s.room_id     = r.id
      ${facultyFilter}
      ORDER BY s.day, s.start_time
    `, params);
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch schedules' });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const b          = sanitizeBody(req.body);
    const subject_id = parseId(b.subject_id);
    const faculty_id = parseId(b.faculty_id);
    const room_id    = parseId(b.room_id);
    const section    = requireString(b.section,    'Section', 10);
    const day        = requireEnum(b.day,          'Day',     DAYS);
    const start_time = requireTime(b.start_time,   'Start time');
    const end_time   = requireTime(b.end_time,     'End time');

    if (start_time >= end_time)
      return res.status(400).json({ message: 'Start time must be before end time' });

    // Verify referenced IDs actually exist — prevents ID guessing / orphan records
    const [[subj]] = await pool.query('SELECT id FROM subjects WHERE id = ?', [subject_id]);
    if (!subj) return res.status(400).json({ message: 'Subject not found' });

    const [[fac]] = await pool.query('SELECT id FROM faculty WHERE id = ?', [faculty_id]);
    if (!fac) return res.status(400).json({ message: 'Faculty not found' });

    const [[room]] = await pool.query('SELECT id FROM rooms WHERE id = ?', [room_id]);
    if (!room) return res.status(400).json({ message: 'Room not found' });

    const [result] = await pool.query(
      'INSERT INTO schedules (subject_id,faculty_id,room_id,section,day,start_time,end_time) VALUES (?,?,?,?,?,?,?)',
      [subject_id, faculty_id, room_id, section, day, start_time, end_time]
    );
    res.status(201).json({ id: result.insertId, subject_id, faculty_id, room_id, section, day, start_time, end_time });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to create schedule' });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [result] = await pool.query('DELETE FROM schedules WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to delete schedule' });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const id         = parseId(req.params.id);
    const b          = sanitizeBody(req.body);
    const subject_id = parseId(b.subject_id);
    const faculty_id = parseId(b.faculty_id);
    const room_id    = parseId(b.room_id);
    const section    = requireString(b.section,  'Section', 10);
    const day        = requireEnum(b.day,         'Day',     DAYS);
    const start_time = requireTime(b.start_time,  'Start time');
    const end_time   = requireTime(b.end_time,    'End time');

    if (start_time >= end_time)
      return res.status(400).json({ message: 'Start time must be before end time' });

    const [result] = await pool.query(
      'UPDATE schedules SET subject_id=?,faculty_id=?,room_id=?,section=?,day=?,start_time=?,end_time=? WHERE id=?',
      [subject_id, faculty_id, room_id, section, day, start_time, end_time, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ id, subject_id, faculty_id, room_id, section, day, start_time, end_time });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to update schedule' });
  }
};
