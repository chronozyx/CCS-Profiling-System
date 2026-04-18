import pool from '../config/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    console.log("--- Dashboard Debug Start ---");
    
    // 1. Debug User Object
    const user = req.user || { role: 'admin', id: null };
    console.log("Current User Data:", JSON.stringify(user));
    const { role, id: userId } = user;

    let studentCount;
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
    console.log("Student Count Result:", studentCount);

    // 2. Debug General Counts
    console.log("Fetching Faculty/Events/Schedules counts...");
    // Replace the [[fRow]] lines with this:
    const [fRows] = await pool.query('SELECT COUNT(*) AS total FROM faculty');
    const fTotal = fRows[0]?.total || 0;

    const [eRows] = await pool.query('SELECT COUNT(*) AS total FROM events WHERE status = ?', ['Upcoming']);
    const eTotal = eRows[0]?.total || 0;

    const [cRows] = await pool.query('SELECT COUNT(*) AS total FROM schedules');
    const cTotal = cRows[0]?.total || 0;
    console.log("Counts fetched successfully");

    // 3. Debug Skills Logic
    console.log("Fetching Skills...");
    const [skillRows] = await pool.query('SELECT skills FROM students WHERE skills IS NOT NULL AND skills != ""');
    console.log(`Found ${skillRows.length} rows with skills`);
    
    const allSkills = skillRows.flatMap(r => r.skills.split(',').map(s => s.trim()).filter(Boolean));
    const skillCount = allSkills.reduce((a, s) => { a[s] = (a[s] || 0) + 1; return a; }, {});
    const sortedSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]);
    const topSkill = sortedSkills.length > 0 ? sortedSkills[0][0] : '—';
    console.log("Top Skill Calculated:", topSkill);

    // 4. Debug Recent Students
    let recentQuery = 'SELECT first_name, last_name, program, year_level, skills FROM students ORDER BY created_at DESC LIMIT 3';
    let recentParams = [];
    if (role === 'faculty') {
      console.log("Applying Faculty Filter to Recent Students");
      recentQuery = `SELECT s.first_name, s.last_name, s.program, s.year_level, s.skills
                     FROM students s
                     INNER JOIN student_faculty sf ON sf.student_id = s.id
                     WHERE sf.faculty_id = ?
                     ORDER BY s.created_at DESC LIMIT 3`;
      recentParams = [userId];
    }
    
    console.log("Running Recent Students Query...");
    const [recentStudents] = await pool.query(recentQuery, recentParams);
    console.log(`Found ${recentStudents.length} recent students`);

    // 5. Debug Researchers
    console.log("Running Researchers Query...");
    const [topResearchers] = await pool.query(
      'SELECT title, evaluation_score FROM research ORDER BY evaluation_score DESC LIMIT 3'
    );

    console.log("--- Dashboard Debug Success ---");

    res.json({
      totalStudents: studentCount,
      totalFaculty: fRow.total,
      upcomingEvents: eRow.total,
      totalSchedules: cRow.total,
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
    console.error(`Stack Trace: ${err.stack}`);
    res.status(500).json({ 
        message: 'Failed to load dashboard stats',
        debug_info: err.message // Temporary: remove this after fixing
    });
  }
};