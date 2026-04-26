import pool from '../config/db.js';
import { parseId, requireString, requireEmail, requireEnum, requireInt, sanitizeBody, sanitizeList } from '../middlewares/sanitize.js';

const GENDERS    = ['Male', 'Female', 'Other'];
const PROGRAMS   = ['BSIT', 'BSCS'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const parseList = (val) => (val ? val.split(',').map(s => s.trim()).filter(Boolean) : []);

const format = (row) => ({
  ...row,
  skills:       parseList(row.skills),
  activities:   parseList(row.activities),
  affiliations: parseList(row.affiliations),
  violations:   parseList(row.violations),
});

// Resolve faculty.id (profile) from users.id — returns null if not found
const getFacultyProfileId = async (userId) => {
  const [[row]] = await pool.query('SELECT id FROM faculty WHERE user_id = ?', [userId]);
  return row?.id ?? null;
};

// ── GET /api/students ──────────────────────────────────────────────────────
// Admin   → all students + optional filters
// Faculty → only students assigned to them via student_faculty junction
// Student → only their own record
export const getStudents = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { search, program, yearLevel, skill, gender, page = 1, limit = 20 } = req.query;

    // Sanitize pagination values
    const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    let sql      = 'SELECT s.* FROM students s';
    let countSql = 'SELECT COUNT(*) AS total FROM students s';
    const params = [];

    if (role === 'student') {
      const where = ' WHERE s.user_id = ?';
      sql      += where;
      countSql += where;
      params.push(userId);
    } else if (role === 'faculty') {
      const join = ` INNER JOIN student_faculty sf ON sf.student_id = s.id
                     INNER JOIN users u ON u.id = sf.faculty_id
                     WHERE u.id = ?`;
      sql      += join;
      countSql += join;
      params.push(userId);
    } else {
      sql      += ' WHERE 1=1';
      countSql += ' WHERE 1=1';
    }

    if (role !== 'student') {
      if (search) {
        const clause = ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ? OR s.program LIKE ? OR s.skills LIKE ? OR s.affiliations LIKE ?)';
        sql      += clause;
        countSql += clause;
        const q = `%${search}%`;
        params.push(q, q, q, q, q, q);
      }
      if (program   && program   !== 'All')       { const c = ' AND s.program = ?';            sql += c; countSql += c; params.push(program); }
      if (yearLevel && yearLevel !== 'All')        { const c = ' AND s.year_level = ?';         sql += c; countSql += c; params.push(yearLevel); }
      if (skill     && skill     !== 'All Skills') { const c = ' AND FIND_IN_SET(?, s.skills)'; sql += c; countSql += c; params.push(skill); }
      if (gender    && gender    !== 'All')        { const c = ' AND s.gender = ?';             sql += c; countSql += c; params.push(gender); }
    }

    sql += ' ORDER BY s.added_date DESC LIMIT ? OFFSET ?';

    // countSql shares the same params, data query needs 2 extra
    const [[{ total }]] = await pool.query(countSql, params);
    const [rows]        = await pool.query(sql, [...params, limitNum, offset]);

    res.json({
      data:       rows.map(format),
      pagination: {
        total,
        page:      pageNum,
        limit:     limitNum,
        lastPage:  Math.ceil(total / limitNum),
        hasNext:   pageNum < Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[students] getStudents:', err.message);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
};

// ── GET /api/students/:id ──────────────────────────────────────────────────
export const getStudentById = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const studentId = parseId(req.params.id);

    let sql    = 'SELECT s.* FROM students s';
    const params = [studentId];

    if (role === 'student') {
      sql += ' WHERE s.id = ? AND s.user_id = ?';
      params.push(userId);
    } else if (role === 'faculty') {
      sql += ` INNER JOIN student_faculty sf ON sf.student_id = s.id
               WHERE s.id = ? AND sf.faculty_id = ?`;
      params.push(userId);
    } else {
      sql += ' WHERE s.id = ?';
    }

    const [rows] = await pool.query(sql, params);

    if (!rows.length)
      return role === 'admin'
        ? res.status(404).json({ message: 'Student not found' })
        : res.status(403).json({ message: 'Forbidden' });

    // Attach assigned faculty list
    const [faculty] = await pool.query(
      `SELECT u.id, u.name, f.employee_id, f.title, f.department
       FROM student_faculty sf
       JOIN users   u ON u.id = sf.faculty_id
       JOIN faculty f ON f.user_id = u.id
       WHERE sf.student_id = ?`,
      [studentId]
    );

    res.json({ ...format(rows[0]), faculty });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to fetch student' });
  }
};

