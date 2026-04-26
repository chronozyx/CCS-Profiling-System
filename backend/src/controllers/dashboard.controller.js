import pool from '../config/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { role, id: userId } = req.user || { role: 'admin', id: null };

    // ── Counts ────────────────────────────────────────────────────────────
    let studentCount = 0;
    if (role === 'faculty' && userId) {
      const [[r]] = await pool.query(
        'SELECT COUNT(DISTINCT student_id) AS total FROM student_faculty WHERE faculty_id = ?',
        [userId]
      );
      studentCount = r?.total || 0;
    } else {
      const [[r]] = await pool.query('SELECT COUNT(*) AS total FROM students');
      studentCount = r?.total || 0;
    }

    const [[fRow]] = await pool.query('SELECT COUNT(*) AS total FROM faculty');
    const [[eRow]] = await pool.query("SELECT COUNT(*) AS total FROM events WHERE status = 'Upcoming'");
    const [[cRow]] = await pool.query('SELECT COUNT(*) AS total FROM schedules');

    // ── Top skill ─────────────────────────────────────────────────────────
    const [skillRows] = await pool.query(
      "SELECT skills FROM students WHERE skills IS NOT NULL AND skills <> ''"
    );
    let topSkill = '—';
    if (skillRows.length) {
      const allSkills = skillRows.flatMap(r =>
        (r.skills || '').split(',').map(s => s.trim()).filter(Boolean)
      );
      if (allSkills.length) {
        const cnt = allSkills.reduce((a, s) => { a[s] = (a[s] || 0) + 1; return a; }, {});
        topSkill = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
      }
    }

    // ── Recent students ───────────────────────────────────────────────────
    let recentQuery = `SELECT id, first_name, last_name, program, year_level, skills
                       FROM students ORDER BY created_at DESC LIMIT 5`;
    let recentParams = [];
    if (role === 'faculty' && userId) {
      recentQuery = `SELECT s.id, s.first_name, s.last_name, s.program, s.year_level, s.skills
                     FROM students s
                     INNER JOIN student_faculty sf ON sf.student_id = s.id
                     WHERE sf.faculty_id = ?
                     ORDER BY s.created_at DESC LIMIT 5`;
      recentParams = [userId];
    }
    const [recentStudents] = await pool.query(recentQuery, recentParams);

    // ── Top researchers ───────────────────────────────────────────────────
    const [topResearchers] = await pool.query(
      `SELECT r.title, r.evaluation_score,
              GROUP_CONCAT(ra.author_name ORDER BY ra.id SEPARATOR ', ') AS authors
       FROM research r
       LEFT JOIN research_authors ra ON ra.research_id = r.id
       WHERE r.evaluation_score > 0
       GROUP BY r.id
       ORDER BY r.evaluation_score DESC LIMIT 3`
    );

    // ── Faculty distribution by department ───────────────────────────────
    const [facDist] = await pool.query(
      `SELECT department, COUNT(*) AS count FROM faculty GROUP BY department ORDER BY count DESC`
    );
    const totalFac = facDist.reduce((s, r) => s + Number(r.count), 0) || 1;
    const facultyDistribution = facDist.map(r => ({
      label:   r.department,
      count:   Number(r.count),
      percent: Math.round((Number(r.count) / totalFac) * 100),
    }));

    // ── Recent activity from audit logs ──────────────────────────────────
    const [actRows] = await pool.query(
      `SELECT a.method, a.endpoint, a.created_at, u.name AS user_name, u.role AS user_role
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.status = 'allowed'
       ORDER BY a.created_at DESC LIMIT 6`
    );
    const recentActivity = actRows.map(r => ({
      action:    `${r.method} ${r.endpoint}`,
      user:      r.user_name || 'System',
      role:      r.user_role || '—',
      time:      r.created_at,
    }));

    res.json({
      totalStudents:       studentCount,
      totalFaculty:        fRow?.total || 0,
      upcomingEvents:      eRow?.total || 0,
      totalSchedules:      cRow?.total || 0,
      topSkill,
      facultyDistribution,
      recentStudents: recentStudents.map(s => ({
        id:      s.id,
        name:    `${s.first_name} ${s.last_name}`,
        program: s.program   || 'N/A',
        year:    s.year_level || 'N/A',
        skills:  s.skills ? s.skills.split(',').map(x => x.trim()).filter(Boolean) : [],
      })),
      topResearchers: topResearchers.map((r, i) => ({
        rank:   i + 1,
        title:  r.title,
        score:  r.evaluation_score,
        authors: r.authors ? r.authors.split(', ') : [],
      })),
      recentActivity,
    });
  } catch (err) {
    console.error('[dashboard]', err.message);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
};
