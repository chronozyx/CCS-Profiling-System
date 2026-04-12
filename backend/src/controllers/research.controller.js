import pool from '../config/db.js';
import { parseId, requireString, requireEnum, requireInt, sanitizeBody } from '../middlewares/sanitize.js';

const CATEGORIES   = ['Published', 'Ongoing', 'Presented', 'Rejected'];
const PROGRAMS     = ['BSIT', 'BSCS', 'BSIS', 'Other'];
const AUTHOR_TYPES = ['faculty', 'student', 'external'];

export const getResearch = async (req, res) => {
  try {
    // Whitelist query params — never interpolate raw values
    const allowedPrograms = [...PROGRAMS, 'all'];
    const year    = req.query.year    ? String(req.query.year).replace(/\D/g, '')  : null;
    const program = req.query.program ? String(req.query.program).trim()           : null;

    if (program && !allowedPrograms.includes(program))
      return res.status(400).json({ message: 'Invalid program filter' });
    if (year && (year.length !== 4 || isNaN(Number(year))))
      return res.status(400).json({ message: 'Invalid year filter' });

    let sql = 'SELECT id,title,program,year_published,category,evaluation_score,created_at FROM research WHERE 1=1';
    const params = [];
    if (year    && year    !== 'all') { sql += ' AND year_published = ?'; params.push(Number(year)); }
    if (program && program !== 'all') { sql += ' AND program = ?';        params.push(program); }
    sql += ' ORDER BY evaluation_score DESC';

    const [rows] = await pool.query(sql, params);
    if (!rows.length) return res.json([]);

    const ids = rows.map(r => r.id);
    const [aRows] = await pool.query(
      'SELECT research_id, author_name, author_type FROM research_authors WHERE research_id IN (?)', [ids]
    );

    const result = rows.map((r, i) => ({
      ...r,
      rank: i + 1,
      authors: aRows.filter(a => a.research_id === r.id).map(a => a.author_name),
    }));
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Failed to fetch research' });
  }
};

export const createResearch = async (req, res) => {
  try {
    const b                = sanitizeBody(req.body);
    const title            = requireString(b.title,    'Title',    500);
    const program          = requireEnum(b.program || 'BSIT', 'Program', PROGRAMS);
    const category         = requireEnum(b.category || 'Ongoing', 'Category', CATEGORIES);
    const year_published   = requireInt(b.year_published ?? new Date().getFullYear(), 'Year', 2000, 2100);
    const evaluation_score = Number(b.evaluation_score ?? 0);

    if (isNaN(evaluation_score) || evaluation_score < 0 || evaluation_score > 100)
      return res.status(400).json({ message: 'Evaluation score must be between 0 and 100' });

    // Validate authors array
    const rawAuthors = Array.isArray(b.authors) ? b.authors.slice(0, 20) : [];
    const authors = rawAuthors.map(a => ({
      name: requireString(typeof a === 'string' ? a : a.name, 'Author name', 200),
      type: requireEnum((a.type || 'faculty'), 'Author type', AUTHOR_TYPES),
    }));

    const [result] = await pool.query(
      'INSERT INTO research (title,program,year_published,category,evaluation_score) VALUES (?,?,?,?,?)',
      [title, program, year_published, category, evaluation_score]
    );
    const rid = result.insertId;

    if (authors.length) {
      const vals = authors.map(a => [rid, a.name, a.type]);
      await pool.query('INSERT INTO research_authors (research_id,author_name,author_type) VALUES ?', [vals]);
    }

    const [rows] = await pool.query('SELECT * FROM research WHERE id = ?', [rid]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to create research' });
  }
};

export const deleteResearch = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [result] = await pool.query('DELETE FROM research WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Research not found' });
    res.json({ message: 'Research deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to delete research' });
  }
};