// ── PUT /api/students/:id ──────────────────────────────────────────────────
export const updateStudent = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const studentId = parseId(req.params.id);

    // Access check via junction for faculty
    let checkSql    = 'SELECT id FROM students WHERE id = ?';
    const checkParams = [studentId];

    if (role === 'student') {
      checkSql += ' AND user_id = ?';
      checkParams.push(userId);
    } else if (role === 'faculty') {
      checkSql = `SELECT s.id FROM students s
                  INNER JOIN student_faculty sf ON sf.student_id = s.id
                  WHERE s.id = ? AND sf.faculty_id = ?`;
      checkParams.push(userId);
    }

    const [check] = await pool.query(checkSql, checkParams);
    if (!check.length)
      return role === 'admin'
        ? res.status(404).json({ message: 'Student not found' })
        : res.status(403).json({ message: 'Forbidden' });

    const b = sanitizeBody(req.body);
    const first_name   = requireString(b.first_name,  'First name',  100);
    const last_name    = requireString(b.last_name,   'Last name',   100);
    const email        = requireEmail(b.email);
    const gender       = requireEnum(b.gender || 'Male', 'Gender', GENDERS);
    const middle_name  = b.middle_name ? requireString(b.middle_name, 'Middle name', 100) : '';
    const phone        = b.phone       ? requireString(b.phone,       'Phone',        20) : '';
    const address      = b.address     ? requireString(b.address,     'Address',     500) : '';
    const program      = requireEnum(b.program    || 'BSIT',     'Program',    PROGRAMS);
    const year_level   = requireEnum(b.year_level || '1st Year', 'Year level', YEAR_LEVELS);
    const section      = requireString(b.section, 'Section', 10);
    const age          = requireInt(b.age ?? 18, 'Age', 15, 60);
    const skills       = sanitizeList(b.skills).join(',');
    const activities   = sanitizeList(b.activities).join(',');
    const affiliations = sanitizeList(b.affiliations).join(',');
    const violations   = sanitizeList(b.violations).join(',');

    await pool.query(
      `UPDATE students SET
        first_name=?,last_name=?,middle_name=?,age=?,gender=?,email=?,phone=?,address=?,
        program=?,year_level=?,section=?,skills=?,activities=?,affiliations=?,violations=?
       WHERE id=?`,
      [first_name, last_name, middle_name, age, gender, email, phone, address,
       program, year_level, section, skills, activities, affiliations, violations, studentId]
    );

    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [studentId]);
    res.json(format(rows[0]));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to update student' });
  }
};

// ── POST /api/students — admin only ───────────────────────────────────────
export const createStudent = async (req, res) => {
  try {
    const b = sanitizeBody(req.body);
    const student_id   = requireString(b.student_id,  'Student ID',  50);
    const first_name   = requireString(b.first_name,  'First name',  100);
    const last_name    = requireString(b.last_name,   'Last name',   100);
    const email        = requireEmail(b.email);
    const program      = requireEnum(b.program    || 'BSIT',     'Program',    PROGRAMS);
    const year_level   = requireEnum(b.year_level || '1st Year', 'Year level', YEAR_LEVELS);
    const section      = requireString(b.section, 'Section', 10);
    // user_id is optional — only set when a user account is linked
    const user_id      = b.user_id ? parseId(b.user_id) : null;
    const gender       = requireEnum(b.gender || 'Male', 'Gender', GENDERS);
    const middle_name  = b.middle_name ? requireString(b.middle_name, 'Middle name', 100) : '';
    const phone        = b.phone       ? requireString(b.phone,       'Phone',        20) : '';
    const address      = b.address     ? requireString(b.address,     'Address',     500) : '';
    const age          = requireInt(b.age ?? 18, 'Age', 15, 60);
    const skills       = sanitizeList(b.skills).join(',');
    const activities   = sanitizeList(b.activities).join(',');
    const affiliations = sanitizeList(b.affiliations).join(',');
    const violations   = sanitizeList(b.violations).join(',');

    // faculty_ids is an array of users.id with role='faculty'
    const facultyIds = Array.isArray(b.faculty_ids)
      ? b.faculty_ids.map(Number).filter(n => Number.isInteger(n) && n > 0)
      : [];

    const [result] = await pool.query(
      `INSERT INTO students
        (user_id,student_id,first_name,last_name,middle_name,age,gender,email,phone,address,
         program,year_level,section,skills,activities,affiliations,violations,added_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE())`,
      [user_id, student_id, first_name, last_name, middle_name, age, gender, email,
       phone, address, program, year_level, section, skills, activities, affiliations, violations]
    );
    const newStudentId = result.insertId;

    // Insert junction rows for each assigned faculty
    if (facultyIds.length) {
      const vals = facultyIds.map(fid => [newStudentId, fid]);
      await pool.query('INSERT IGNORE INTO student_faculty (student_id, faculty_id) VALUES ?', [vals]);
    }

    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [newStudentId]);
    res.status(201).json(format(rows[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Student ID or email already exists' });
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to create student' });
  }
};

// ── DELETE /api/students/:id — admin only ─────────────────────────────────
export const deleteStudent = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to delete student' });
  }
};

