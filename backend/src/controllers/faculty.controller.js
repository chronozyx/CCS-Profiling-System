import pool from '../config/db.js';
import { parseId, requireString, requireEmail, requireEnum, requireInt, sanitizeBody } from '../middlewares/sanitize.js';

const EMPLOYMENT_STATUSES = ['Full-time', 'Part-time'];
const TITLES = ['Prof.', 'Dr.', 'Mr.', 'Ms.', 'Engr.'];

export const getFaculty = async (_req, res) => {
  try {
    // Never SELECT * — only expose safe columns
    const [rows] = await pool.query(
      `SELECT id, employee_id, first_name, last_name, title, department,
              email, phone, specialization, employment_status,
              min_load, max_load, current_load, created_at
       FROM faculty ORDER BY last_name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch faculty' });
  }
};

// ── GET /api/faculty/me — returns the logged-in faculty's own profile ──────
export const getMyFacultyProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, employee_id, first_name, last_name, title, department,
              email, phone, specialization, employment_status,
              min_load, max_load, current_load, created_at
       FROM faculty WHERE user_id = ?`,
      [req.user.id]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'Faculty profile not found for this account' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// ── GET /api/faculty/:id/subjects — subjects taught by a faculty member ────
export const getFacultySubjects = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [rows] = await pool.query(
      `SELECT DISTINCT
         sub.id, sub.code, sub.title, sub.type, sub.hours, sub.units,
         s.section, s.day, s.start_time, s.end_time,
         r.room_id AS room_code, r.name AS room_name,
         (SELECT COUNT(*) FROM enrollments e WHERE e.schedule_id = s.id) AS enrolled,
         r.capacity
       FROM schedules s
       JOIN subjects sub ON sub.id = s.subject_id
       JOIN rooms    r   ON r.id   = s.room_id
       WHERE s.faculty_id = ?
       ORDER BY s.day, s.start_time`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Failed to fetch subjects' });
  }
};

export const getFacultyById = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [rows] = await pool.query(
      `SELECT id, employee_id, first_name, last_name, title, department,
              email, phone, specialization, employment_status,
              min_load, max_load, current_load, created_at
       FROM faculty WHERE id = ?`, [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Faculty not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to fetch faculty' });
  }
};

export const createFaculty = async (req, res) => {
  try {
    const b = sanitizeBody(req.body);
    const employee_id       = requireString(b.employee_id,       'Employee ID', 50);
    const first_name        = requireString(b.first_name,        'First name',  100);
    const last_name         = requireString(b.last_name,         'Last name',   100);
    const department        = requireString(b.department,        'Department',  100);
    const email             = requireEmail(b.email);
    const title             = requireEnum(b.title || 'Prof.',    'Title',       TITLES);
    const employment_status = requireEnum(b.employment_status || 'Full-time', 'Employment status', EMPLOYMENT_STATUSES);
    const phone             = b.phone         ? requireString(b.phone,         'Phone',          20)  : '';
    const specialization    = b.specialization? requireString(b.specialization,'Specialization', 200) : '';
    const min_load          = requireInt(b.min_load  ?? 15, 'Min load',  0, 100);
    const max_load          = requireInt(b.max_load  ?? 21, 'Max load',  0, 100);
    const current_load      = requireInt(b.current_load ?? 0, 'Current load', 0, 100);

    if (min_load > max_load)
      return res.status(400).json({ message: 'Min load cannot exceed max load' });

    const [result] = await pool.query(
      `INSERT INTO faculty
        (user_id,employee_id,first_name,last_name,title,department,email,phone,
         specialization,employment_status,min_load,max_load,current_load)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [b.user_id ? Number(b.user_id) : null,
       employee_id, first_name, last_name, title, department, email,
       phone, specialization, employment_status, min_load, max_load, current_load]
    );
    const [rows] = await pool.query('SELECT * FROM faculty WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Employee ID or email already exists' });
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to create faculty' });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const b  = sanitizeBody(req.body);

    const first_name        = requireString(b.first_name,        'First name',  100);
    const last_name         = requireString(b.last_name,         'Last name',   100);
    const department        = requireString(b.department,        'Department',  100);
    const email             = requireEmail(b.email);
    const title             = requireEnum(b.title || 'Prof.',    'Title',       TITLES);
    const employment_status = requireEnum(b.employment_status || 'Full-time', 'Employment status', EMPLOYMENT_STATUSES);
    const phone             = b.phone         ? requireString(b.phone,         'Phone',          20)  : '';
    const specialization    = b.specialization? requireString(b.specialization,'Specialization', 200) : '';
    const min_load          = requireInt(b.min_load  ?? 15, 'Min load',  0, 100);
    const max_load          = requireInt(b.max_load  ?? 21, 'Max load',  0, 100);
    const current_load      = requireInt(b.current_load ?? 0, 'Current load', 0, 100);

    if (min_load > max_load)
      return res.status(400).json({ message: 'Min load cannot exceed max load' });

    const [result] = await pool.query(
      `UPDATE faculty SET
        first_name=?,last_name=?,title=?,department=?,email=?,phone=?,
        specialization=?,employment_status=?,min_load=?,max_load=?,current_load=?
       WHERE id=?`,
      [first_name, last_name, title, department, email, phone,
       specialization, employment_status, min_load, max_load, current_load, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Faculty not found' });
    const [rows] = await pool.query('SELECT * FROM faculty WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to update faculty' });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [result] = await pool.query('DELETE FROM faculty WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Faculty not found' });
    res.json({ message: 'Faculty deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to delete faculty' });
  }
};
