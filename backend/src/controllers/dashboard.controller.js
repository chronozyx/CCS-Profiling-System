import pool from '../config/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    console.log("--- Dashboard Debug Start ---");
    
    // 1. Resolve User Identity
    const user = req.user || { role: 'admin', id: null };
    console.log("Current User Data:", JSON.stringify(user));
    const { role, id: userId } = user;

    // 2. Student Count (Role-Based)
    let studentCount = 0;
    if (role === 'faculty' && userId) {
      console.log("Running Faculty Student Count for ID:", userId);
      const [rows] = await pool.query(
        `SELECT COUNT(DISTINCT student_id) AS total FROM student_faculty WHERE faculty_id = ?`, 
        [userId]
      );
      studentCount = rows[0]?.total || 0;
    } else {
      console.log("Running Admin/General Student Count");
      const [rows] = await pool.query('SELECT COUNT(*) AS total FROM students');
      studentCount = rows[0]?.total || 0;
    }

    // 3. Fetching General Counts (Safe Destructuring)
    console.log("Fetching Faculty/Events/Schedules counts...");
    const [fRows] = await pool.query('SELECT COUNT(*) AS total FROM faculty');
    const [eRows] = await pool.query('SELECT COUNT(*) AS total FROM events WHERE status = ?', ['Upcoming']);
    const [cRows] = await pool.query('SELECT COUNT(*) AS total FROM schedules');
    
    const fTotal = fRows[0]?.total || 0;
    const eTotal = eRows[0]?.total || 0;
    const cTotal = cRows[0]?.total || 0;

    // 4. Skills Logic (Safety for Empty DB)
    console.log("Fetching Skills...");
    const [skillRows] = await pool.query('SELECT skills FROM students WHERE skills IS NOT NULL AND skills != ""');
    
    let topSkill = '—';
    if (skillRows.length > 0) {
      const allSkills = skillRows.flatMap(r => (r.skills || '').split(',').map(s => s.trim()).filter(Boolean));
      const skillCount = allSkills.reduce((a, s) => { a[s] = (a[s] || 0) + 1; return a; }, {});
      const sortedSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]);
      topSkill = sortedSkills.length > 0 ? sortedSkills[0][0] : '—';
    }

    // 5. Recent Students (Role-Based)
    let recentQuery = 'SELECT first_name, last_name, program, year_level, skills FROM students ORDER BY created_at DESC LIMIT 3';
    let recentParams = [];
    
    if (role === 'faculty' && userId) {
      console.log("Applying Faculty Filter to Recent Students");
      recentQuery = `SELECT s.first_name, s.last_name, s.program, s.year_level, s.skills
                     FROM students s
                     INNER JOIN student_faculty sf ON sf.student_id = s.id
                     WHERE sf.faculty_id = ?
                     ORDER BY s.created_at DESC LIMIT 3`;
      recentParams = [userId];
    }
    
    const [recentStudents] = await pool.query(recentQuery, recentParams);

    // 6. Top Researchers
    const [topResearchers] = await pool.query(
      'SELECT title, evaluation_score FROM research ORDER BY evaluation_score DESC LIMIT 3'
    );

    console.log("--- Dashboard Debug Success ---");

    // 7. Final JSON Response
    res.json({
      totalStudents: studentCount,
      totalFaculty: fTotal,
      upcomingEvents: eTotal,
      totalSchedules: cTotal,
      topSkill,
      recentStudents: recentStudents.map(s => ({
        name: `${s.first_name} ${s.last_name}`,
        program: s.program || 'N/A',
        year: s.year_level || 'N/A',
        skills: s.skills ? s.skills.split(',').map(x => x.trim()).filter(Boolean) : [],
      })),
      topResearchers: topResearchers.map((r, i) => ({
        rank: i + 1,
        title: r.title,
        score: r.evaluation_score,
        authors: [],
      })),
    });

  } catch (err) {
    console.error(`[DASHBOARD ERROR CRITICAL]: ${err.message}`);
    res.status(500).json({ 
        message: 'Failed to load dashboard stats',
        debug_info: err.message
    });
  }
};