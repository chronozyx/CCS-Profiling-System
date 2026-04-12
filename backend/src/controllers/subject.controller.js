import pool from '../config/db.js';
import { parseId, requireString, requireEnum, requireInt, sanitizeBody } from '../middlewares/sanitize.js';

const TYPES = ['LECTURE', 'LABORATORY', 'PURE_LECTURE'];

export const getSubjects = async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subjects ORDER BY code');
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

export const createSubject = async (req, res) => {
  try {
    const b     = sanitizeBody(req.body);
    const code  = requireString(b.code,  'Code',  20);
    const title = requireString(b.title, 'Title', 200);
    const type  = requireEnum(b.type,    'Type',  TYPES);
    const hours = requireInt(b.hours ?? 2, 'Hours', 1, 10);
    const units = requireInt(b.units ?? 2, 'Units', 1, 10);

    const [result] = await pool.query(
      'INSERT INTO subjects (code,title,type,hours,units) VALUES (?,?,?,?,?)',
      [code, title, type, hours, units]
    );
    const [rows] = await pool.query('SELECT * FROM subjects WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Subject code already exists' });
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to create subject' });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const id    = parseId(req.params.id);
    const b     = sanitizeBody(req.body);
    const code  = requireString(b.code,  'Code',  20);
    const title = requireString(b.title, 'Title', 200);
    const type  = requireEnum(b.type,    'Type',  TYPES);
    const hours = requireInt(b.hours ?? 2, 'Hours', 1, 10);
    const units = requireInt(b.units ?? 2, 'Units', 1, 10);

    const [result] = await pool.query(
      'UPDATE subjects SET code=?,title=?,type=?,hours=?,units=? WHERE id=?',
      [code, title, type, hours, units, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Subject not found' });
    const [rows] = await pool.query('SELECT * FROM subjects WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Subject code already exists' });
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to update subject' });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [result] = await pool.query('DELETE FROM subjects WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to delete subject' });
  }
};
