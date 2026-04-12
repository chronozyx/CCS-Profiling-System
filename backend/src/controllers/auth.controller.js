import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireString } from '../middlewares/sanitize.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ccs_super_secret_2026';

export const login = async (req, res) => {
  try {
    const identifier = requireString(req.body?.identifier ?? req.body?.email ?? '', 'Login ID or Email', 191);
    const password   = requireString(req.body?.password   ?? '', 'Password', 128);

    // Accept either login_id (7 digits) or email
    const isLoginId = /^\d{7}$/.test(identifier);
    const field     = isLoginId ? 'login_id' : 'email';

    const [rows] = await pool.query(
      `SELECT id, login_id, name, email, password, role FROM users WHERE ${field} = ?`,
      [identifier]
    );
    const user = rows[0];

    const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
    const match = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !match)
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!['admin', 'faculty', 'student'].includes(user.role))
      return res.status(403).json({ message: 'Access denied' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Login failed' });
  }
};

export const me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, login_id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};
