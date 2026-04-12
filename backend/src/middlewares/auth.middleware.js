import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ccs_super_secret_2026';

// ── 1. verifyToken ─────────────────────────────────────────────────────────
// Validates the Bearer JWT and attaches decoded payload to req.user
export const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized: no token provided' });

  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized: invalid or expired token' });
  }
};

// ── 2. authorizeRoles ──────────────────────────────────────────────────────
// Usage: authorizeRoles('admin', 'faculty')
export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  next();
};

// ── 3a. checkOwnership ─────────────────────────────────────────────────────
// Admin → always allowed
// Student → only their own record (students.user_id must match req.user.id)
// Faculty → blocked (use checkFacultyAccess instead)
export const checkOwnership = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;

    if (role === 'admin') return next();

    if (role === 'student') {
      const [rows] = await pool.query(
        'SELECT id FROM students WHERE id = ? AND user_id = ?',
        [req.params.id, userId]
      );
      if (!rows.length)
        return res.status(403).json({ message: 'Forbidden: not your record' });
      return next();
    }

    return res.status(403).json({ message: 'Forbidden: access denied' });
  } catch (err) {
    res.status(500).json({ message: 'Ownership check failed', error: err.message });
  }
};

// ── 3b. checkFacultyAccess ─────────────────────────────────────────────────
// Admin → always allowed
// Faculty → only students where students.faculty_id = faculty.id (linked via users.id)
// Student → blocked
export const checkFacultyAccess = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;

    if (role === 'admin') return next();

    if (role === 'faculty') {
      // Resolve faculty profile id from user id
      const [[faculty]] = await pool.query(
        'SELECT id FROM faculty WHERE user_id = ?', [userId]
      );
      if (!faculty)
        return res.status(403).json({ message: 'Forbidden: faculty profile not found' });

      const [rows] = await pool.query(
        'SELECT id FROM students WHERE id = ? AND faculty_id = ?',
        [req.params.id, faculty.id]
      );
      if (!rows.length)
        return res.status(403).json({ message: 'Forbidden: student not assigned to you' });

      return next();
    }

    return res.status(403).json({ message: 'Forbidden: access denied' });
  } catch (err) {
    res.status(500).json({ message: 'Faculty access check failed', error: err.message });
  }
};

// Legacy alias — keeps existing routes that import { authenticate } working
export const authenticate = verifyToken;
