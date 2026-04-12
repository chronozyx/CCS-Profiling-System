import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { parseId, requireString, requireEmail, requireEnum, sanitizeBody } from '../middlewares/sanitize.js';

const ROLES = ['admin', 'faculty', 'student'];

// Generate a unique 7-digit login_id for student/faculty
const generateLoginId = async () => {
  for (let attempts = 0; attempts < 20; attempts++) {
    const id = String(Math.floor(1000000 + Math.random() * 9000000));
    const [[row]] = await pool.query('SELECT id FROM users WHERE login_id = ?', [id]);
    if (!row) return id;
  }
  throw new Error('Could not generate unique login ID');
};

// ── GET /api/users ─────────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const allowed = ['admin', 'faculty', 'student'];
    let sql = `
      SELECT u.id, u.login_id, u.name, u.email, u.role, u.plain_password, u.created_at,
        s.student_id, s.program, s.year_level, s.section,
        f.employee_id, f.department, f.title AS faculty_title
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN faculty  f ON f.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (role && allowed.includes(role)) { sql += ' AND u.role = ?'; params.push(role); }
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.login_id LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY u.role, u.name';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[users] getUsers:', err.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// ── POST /api/users ────────────────────────────────────────────────────────
export const createUser = async (req, res) => {
  try {
    const b        = sanitizeBody(req.body);
    const name     = requireString(b.name,     'Name',     150);
    const email    = requireEmail(b.email);
    const password = requireString(b.password, 'Password', 128);
    const role     = requireEnum(b.role || 'student', 'Role', ROLES);

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Generate login_id for student/faculty; admin uses email only
    const login_id = (role !== 'admin') ? await generateLoginId() : null;

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (login_id, name, email, password, plain_password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [login_id, name, email, hashed, password, role]
    );
    const [rows] = await pool.query(
      'SELECT id, login_id, name, email, role, plain_password, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Email already exists' });
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to create user' });
  }
};

// ── PUT /api/users/:id ─────────────────────────────────────────────────────
export const updateUser = async (req, res) => {
  try {
    const id    = parseId(req.params.id);
    const b     = sanitizeBody(req.body);
    const name  = requireString(b.name,  'Name',  150);
    const email = requireEmail(b.email);
    const role  = requireEnum(b.role || 'student', 'Role', ROLES);

    if (id === req.user.id && role !== 'admin')
      return res.status(400).json({ message: 'You cannot change your own role' });

    // Validate login_id if provided (student/faculty only)
    let login_id = undefined;
    if (b.login_id !== undefined) {
      if (role === 'admin') {
        login_id = null; // admin never has a login_id
      } else {
        const lid = String(b.login_id || '').trim();
        if (!/^\d{7}$/.test(lid))
          return res.status(400).json({ message: 'Login ID must be exactly 7 digits' });
        // Check uniqueness (exclude self)
        const [[existing]] = await pool.query(
          'SELECT id FROM users WHERE login_id = ? AND id != ?', [lid, id]
        );
        if (existing)
          return res.status(400).json({ message: 'Login ID already in use' });
        login_id = lid;
      }
    }

    let sql      = 'UPDATE users SET name=?, email=?, role=?';
    const params = [name, email, role];

    if (login_id !== undefined) {
      sql += ', login_id=?';
      params.push(login_id);
    }

    if (b.password) {
      const pw = requireString(b.password, 'Password', 128);
      if (pw.length < 6)
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      const hashed = await bcrypt.hash(pw, 10);
      sql += ', password=?, plain_password=?';
      params.push(hashed, pw);
    }

    sql += ' WHERE id=?';
    params.push(id);

    const [result] = await pool.query(sql, params);
    if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });

    const [rows] = await pool.query(
      'SELECT id, login_id, name, email, role, plain_password, created_at FROM users WHERE id = ?', [id]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Email or Login ID already exists' });
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to update user' });
  }
};

// ── DELETE /api/users/:id ──────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === req.user.id)
      return res.status(400).json({ message: 'You cannot delete your own account' });

    // Fetch what will be cascade-deleted so we can return it in the response
    const [[user]] = await pool.query(
      'SELECT id, name, role FROM users WHERE id = ?', [id]
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [[studentProfile]] = await pool.query(
      'SELECT student_id FROM students WHERE user_id = ?', [id]
    );
    const [[facultyProfile]] = await pool.query(
      'SELECT employee_id FROM faculty WHERE user_id = ?', [id]
    );

    // Single DELETE — cascade handles students/faculty/student_faculty rows
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      message: 'User deleted',
      deleted: {
        user:    user.name,
        role:    user.role,
        student: studentProfile?.student_id ?? null,
        faculty: facultyProfile?.employee_id ?? null,
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to delete user' });
  }
};

// ── PUT /api/users/:id/reset-password ─────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const b  = sanitizeBody(req.body);
    const pw = requireString(b.password, 'Password', 128);
    if (pw.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const hashed = await bcrypt.hash(pw, 10);
    const [result] = await pool.query(
      'UPDATE users SET password=?, plain_password=? WHERE id=?',
      [hashed, pw, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to reset password' });
  }
};

// ── POST /api/users/:id/regenerate-login-id — admin only ──────────────────
export const regenerateLoginId = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [[user]] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin')
      return res.status(400).json({ message: 'Admin accounts do not use a login ID' });

    const login_id = await generateLoginId();
    await pool.query('UPDATE users SET login_id=? WHERE id=?', [login_id, id]);
    res.json({ login_id });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to regenerate login ID' });
  }
};
