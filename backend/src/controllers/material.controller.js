import pool from '../config/db.js';
import { parseId, requireString, sanitizeBody } from '../middlewares/sanitize.js';

const MATERIAL_TYPES = ['Lecture Slides', 'Lab Manual', 'Reference Material', 'Assignment', 'Exam', 'Other'];

export const getMaterials = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id,subject,faculty,type,title,upload_date,created_at FROM materials ORDER BY upload_date DESC'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch materials' });
  }
};

export const createMaterial = async (req, res) => {
  try {
    const b       = sanitizeBody(req.body);
    const subject = requireString(b.subject, 'Subject', 200);
    const type    = requireString(b.type,    'Type',    100);
    const title   = requireString(b.title,   'Title',   300);
    const faculty = b.faculty ? requireString(b.faculty, 'Faculty', 200) : '';

    const [result] = await pool.query(
      'INSERT INTO materials (subject,faculty,type,title,upload_date) VALUES (?,?,?,?,CURDATE())',
      [subject, faculty, type, title]
    );
    const [rows] = await pool.query('SELECT * FROM materials WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to create material' });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [result] = await pool.query('DELETE FROM materials WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Material not found' });
    res.json({ message: 'Material deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to delete material' });
  }
};
