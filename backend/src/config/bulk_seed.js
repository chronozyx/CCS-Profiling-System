/**
 * bulk_seed.js — adds 1000 students, 50 faculty, 50 subjects, 25 research papers
 * Run: node --experimental-vm-modules src/config/bulk_seed.js
 * Safe to run multiple times (INSERT IGNORE).
 */
import pool from './db.js';
import bcrypt from 'bcryptjs';

// ── helpers ────────────────────────────────────────────────────────────────
const rnd  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad  = (n, len = 7) => String(n).padStart(len, '0');

// ── data pools ─────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  'Juan','Maria','Pedro','Ana','Miguel','Sofia','Luis','Clara','Marco','Lea',
  'Jose','Rosa','Carlos','Elena','Ramon','Luz','Eduardo','Carmen','Roberto','Patricia',
  'Antonio','Isabel','Fernando','Cristina','Manuel','Teresa','Francisco','Pilar','Diego','Marta',
  'Andres','Beatriz','Pablo','Natalia','Sergio','Monica','Adrian','Laura','Daniel','Sandra',
  'Kevin','Jasmine','Ryan','Ashley','Brandon','Stephanie','Tyler','Melissa','Jordan','Nicole',
  'Liam','Emma','Noah','Olivia','Ethan','Ava','Mason','Isabella','Logan','Mia',
  'James','Charlotte','Benjamin','Amelia','Lucas','Harper','Henry','Evelyn','Alexander','Abigail',
  'Michael','Emily','William','Elizabeth','Elijah','Sofia','Oliver','Avery','Jacob','Ella',
  'Jayden','Scarlett','Gabriel','Grace','Samuel','Chloe','David','Victoria','Joseph','Riley',
  'Angelo','Bianca','Rafael','Camille','Dante','Felicia','Emilio','Giselle','Hector','Iris',
];

const LAST_NAMES = [
  'Santos','Reyes','Cruz','Bautista','Gonzales','Torres','Fernandez','Morales','Castillo','Pascual',
  'Garcia','Lopez','Martinez','Rodriguez','Hernandez','Perez','Sanchez','Ramirez','Flores','Rivera',
  'Diaz','Vargas','Mendoza','Ramos','Aquino','Navarro','Tan','Lim','Ong','Sy',
  'Dela Cruz','De Leon','Del Rosario','San Juan','Villa','Villanueva','Aguilar','Salazar','Medina','Rojas',
  'Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Moore','Taylor',
  'Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Garcia','Martinez','Robinson',
  'Clark','Rodriguez','Lewis','Lee','Walker','Hall','Allen','Young','Hernandez','King',
  'Wright','Lopez','Hill','Scott','Green','Adams','Baker','Gonzalez','Nelson','Carter',
  'Buenaventura','Macaraeg','Tolentino','Manalo','Ocampo','Soriano','Enriquez','Delos Santos','Magno','Padilla',
  'Chua','Yap','Go','Tiu','Ang','Dy','Co','Kho','Lao','Que',
];

const MIDDLE_NAMES = [
  'Santos','Reyes','Cruz','Garcia','Lopez','Martinez','Rodriguez','Hernandez','Perez','Sanchez',
  'Dela Cruz','De Leon','Tan','Lim','Ong','Villa','Aguilar','Medina','Rojas','Flores',
];

const PROGRAMS   = ['BSIT','BSCS'];
const YEAR_LEVELS = ['1st Year','2nd Year','3rd Year','4th Year'];
const GENDERS    = ['Male','Female'];
const SKILLS_POOL = [
  'Programming','Web Development','Data Science','Networking','Cybersecurity',
  'UI/UX Design','Mobile Development','Database Management','Cloud Computing','DevOps',
  'Machine Learning','Artificial Intelligence','Blockchain','IoT','Game Development',
  'Python','Java','JavaScript','C++','PHP','React','Node.js','Laravel','Flutter','Swift',
];
const ACTIVITIES_POOL = [
  'Hackathon Club','Robotics Club','Web Dev Club','CTF Team','Chess Club',
  'Basketball Varsity','Volleyball Team','Theater Arts','Debate Club','Math Club',
  'Photography Club','Music Band','Student Council','Red Cross Youth','ROTC',
];
const AFFILIATIONS_POOL = [
  'ICTSO','ACM','ISACA Student','Honor Society','IEEE Student','PSITE','DICT Youth',
  'Google Developer Student Club','Microsoft Learn Student Ambassador','AWS Cloud Club',
];

const DEPARTMENTS  = ['Information Technology','Computer Science'];
const TITLES       = ['Prof.','Dr.','Mr.','Ms.','Engr.'];
const EMP_STATUS   = ['Full-time','Part-time'];
const SPECIALIZATIONS = [
  'Data Science & AI','Software Engineering','Web Development','Cybersecurity',
  'Database Systems','Network Engineering','Mobile Development','Cloud Computing',
  'Human-Computer Interaction','Computer Vision','Natural Language Processing',
  'Embedded Systems','Information Security','Systems Analysis','Game Development',
];