// ── POST /api/students/:id/faculty — admin only ───────────────────────────
// Assign one or more faculty to a student
export const assignFaculty = async (req, res) => {
  try {
    const studentId  = parseId(req.params.id);
    const facultyIds = Array.isArray(req.body.faculty_ids)
      ? req.body.faculty_ids.map(Number).filter(n => Number.isInteger(n) && n > 0)
      : [];

    if (!facultyIds.length)
      return res.status(400).json({ message: 'faculty_ids array is required' });

    // Verify all provided IDs are actually faculty users
    const [valid] = await pool.query(
      `SELECT id FROM users WHERE id IN (?) AND role = 'faculty'`, [facultyIds]
    );
    if (valid.length !== facultyIds.length)
      return res.status(400).json({ message: 'One or more faculty IDs are invalid' });

    const vals = facultyIds.map(fid => [studentId, fid]);
    await pool.query('INSERT IGNORE INTO student_faculty (student_id, faculty_id) VALUES ?', [vals]);

    const [rows] = await pool.query(
      `SELECT u.id, u.name, f.employee_id, f.title, f.department
       FROM student_faculty sf
       JOIN users   u ON u.id = sf.faculty_id
       JOIN faculty f ON f.user_id = u.id
       WHERE sf.student_id = ?`, [studentId]
    );
    res.json({ student_id: studentId, faculty: rows });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to assign faculty' });
  }
};

// ── DELETE /api/students/:id/faculty/:facultyId — admin only ─────────────
export const removeFaculty = async (req, res) => {
  try {
    const studentId = parseId(req.params.id);
    const facultyId = parseId(req.params.facultyId);

    const [result] = await pool.query(
      'DELETE FROM student_faculty WHERE student_id = ? AND faculty_id = ?',
      [studentId, facultyId]
    );
    if (!result.affectedRows)
      return res.status(404).json({ message: 'Assignment not found' });

    res.json({ message: 'Faculty unassigned from student' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to remove faculty' });
  }
};

// ── GET /api/students/:id/enrollments ─────────────────────────────────────
// Returns all schedules/subjects a student is enrolled in
export const getStudentEnrollments = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const studentId = parseId(req.params.id);

    // Security: student can only see their own enrollments
    if (role === 'student') {
      const [[own]] = await pool.query('SELECT id FROM students WHERE id = ? AND user_id = ?', [studentId, userId]);
      if (!own) return res.status(403).json({ message: 'Forbidden' });
    }

    const [rows] = await pool.query(
      `SELECT
         e.id AS enrollment_id,
         sub.id AS subject_id, sub.code, sub.title, sub.type, sub.hours, sub.units,
         s.section, s.day, s.start_time, s.end_time,
         f.first_name AS faculty_first, f.last_name AS faculty_last, f.title AS faculty_title,
         r.room_id AS room_code, r.name AS room_name
       FROM enrollments e
       JOIN schedules s  ON s.id  = e.schedule_id
       JOIN subjects  sub ON sub.id = s.subject_id
       JOIN faculty   f   ON f.id  = s.faculty_id
       JOIN rooms     r   ON r.id  = s.room_id
       WHERE e.student_id = ?
       ORDER BY s.day, s.start_time`,
      [studentId]
    );
    res.json(rows);
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Failed to fetch enrollments' });
  }
};

// ── POST /api/students/:id/enrollments — admin only ───────────────────────
// Enroll a student in one or more schedules
export const enrollStudent = async (req, res) => {
  try {
    const studentId   = parseId(req.params.id);
    const scheduleIds = Array.isArray(req.body.schedule_ids)
      ? req.body.schedule_ids.map(Number).filter(n => Number.isInteger(n) && n > 0)
      : [];

    if (!scheduleIds.length)
      return res.status(400).json({ message: 'schedule_ids array is required' });

    const vals = scheduleIds.map(sid => [studentId, sid]);
    await pool.query('INSERT IGNORE INTO enrollments (student_id, schedule_id) VALUES ?', [vals]);
    res.json({ message: 'Enrolled successfully' });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Failed to enroll student' });
  }
};

// ── DELETE /api/students/:id/enrollments/:enrollmentId — admin only ────────
export const unenrollStudent = async (req, res) => {
  try {
    const studentId    = parseId(req.params.id);
    const enrollmentId = parseId(req.params.enrollmentId);

    const [result] = await pool.query(
      'DELETE FROM enrollments WHERE id = ? AND student_id = ?',
      [enrollmentId, studentId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Enrollment not found' });
    res.json({ message: 'Unenrolled successfully' });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Failed to unenroll student' });
  }
};

// ── GET /api/students/stats — admin only ──────────────────────────────────
export const getStudentStats = async (_req, res) => {  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM students');
    const [skillRows]   = await pool.query('SELECT skills FROM students WHERE skills IS NOT NULL');
    const allSkills     = skillRows.flatMap(r => parseList(r.skills));
    const skillCount    = allSkills.reduce((a, s) => { a[s] = (a[s]||0)+1; return a; }, {});
    const topSkill      = Object.entries(skillCount).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';
    const categories    = Object.keys(skillCount).length;
    const [recent]      = await pool.query(
      'SELECT first_name, last_name, added_date FROM students ORDER BY added_date DESC LIMIT 3'
    );
    res.json({ total, topSkill, skillCategories: categories, recentStudents: recent });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};
