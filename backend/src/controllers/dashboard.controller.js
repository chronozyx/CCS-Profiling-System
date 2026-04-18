import pool from '../config/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const user = req.user || { role: 'admin', id: null };
    const { role, id: userId } = user;

    let studentCount;
    // 2. Ensure userId exists before running faculty query
    if (role === 'faculty' && userId) {
      const [rows] = await pool.query(
        `SELECT COUNT(DISTINCT student_id) AS total FROM student_faculty WHERE faculty_id = ?`, 
        [userId]
      );
      studentCount = rows[0]?.total || 0;
    } else {
      const [rows] = await pool.query('SELECT COUNT(*) AS total FROM students');
      studentCount = rows[0]?.total || 0;
    }

    const [[fRow]] = await pool.query('SELECT COUNT(*) AS total FROM faculty');
    const [[eRow]] = await pool.query("SELECT COUNT(*) AS total FROM events WHERE status = 'Upcoming'");
    const [[cRow]] = await pool.query('SELECT COUNT(*) AS total FROM schedules');

    // Top skill
    const [skillRows] = await pool.query('SELECT skills FROM students WHERE skills IS NOT NULL AND skills != ""');
    const allSkills   = skillRows.flatMap(r => r.skills.split(',').map(s => s.trim()).filter(Boolean));
    const skillCount  = allSkills.reduce((a, s) => { a[s] = (a[s] || 0) + 1; return a; }, {});
    const topSkill    = Object.entries(skillCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    // Recent students — scoped same as count
    let recentQuery = 'SELECT first_name, last_name, program, year_level, skills FROM students ORDER BY created_at DESC LIMIT 3';
    let recentParams = [];
    if (role === 'faculty') {
      recentQuery  = `SELECT s.first_name, s.last_name, s.program, s.year_level, s.skills
                      FROM students s
                      INNER JOIN student_faculty sf ON sf.student_id = s.id
                      WHERE sf.faculty_id = ?
                      ORDER BY s.created_at DESC LIMIT 3`;
      recentParams = [userId];
    }
    const [recentStudents] = await pool.query(recentQuery, recentParams);

    const [topResearchers] = await pool.query(
      'SELECT title, evaluation_score FROM research ORDER BY evaluation_score DESC LIMIT 3'
    );

    res.json({
      totalStudents:  studentCount,
      totalFaculty:   fRow.total,
      upcomingEvents: eRow.total,
      totalSchedules: cRow.total,
      topSkill,
      recentStudents: recentStudents.map(s => ({
        name:    `${s.first_name} ${s.last_name}`,
        program: s.program   || 'N/A',
        year:    s.year_level || 'N/A',
        skills:  s.skills ? s.skills.split(',').map(x => x.trim()).filter(Boolean) : [],
      })),
      topResearchers: topResearchers.map((r, i) => ({
        rank:    i + 1,
        title:   r.title,
        score:   r.evaluation_score,
        authors: [],
      })),
    });
  } catch (err) {
    // Log server-side only — never send stack to client
    console.error(`[dashboard] ${err.message}`);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
};