const SUBJECT_PREFIXES = ['IT','CS','IS','GE','MATH','SCI'];
const SUBJECT_TITLES = [
  'Introduction to Computing','Data Structures and Algorithms','Web Development',
  'Software Engineering','Database Management Systems','Cybersecurity Fundamentals',
  'Mobile Application Development','Computer Networks','Operating Systems',
  'Artificial Intelligence','Machine Learning','Cloud Computing',
  'Human-Computer Interaction','Computer Vision','Natural Language Processing',
  'Discrete Mathematics','Calculus for Computing','Statistics and Probability',
  'Technical Writing','Professional Ethics in IT','Capstone Project',
  'Systems Analysis and Design','Object-Oriented Programming','Advanced Database',
  'Network Security','Embedded Systems','Internet of Things','Blockchain Technology',
  'Game Development','Digital Forensics','Information Assurance','IT Project Management',
  'Research Methods in Computing','Data Analytics','Business Intelligence',
  'Compiler Design','Theory of Computation','Parallel Computing','Distributed Systems',
  'Software Testing','Agile Development','DevOps Practices','UI/UX Design',
  'Computer Graphics','Multimedia Systems','E-Commerce Systems','IT Service Management',
  'Emerging Technologies','Thesis Writing 1','Thesis Writing 2',
];
const SUBJECT_TYPES = ['LECTURE','LABORATORY','PURE_LECTURE'];

const RESEARCH_TITLES = [
  'AI-Driven Student Performance Prediction System',
  'Blockchain-Based Academic Records Management',
  'IoT Smart Campus Monitoring and Automation',
  'Machine Learning for Cybersecurity Threat Detection',
  'Mobile App for Student Mental Health Monitoring',
  'Automated Scheduling Using Genetic Algorithm',
  'Natural Language Processing for Filipino Text Analysis',
  'Cloud-Based Learning Management System',
  'Deep Learning for Medical Image Classification',
  'Sentiment Analysis of Social Media Posts in Filipino',
  'Smart Attendance System Using Facial Recognition',
  'Predictive Analytics for Student Dropout Prevention',
  'Augmented Reality for Interactive Learning',
  'Secure Voting System Using Blockchain',
  'Real-Time Traffic Monitoring Using Computer Vision',
  'Chatbot for Academic Advising Using NLP',
  'Energy-Efficient Smart Home Automation System',
  'Fraud Detection in E-Commerce Using Machine Learning',
  'Automated Code Review System Using AI',
  'Sign Language Recognition Using Deep Learning',
  'Personalized Learning Path Recommendation System',
  'Cybersecurity Awareness Training Platform',
  'Digital Preservation of Philippine Cultural Heritage',
  'Crop Disease Detection Using Convolutional Neural Networks',
  'Telemedicine Platform for Remote Healthcare Access',
];
const RESEARCH_CATEGORIES = ['Published','Ongoing','For Review'];

