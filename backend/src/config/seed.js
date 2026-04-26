import pool from "./db.js";
import bcrypt from "bcryptjs";

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log("🌱 Seeding sample data...");

    // ── Wipe existing data (order matters — FK constraints) ──
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of [
      'enrollments','student_faculty','schedules','students',
      'faculty','subjects','rooms','research_authors','research',
      'events','materials','users',
    ]) {
      await conn.query(`TRUNCATE TABLE ${t}`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    const hash = (pw) => bcrypt.hash(pw, 10);

    // ── Users ──────────────────────────────────────
    // Admin — no login_id
    await conn.query(
      `INSERT IGNORE INTO users (login_id, name, email, password, plain_password, role) VALUES (NULL, ?, ?, ?, ?, 'admin')`,
      ['System Admin', 'admin@ccs.edu', await hash('admin123'), 'admin123']
    );

    const facultyUsers = [
      ['1234567', 'Dr. Maria Santos',   'm.santos@ccs.edu',  '1234567'],
      ['2345678', 'Prof. Jose Reyes',   'j.reyes@ccs.edu',   '2345678'],
      ['3456789', 'Ms. Ana Lim',        'a.lim@ccs.edu',     '3456789'],
      ['4567890', 'Mr. Carlos Mendoza', 'c.mendoza@ccs.edu', '4567890'],
      ['5678901', 'Dr. Rosa Garcia',    'r.garcia@ccs.edu',  '5678901'],
    ];
    for (const [lid, name, email, pw] of facultyUsers) {
      await conn.query(
        `INSERT IGNORE INTO users (login_id, name, email, password, plain_password, role) VALUES (?, ?, ?, ?, ?, 'faculty')`,
        [lid, name, email, await hash(pw), pw]
      );
    }

    const studentUsers = [
      ['1111111', 'Juan Dela Cruz',   'juan.delacruz@ccs.edu',   '1111111'],
      ['2222222', 'Maria Reyes',      'maria.reyes@ccs.edu',     '2222222'],
      ['3333333', 'Pedro Bautista',   'pedro.bautista@ccs.edu',  '3333333'],
      ['4444444', 'Ana Gonzales',     'ana.gonzales@ccs.edu',    '4444444'],
      ['5555555', 'Miguel Torres',    'miguel.torres@ccs.edu',   '5555555'],
      ['6666666', 'Sofia Villanueva', 'sofia.villanueva@ccs.edu','6666666'],
      ['7777777', 'Luis Fernandez',   'luis.fernandez@ccs.edu',  '7777777'],
      ['8888888', 'Clara Morales',    'clara.morales@ccs.edu',   '8888888'],
      ['9999999', 'Marco Castillo',   'marco.castillo@ccs.edu',  '9999999'],
      ['1234321', 'Lea Pascual',      'lea.pascual@ccs.edu',     '1234321'],
    ];
    for (const [lid, name, email, pw] of studentUsers) {
      await conn.query(
        `INSERT IGNORE INTO users (login_id, name, email, password, plain_password, role) VALUES (?, ?, ?, ?, ?, 'student')`,
        [lid, name, email, await hash(pw), pw]
      );
    }

    // Fetch user IDs by email for FK references
    const uid = async (email) => {
      const [[row]] = await conn.query(`SELECT id FROM users WHERE email = ?`, [email]);
      return row.id;
    };

    // ── Faculty profiles ───────────────────────────
    const facultyData = [
      ['1000001', 'Maria',   'Santos',   'Dr.',   'Information Technology', 'm.santos@ccs.edu',  '09187654321', 'Data Science & AI',       'Full-time', 15, 21, 18],
      ['1000002', 'Jose',    'Reyes',    'Prof.', 'Computer Science',       'j.reyes@ccs.edu',   '09271234567', 'Software Engineering',     'Full-time', 15, 21, 15],
      ['1000003', 'Ana',     'Lim',      'Ms.',   'Information Technology', 'a.lim@ccs.edu',     '09351234567', 'Web Development',          'Part-time',  9, 12,  9],
      ['1000004', 'Carlos',  'Mendoza',  'Mr.',   'Computer Science',       'c.mendoza@ccs.edu', '09461234567', 'Cybersecurity',            'Full-time', 15, 21, 21],
      ['1000005', 'Rosa',    'Garcia',   'Dr.',   'Computer Science',       'r.garcia@ccs.edu',  '09561234567', 'Database Systems',         'Full-time', 15, 21, 12],
    ];
    for (const [eid, fn, ln, title, dept, email, phone, spec, status, min, max, load] of facultyData) {
      const userId = await uid(email);
      await conn.query(
        `INSERT IGNORE INTO faculty (user_id,employee_id,first_name,last_name,title,department,email,phone,specialization,employment_status,min_load,max_load,current_load)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [userId, eid, fn, ln, title, dept, email, phone, spec, status, min, max, load]
      );
    }

    // ── Subjects ───────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO subjects (code,title,type,hours,units) VALUES
        ('IT101','Introduction to Computing','PURE_LECTURE',3,3),
        ('IT201','Data Structures and Algorithms','LECTURE',2,2),
        ('IT202','Data Structures Lab','LABORATORY',3,1),
        ('IT301','Web Development','LECTURE',2,2),
        ('IT302','Web Development Lab','LABORATORY',3,1),
        ('CS301','Software Engineering','PURE_LECTURE',3,3),
        ('CS401','Database Management Systems','LECTURE',2,2),
        ('CS402','Database Management Lab','LABORATORY',3,1),
        ('IT401','Cybersecurity Fundamentals','PURE_LECTURE',3,3),
        ('IT402','Capstone Project 1','PURE_LECTURE',3,3)
    `);

    // ── Rooms ──────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO rooms (room_id,name,type,building,floor,capacity,current_occupancy,status) VALUES
        ('LR-101','Lecture Room 101','LECTURE_ROOM','CCS Building','1st Floor',45,40,'Occupied'),
        ('LR-201','Lecture Room 201','LECTURE_ROOM','CCS Building','2nd Floor',45,35,'Occupied'),
        ('LR-202','Lecture Room 202','LECTURE_ROOM','CCS Building','2nd Floor',45,0,'Available'),
        ('LR-301','Lecture Room 301','LECTURE_ROOM','CCS Building','3rd Floor',40,38,'Occupied'),
        ('LAB-101','Computer Laboratory 1','LABORATORY_ROOM','CCS Building','1st Floor',40,38,'Occupied'),
        ('LAB-102','Computer Laboratory 2','LABORATORY_ROOM','CCS Building','1st Floor',40,35,'Occupied'),
        ('LAB-201','Network Laboratory','LABORATORY_ROOM','CCS Building','2nd Floor',30,0,'Available'),
        ('LAB-301','Multimedia Laboratory','LABORATORY_ROOM','CCS Building','3rd Floor',35,30,'Occupied')
    `);

    // ── Schedules (faculty_id references faculty.id) ──
    const [[f1]] = await conn.query(`SELECT id FROM faculty WHERE employee_id='1000001'`);
    const [[f2]] = await conn.query(`SELECT id FROM faculty WHERE employee_id='1000002'`);
    const [[f3]] = await conn.query(`SELECT id FROM faculty WHERE employee_id='1000003'`);
    const [[f4]] = await conn.query(`SELECT id FROM faculty WHERE employee_id='1000004'`);
    const [[f5]] = await conn.query(`SELECT id FROM faculty WHERE employee_id='1000005'`);
    if (!f1 || !f2 || !f3 || !f4 || !f5) throw new Error('Faculty rows not found — check employee_id values');

    await conn.query(`
      INSERT IGNORE INTO schedules (subject_id,faculty_id,room_id,section,day,start_time,end_time) VALUES
        (1,${f1.id},1,'BSIT-1A','Monday','07:30','09:00'),
        (2,${f2.id},2,'BSIT-2A','Monday','09:00','11:00'),
        (3,${f2.id},5,'BSIT-2A','Wednesday','13:00','16:00'),
        (4,${f3.id},2,'BSIT-3A','Tuesday','07:30','09:30'),
        (5,${f3.id},6,'BSIT-3A','Thursday','13:00','16:00'),
        (6,${f2.id},3,'BSCS-3A','Wednesday','09:00','12:00'),
        (7,${f5.id},4,'BSIT-4A','Friday','07:30','09:30'),
        (8,${f5.id},7,'BSIT-4A','Friday','10:00','13:00'),
        (9,${f4.id},1,'BSCS-4A','Tuesday','13:00','16:00'),
        (10,${f1.id},3,'BSIT-4B','Thursday','09:00','12:00')
    `);

    // ── Missing schedules for subjects that have materials but no schedule ──
    // CS301 Software Engineering → Prof. Jose Reyes (f2)
    // CS401 Database Management Systems → Dr. Rosa Garcia (f5)
    // CS402 Database Management Lab → Dr. Rosa Garcia (f5)
    await conn.query(`
      INSERT IGNORE INTO schedules (subject_id,faculty_id,room_id,section,day,start_time,end_time) VALUES
        (6,${f2.id},2,'BSCS-3B','Thursday','09:00','12:00'),
        (7,${f5.id},2,'BSIT-4C','Monday','13:00','15:00'),
        (8,${f5.id},6,'BSIT-4C','Wednesday','13:00','16:00')
    `);

    // ── Students (user_id only — no faculty_id column anymore) ──────────────
    const studentData = [
      ['2026001','Juan',  'Dela Cruz', 'Santos', 20,'Male',  'juan.delacruz@ccs.edu',    '09123456789','123 Main St, Manila',        'BSIT','3rd Year','BSIT-3A','Programming,Web Dev',  'Hackathon Club','ICTSO',             '',              '2026-01-10'],
      ['2026002','Maria', 'Reyes',     'Cruz',   19,'Female','maria.reyes@ccs.edu',       '09234567890','456 Oak Ave, Quezon City',   'BSCS','2nd Year','BSCS-2A','Python,Data Analysis','Math Club',     'Honor Society',     '',              '2026-01-10'],
      ['2026003','Pedro', 'Bautista',  'Lopez',  21,'Male',  'pedro.bautista@ccs.edu',    '09345678901','789 Pine Rd, Makati',        'BSIT','4th Year','BSIT-4A','Java,Android Dev',    'Robotics Club', 'ICTSO',             'Late sub x1',   '2026-01-15'],
      ['2026004','Ana',   'Gonzales',  'Flores', 20,'Female','ana.gonzales@ccs.edu',      '09456789012','321 Elm St, Pasig',          'BSCS','3rd Year','BSCS-3A','UI/UX,Figma',         'Design Club',   'ACM',               '',              '2026-01-15'],
      ['2026005','Miguel','Torres',    'Ramos',  22,'Male',  'miguel.torres@ccs.edu',     '09567890123','654 Maple Dr, Taguig',       'BSIT','4th Year','BSIT-4B','Mobile Dev,Flutter',  'Sports Club',   'Basketball Varsity','Tardiness x2',  '2026-02-10'],
      ['2026006','Sofia', 'Villanueva','Tan',    19,'Female','sofia.villanueva@ccs.edu',  '09678901234','987 Cedar Ln, Mandaluyong',  'BSIT','1st Year','BSIT-1A','HTML,CSS',            'Theater Arts',  '',                  '',              '2026-02-10'],
      ['2026007','Luis',  'Fernandez', 'Aquino', 20,'Male',  'luis.fernandez@ccs.edu',    '09789012345','147 Birch Blvd, Marikina',   'BSCS','2nd Year','BSCS-2A','C++,Algorithms',      'Debate Club',   '',                  '',              '2026-02-15'],
      ['2026008','Clara', 'Morales',   'Diaz',   21,'Female','clara.morales@ccs.edu',     '09890123456','258 Walnut St, Caloocan',    'BSIT','3rd Year','BSIT-3A','React,Node.js',       'Web Dev Club',  'ICTSO',             '',              '2026-02-15'],
      ['2026009','Marco', 'Castillo',  'Rivera', 22,'Male',  'marco.castillo@ccs.edu',    '09901234567','369 Spruce Ave, Valenzuela', 'BSIT','4th Year','BSIT-4A','Cybersecurity,Networking','CTF Team', 'ISACA Student',     '',              '2026-03-01'],
      ['2026010','Lea',   'Pascual',   'Navarro',19,'Female','lea.pascual@ccs.edu',       '09012345678','741 Ash Ct, Malabon',        'BSCS','1st Year','BSCS-1A','Scratch,Python Basics','Chess Club',  '',                  '',              '2026-03-01'],
    ];

    for (const [sid, fn, ln, mn, age, gender, email, phone, addr, prog, yr, sec, skills, act, aff, vio, date] of studentData) {
      const userId = await uid(email);
      await conn.query(
        `INSERT IGNORE INTO students
          (user_id,student_id,first_name,last_name,middle_name,age,gender,email,phone,address,
           program,year_level,section,skills,activities,affiliations,violations,added_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [userId, sid, fn, ln, mn, age, gender, email, phone, addr, prog, yr, sec, skills, act, aff, vio, date]
      );
    }

    // ── student_faculty — many-to-many assignments ─────────────────────────
    // Fetch student row IDs and faculty user IDs for junction inserts
    const getStuId = async (studentCode) => {
      const [[row]] = await conn.query('SELECT id FROM students WHERE student_id = ?', [studentCode]);
      return row?.id;
    };
    const getFacUserId = async (email) => {
      const [[row]] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
      return row?.id;
    };

    // Each student gets 2–3 faculty assigned (demonstrating many-to-many)
    const assignments = [
      // [student_code,   faculty_email]
      ['2026001', 'm.santos@ccs.edu'],
      ['2026001', 'j.reyes@ccs.edu'],
      ['2026002', 'j.reyes@ccs.edu'],
      ['2026002', 'a.lim@ccs.edu'],
      ['2026003', 'r.garcia@ccs.edu'],
      ['2026003', 'm.santos@ccs.edu'],
      ['2026003', 'c.mendoza@ccs.edu'],
      ['2026004', 'j.reyes@ccs.edu'],
      ['2026004', 'a.lim@ccs.edu'],
      ['2026005', 'r.garcia@ccs.edu'],
      ['2026005', 'c.mendoza@ccs.edu'],
      ['2026006', 'm.santos@ccs.edu'],
      ['2026006', 'a.lim@ccs.edu'],
      ['2026007', 'j.reyes@ccs.edu'],
      ['2026007', 'c.mendoza@ccs.edu'],
      ['2026008', 'm.santos@ccs.edu'],
      ['2026008', 'a.lim@ccs.edu'],
      ['2026008', 'r.garcia@ccs.edu'],
      ['2026009', 'c.mendoza@ccs.edu'],
      ['2026009', 'j.reyes@ccs.edu'],
      ['2026010', 'm.santos@ccs.edu'],
      ['2026010', 'r.garcia@ccs.edu'],
    ];

    for (const [stuCode, facEmail] of assignments) {
      const stuId = await getStuId(stuCode);
      const facUid = await getFacUserId(facEmail);
      if (stuId && facUid) {
        await conn.query(
          'INSERT IGNORE INTO student_faculty (student_id, faculty_id) VALUES (?, ?)',
          [stuId, facUid]
        );
      }
    }

    // ── Enrollments ────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO enrollments (student_id, schedule_id) VALUES
        (1,3),(1,4),(1,5),
        (2,2),(2,3),
        (3,7),(3,8),(3,10),
        (4,6),(4,7),
        (5,7),(5,8),(5,10),
        (6,1),
        (7,2),(7,3),
        (8,4),(8,5),
        (9,7),(9,9),
        (10,1),(10,2)
    `);

    // ── Research ───────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO research (title,program,year_published,category,evaluation_score) VALUES
        ('AI-Driven Student Performance Prediction','BSIT',2025,'Published',95.50),
        ('Blockchain-Based Academic Records System','BSCS',2025,'Published',91.00),
        ('IoT Smart Campus Monitoring System','BSIT',2024,'Published',88.75),
        ('Machine Learning for Cybersecurity Threat Detection','BSCS',2024,'Published',93.25),
        ('Mobile App for Student Mental Health Monitoring','BSIT',2026,'Ongoing',0.00),
        ('Automated Scheduling System Using Genetic Algorithm','BSIT',2025,'Published',89.50),
        ('Natural Language Processing for Filipino Text','BSCS',2026,'Ongoing',0.00),
        ('Cloud-Based Learning Management System','BSIT',2024,'Published',87.00)
    `);

    await conn.query(`
      INSERT IGNORE INTO research_authors (research_id,author_name,author_type) VALUES
        (1,'Dr. Maria Santos','faculty'),(1,'Juan Dela Cruz','student'),
        (2,'Prof. Jose Reyes','faculty'),(2,'Maria Reyes','student'),
        (3,'Ms. Ana Lim','faculty'),(3,'Pedro Bautista','student'),
        (4,'Mr. Carlos Mendoza','faculty'),(4,'Ana Gonzales','student'),
        (5,'Dr. Maria Santos','faculty'),(5,'Miguel Torres','student'),
        (6,'Dr. Rosa Garcia','faculty'),(6,'Clara Morales','student'),
        (7,'Prof. Jose Reyes','faculty'),(7,'Luis Fernandez','student'),
        (8,'Ms. Ana Lim','faculty'),(8,'Marco Castillo','student')
    `);

    // ── Events ─────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO events (title,type,date,time,venue,faculty,participants,status) VALUES
        ('CCS Tech Summit 2026','Seminar','2026-05-15','09:00 AM','CCS Auditorium','Dr. Maria Santos',200,'Upcoming'),
        ('Intramurals 2026','Sports','2026-05-20','08:00 AM','University Gymnasium','Prof. Jose Reyes',350,'Upcoming'),
        ('Capstone Defense — Batch 2026','Academic','2026-04-25','08:00 AM','CCS AVR','Dr. Rosa Garcia',80,'Upcoming'),
        ('Cybersecurity Awareness Week','Seminar','2026-03-10','10:00 AM','CCS Auditorium','Mr. Carlos Mendoza',120,'Completed'),
        ('Web Dev Hackathon','Competition','2026-02-20','08:00 AM','Computer Laboratory 1','Ms. Ana Lim',60,'Completed'),
        ('Research Colloquium 2025','Academic','2025-11-15','09:00 AM','CCS AVR','Dr. Maria Santos',90,'Completed'),
        ('Freshmen Orientation 2026','Orientation','2026-01-08','08:00 AM','University Gymnasium','Prof. Jose Reyes',400,'Completed'),
        ('Alumni Homecoming Night','Social','2026-03-28','06:00 PM','CCS Covered Court','Dr. Rosa Garcia',250,'Upcoming')
    `);

    // ── Materials ──────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO materials (subject,faculty,type,title,upload_date) VALUES
        ('Data Structures and Algorithms','Prof. Jose Reyes','Lecture Slides','Week 1 - Introduction to DSA','2026-01-13'),
        ('Data Structures and Algorithms','Prof. Jose Reyes','Lecture Slides','Week 2 - Arrays and Linked Lists','2026-01-20'),
        ('Data Structures and Algorithms','Prof. Jose Reyes','Lab Manual','Lab 1 - Implementing Stack in Java','2026-01-22'),
        ('Web Development','Ms. Ana Lim','Lecture Slides','Week 1 - HTML5 & CSS3 Fundamentals','2026-01-14'),
        ('Web Development','Ms. Ana Lim','Reference Material','JavaScript ES6 Cheat Sheet','2026-01-21'),
        ('Web Development','Ms. Ana Lim','Lab Manual','Lab 1 - Building a Responsive Layout','2026-01-23'),
        ('Software Engineering','Prof. Jose Reyes','Lecture Slides','Week 1 - SDLC Overview','2026-01-13'),
        ('Software Engineering','Prof. Jose Reyes','Reference Material','Agile & Scrum Guide','2026-01-20'),
        ('Database Management Systems','Dr. Rosa Garcia','Lecture Slides','Week 1 - Relational Model','2026-01-14'),
        ('Database Management Systems','Dr. Rosa Garcia','Lab Manual','Lab 1 - MySQL Basics','2026-01-23'),
        ('Cybersecurity Fundamentals','Mr. Carlos Mendoza','Lecture Slides','Week 1 - CIA Triad','2026-01-13'),
        ('Cybersecurity Fundamentals','Mr. Carlos Mendoza','Reference Material','OWASP Top 10 2025','2026-02-01'),
        ('Introduction to Computing','Dr. Maria Santos','Lecture Slides','Week 1 - History of Computing','2026-01-13'),
        ('Capstone Project 1','Dr. Maria Santos','Reference Material','Capstone Guidelines AY 2025-2026','2026-01-10')
    `);

    console.log("✅ Sample data seeded successfully!");
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
