-- CCS Profiling System — MySQL Schema
USE defaultdb;

-- ── Users ──────────────────────────────────────────
-- Central auth table; role drives access control
CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  login_id       CHAR(7)      NULL UNIQUE,              -- 7-digit ID for student/faculty login
  name           VARCHAR(150) NOT NULL,
  email          VARCHAR(191) NOT NULL UNIQUE,
  password       VARCHAR(255) NOT NULL,
  plain_password VARCHAR(20)  NULL,
  role           ENUM('admin','faculty','student') NOT NULL DEFAULT 'student',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Students ───────────────────────────────────────
-- user_id → the student's own login account (users.id, role='student')
-- faculty assignments live in student_faculty (many-to-many)
CREATE TABLE IF NOT EXISTS students (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          NULL UNIQUE,   -- FK → users.id (role='student'), NULL if no account yet
  student_id   VARCHAR(50)  NOT NULL UNIQUE,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  middle_name  VARCHAR(100),
  age          INT,
  gender       ENUM('Male','Female','Other') DEFAULT 'Male',
  email        VARCHAR(191) NOT NULL UNIQUE,
  phone        VARCHAR(20),
  address      TEXT,
  program      VARCHAR(20)  NOT NULL,
  year_level   VARCHAR(20)  NOT NULL,
  section      VARCHAR(10)  NOT NULL,
  skills       TEXT,
  activities   TEXT,
  affiliations TEXT,
  violations   TEXT,
  added_date   DATE DEFAULT (CURRENT_DATE),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_user_id (user_id)
);

-- ── student_faculty (junction) ─────────────────────
-- Many-to-many: one student ↔ many faculty, one faculty ↔ many students
CREATE TABLE IF NOT EXISTS student_faculty (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,                     -- FK → students.id
  faculty_id INT NOT NULL,                     -- FK → users.id  (role='faculty')
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_sf_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_sf_faculty FOREIGN KEY (faculty_id) REFERENCES users(id)    ON DELETE CASCADE,

  -- Prevent duplicate assignments
  UNIQUE KEY uq_student_faculty (student_id, faculty_id),

  INDEX idx_sf_student_id (student_id),
  INDEX idx_sf_faculty_id (faculty_id)
);

-- ── Faculty ────────────────────────────────────────
-- user_id → the faculty member's own login account (users.id, role='faculty')
CREATE TABLE IF NOT EXISTS faculty (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NULL UNIQUE,      -- FK → users.id (role='faculty'), NULL if no account yet
  employee_id       VARCHAR(50)  NOT NULL UNIQUE,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  title             VARCHAR(20)  DEFAULT 'Prof.',
  department        VARCHAR(100) NOT NULL,
  email             VARCHAR(191) NOT NULL UNIQUE,
  phone             VARCHAR(20),
  specialization    VARCHAR(200),
  employment_status ENUM('Full-time','Part-time') DEFAULT 'Full-time',
  min_load          INT DEFAULT 15,
  max_load          INT DEFAULT 21,
  current_load      INT DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_faculty_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_faculty_user_id (user_id)
);

-- ── Subjects ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  code  VARCHAR(20)  NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  type  ENUM('LECTURE','LABORATORY','PURE_LECTURE') NOT NULL,
  hours INT NOT NULL,
  units INT NOT NULL
);

-- ── Rooms ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  room_id           VARCHAR(20)  NOT NULL UNIQUE,
  name              VARCHAR(200) NOT NULL,
  type              ENUM('LECTURE_ROOM','LABORATORY_ROOM') NOT NULL,
  building          VARCHAR(100),
  floor             VARCHAR(20),
  capacity          INT NOT NULL,
  current_occupancy INT DEFAULT 0,
  status            ENUM('Available','Occupied') DEFAULT 'Available'
);

-- ── Schedules ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedules (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  faculty_id INT NOT NULL,
  room_id    INT NOT NULL,
  section    VARCHAR(10) NOT NULL,
  day        VARCHAR(20) NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time   VARCHAR(10) NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES faculty(id)  ON DELETE CASCADE,
  FOREIGN KEY (room_id)    REFERENCES rooms(id)     ON DELETE CASCADE
);

-- ── Enrollments ────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  schedule_id INT NOT NULL,
  UNIQUE KEY uq_enrollment (student_id, schedule_id),
  FOREIGN KEY (student_id)  REFERENCES students(id)  ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- ── Research ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS research (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(500) NOT NULL,
  program          VARCHAR(20),
  year_published   INT,
  category         VARCHAR(100),
  evaluation_score DECIMAL(5,2) DEFAULT 0.00,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS research_authors (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  research_id INT NOT NULL,
  author_name VARCHAR(200) NOT NULL,
  author_type ENUM('faculty','student','external') DEFAULT 'faculty',
  FOREIGN KEY (research_id) REFERENCES research(id) ON DELETE CASCADE
);

-- ── Events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(300) NOT NULL,
  type         VARCHAR(50)  NOT NULL,
  date         DATE         NOT NULL,
  time         VARCHAR(20),
  venue        VARCHAR(200),
  faculty      VARCHAR(200),
  participants INT DEFAULT 0,
  status       VARCHAR(50)  DEFAULT 'Upcoming',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Audit Logs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NULL,                        -- NULL for unauthenticated requests
  role       VARCHAR(20)  NULL,
  method     VARCHAR(10)  NOT NULL,
  endpoint   VARCHAR(255) NOT NULL,
  status     ENUM('allowed','denied','error') NOT NULL,
  http_code  SMALLINT     NOT NULL,
  ip         VARCHAR(45)  NOT NULL,
  user_agent VARCHAR(300) NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_audit_user_id   (user_id),
  INDEX idx_audit_created   (created_at),
  INDEX idx_audit_status    (status),
  INDEX idx_audit_endpoint  (endpoint(100))
);

-- ── Instructional Materials ────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  subject     VARCHAR(200) NOT NULL,
  faculty     VARCHAR(200),
  type        VARCHAR(100) NOT NULL,
  title       VARCHAR(300) NOT NULL,
  upload_date DATE DEFAULT (CURRENT_DATE),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