// ── main ───────────────────────────────────────────────────────────────────
async function bulkSeed() {
  const conn = await pool.getConnection();
  try {
    console.log('🌱 Bulk seeding...');

    // Pre-hash a shared password — all bulk users get login_id as plain password
    // but we use a single bcrypt hash for speed (login_id stored as plain_password)
    const sharedHash = await bcrypt.hash('password', 8); // low rounds for speed

    // ── 50 Faculty ──────────────────────────────────────────────────────────
    console.log('  → Inserting 50 faculty...');
    const facultyIds = [];
    for (let i = 1; i <= 50; i++) {
      const fn    = rnd(FIRST_NAMES);
      const ln    = rnd(LAST_NAMES);
      const title = rnd(TITLES);
      const dept  = rnd(DEPARTMENTS);
      const spec  = rnd(SPECIALIZATIONS);
      const emp   = rnd(EMP_STATUS);
      const email = `faculty${i}@ccs.edu`;
      const phone = `09${rndInt(100000000, 999999999)}`;
      const eid   = pad(2000000 + i);
      const loginId = pad(3000000 + i);
      const pw    = loginId;
      const name  = `${title} ${fn} ${ln}`;

      // user account
      await conn.query(
        `INSERT IGNORE INTO users (login_id,name,email,password,plain_password,role)
         VALUES (?,?,?,?,?,'faculty')`,
        [loginId, name, email, sharedHash, pw]
      );
      const [[urow]] = await conn.query('SELECT id FROM users WHERE email=?', [email]);
      if (!urow) continue;

      // faculty profile
      const minLoad = emp === 'Full-time' ? 15 : 9;
      const maxLoad = emp === 'Full-time' ? 21 : 12;
      await conn.query(
        `INSERT IGNORE INTO faculty
          (user_id,employee_id,first_name,last_name,title,department,email,phone,
           specialization,employment_status,min_load,max_load,current_load)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
        [urow.id, eid, fn, ln, title, dept, email, phone, spec, emp, minLoad, maxLoad]
      );
      const [[frow]] = await conn.query('SELECT id FROM faculty WHERE employee_id=?', [eid]);
      if (frow) facultyIds.push(frow.id);
    }
    console.log(`     ✓ ${facultyIds.length} faculty inserted`);

    // ── 50 Subjects ─────────────────────────────────────────────────────────
    console.log('  → Inserting 50 subjects...');
    const subjectIds = [];
    const usedCodes  = new Set();
    let subjectCount = 0;
    for (let i = 0; subjectCount < 50 && i < 200; i++) {
      const prefix = rnd(SUBJECT_PREFIXES);
      const num    = rndInt(100, 499);
      const code   = `${prefix}${num}`;
      if (usedCodes.has(code)) continue;
      usedCodes.add(code);

      const title = SUBJECT_TITLES[subjectCount % SUBJECT_TITLES.length];
      const type  = rnd(SUBJECT_TYPES);
      const hours = type === 'LABORATORY' ? 3 : type === 'PURE_LECTURE' ? 3 : 2;
      const units = type === 'LABORATORY' ? 1 : type === 'PURE_LECTURE' ? 3 : 2;

      await conn.query(
        `INSERT IGNORE INTO subjects (code,title,type,hours,units) VALUES (?,?,?,?,?)`,
        [code, title, type, hours, units]
      );
      const [[srow]] = await conn.query('SELECT id FROM subjects WHERE code=?', [code]);
      if (srow) { subjectIds.push(srow.id); subjectCount++; }
    }
    console.log(`     ✓ ${subjectIds.length} subjects inserted`);

    // ── 1000 Students ───────────────────────────────────────────────────────
    console.log('  → Inserting 1000 students (this may take a moment)...');
    let studentCount = 0;
    for (let i = 1; i <= 1000; i++) {
      const fn      = rnd(FIRST_NAMES);
      const ln      = rnd(LAST_NAMES);
      const mn      = rnd(MIDDLE_NAMES);
      const prog    = rnd(PROGRAMS);
      const yr      = rnd(YEAR_LEVELS);
      const gender  = rnd(GENDERS);
      const age     = rndInt(17, 25);
      const sid     = pad(4000000 + i);       // 7-digit student ID
      const loginId = pad(5000000 + i);
      const email   = `student${i}@ccs.edu`;
      const phone   = `09${rndInt(100000000, 999999999)}`;
      const addr    = `${rndInt(1,999)} ${rnd(LAST_NAMES)} St, Manila`;
      const section = `${prog}-${yr.replace(' Year','').replace('st','').replace('nd','').replace('rd','').replace('th','')}${rnd(['A','B','C'])}`;
      const skills  = [...new Set([rnd(SKILLS_POOL),rnd(SKILLS_POOL),rnd(SKILLS_POOL)])].join(',');
      const acts    = rnd(ACTIVITIES_POOL);
      const affs    = rnd(AFFILIATIONS_POOL);
      const pw      = loginId;

      await conn.query(
        `INSERT IGNORE INTO users (login_id,name,email,password,plain_password,role)
         VALUES (?,?,?,?,?,'student')`,
        [loginId, `${fn} ${ln}`, email, sharedHash, pw]
      );
      const [[urow]] = await conn.query('SELECT id FROM users WHERE email=?', [email]);
      if (!urow) continue;

      await conn.query(
        `INSERT IGNORE INTO students
          (user_id,student_id,first_name,last_name,middle_name,age,gender,
           email,phone,address,program,year_level,section,
           skills,activities,affiliations,violations,added_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'',CURDATE())`,
        [urow.id, sid, fn, ln, mn, age, gender,
         email, phone, addr, prog, yr, section,
         skills, acts, affs]
      );
      studentCount++;
      if (studentCount % 100 === 0) process.stdout.write(`     ${studentCount}/1000\r`);
    }
    console.log(`     ✓ ${studentCount} students inserted          `);

    // ── 25 Research Papers ──────────────────────────────────────────────────
    console.log('  → Inserting 25 research papers...');
    let researchCount = 0;
    for (let i = 0; i < 25; i++) {
      const title    = RESEARCH_TITLES[i];
      const prog     = rnd(PROGRAMS);
      const year     = rndInt(2022, 2026);
      const cat      = rnd(RESEARCH_CATEGORIES);
      const score    = cat === 'Ongoing' ? 0 : parseFloat((rndInt(800, 980) / 10).toFixed(2));

      const [result] = await conn.query(
        `INSERT IGNORE INTO research (title,program,year_published,category,evaluation_score)
         VALUES (?,?,?,?,?)`,
        [title, prog, year, cat, score]
      );
      if (!result.insertId) continue;
      researchCount++;

      // 2 authors per paper
      const facName = `${rnd(FIRST_NAMES)} ${rnd(LAST_NAMES)}`;
      const stuName = `${rnd(FIRST_NAMES)} ${rnd(LAST_NAMES)}`;
      await conn.query(
        `INSERT IGNORE INTO research_authors (research_id,author_name,author_type) VALUES (?,?,'faculty'),(?,?,'student')`,
        [result.insertId, facName, result.insertId, stuName]
      );
    }
    console.log(`     ✓ ${researchCount} research papers inserted`);

    console.log('\n✅ Bulk seed complete!');
  } catch (err) {
    console.error('❌ Bulk seed error:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

bulkSeed();
