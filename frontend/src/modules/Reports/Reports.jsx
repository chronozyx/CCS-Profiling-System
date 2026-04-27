import { useState } from 'react';
import { api } from '../../api/index.js';
import { buildPdf } from '../../utils/pdfBuilder.js';
import { FaFilePdf, FaUserGraduate, FaChalkboardTeacher, FaCalendarAlt } from 'react-icons/fa';
import './Reports.css';

// ── Report generators ──────────────────────────────────────────────────────
async function generateStudentReport(filter) {
  let all = [];
  let page = 1;
  while (true) {
    const res = await api.getStudents({ page, limit: 100, ...filter });
    all = all.concat(res.data);
    if (page >= res.pagination.lastPage) break;
    page++;
  }

  const cols = ['#', 'Student ID', 'Full Name', 'Program', 'Year Level', 'Section', 'Gender', 'Email'];
  const rows = all.map((s, i) => [
    i + 1,
    s.student_id,
    `${s.first_name}${s.middle_name ? ' ' + s.middle_name : ''} ${s.last_name}`,
    s.program,
    s.year_level,
    s.section,
    s.gender,
    s.email,
  ]);

  await buildPdf(
    'Student Records Report',
    'Academic Year 2025–2026',
    cols, rows,
    `student_records_${Date.now()}.pdf`
  );
}

async function generateFacultyReport() {
  const data = await api.getFaculty();

  const cols = ['#', 'Employee ID', 'Full Name', 'Department', 'Specialization', 'Status', 'Load', 'Email'];
  const rows = data.map((f, i) => [
    i + 1,
    f.employee_id,
    `${f.title} ${f.first_name} ${f.last_name}`,
    f.department,
    f.specialization || '—',
    f.employment_status,
    `${f.current_load}/${f.max_load}`,
    f.email,
  ]);

  await buildPdf(
    'Faculty Records Report',
    'Academic Year 2025–2026',
    cols, rows,
    `faculty_records_${Date.now()}.pdf`
  );
}

async function generateSubjectReport() {
  const data = await api.getSubjects();
  const TYPE_LABEL = { LECTURE: 'Lecture', LABORATORY: 'Laboratory', PURE_LECTURE: 'Pure Lecture' };

  const cols = ['#', 'Code', 'Title', 'Type', 'Hours', 'Units'];
  const rows = data.map((s, i) => [
    i + 1,
    s.code,
    s.title,
    TYPE_LABEL[s.type] || s.type,
    s.hours,
    s.units,
  ]);

  await buildPdf(
    'Subjects Report',
    'Academic Year 2025–2026',
    cols, rows,
    `subjects_report_${Date.now()}.pdf`
  );
}

// ── Report Card ────────────────────────────────────────────────────────────
function ReportCard({ icon: Icon, title, description, color, onGenerate, loading }) {
  return (
    <div className="rpt-card">
      <div className="rpt-card-icon" style={{ background: color + '18', color }}>
        <Icon size={28} />
      </div>
      <div className="rpt-card-info">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <button className="rpt-btn" onClick={onGenerate} disabled={loading} style={{ borderColor: color, color }}>
        {loading ? 'Generating…' : <><FaFilePdf size={13} /> Download PDF</>}
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Reports() {
  const [loading, setLoading] = useState({});
  const [filterProgram, setFilterProgram] = useState('');
  const [filterYear,    setFilterYear]    = useState('');

  const run = async (key, fn) => {
    setLoading(p => ({ ...p, [key]: true }));
    try { await fn(); }
    catch (e) { alert('Failed to generate PDF: ' + e.message); }
    finally { setLoading(p => ({ ...p, [key]: false })); }
  };

  return (
    <div className="rpt-container">
      <div className="rpt-page-header">
        <div>
          <h1>Report Generation</h1>
          <p className="rpt-subtitle">Generate and download official CCS PDF reports</p>
        </div>
        <div className="rpt-header-badge"><FaFilePdf size={18} /> Admin Only</div>
      </div>

      <div className="rpt-filter-box">
        <span className="rpt-filter-label">Student Report Filters (optional)</span>
        <div className="rpt-filter-row">
          <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)} className="rpt-select">
            <option value="">All Programs</option>
            <option value="BSIT">BSIT</option>
            <option value="BSCS">BSCS</option>
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="rpt-select">
            <option value="">All Year Levels</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>
      </div>

      <div className="rpt-cards">
        <ReportCard
          icon={FaUserGraduate}
          title="Student Records"
          description="Full list of enrolled students with program, year level, section, and contact info."
          color="#f97316"
          loading={loading.students}
          onGenerate={() => run('students', () => generateStudentReport({
            ...(filterProgram ? { program: filterProgram } : {}),
            ...(filterYear    ? { yearLevel: filterYear }  : {}),
          }))}
        />
        <ReportCard
          icon={FaChalkboardTeacher}
          title="Faculty Records"
          description="Complete faculty list with department, specialization, employment status, and load."
          color="#3b82f6"
          loading={loading.faculty}
          onGenerate={() => run('faculty', generateFacultyReport)}
        />
        <ReportCard
          icon={FaCalendarAlt}
          title="Subjects List"
          description="All registered subjects with code, title, type, hours, and units."
          color="#10b981"
          loading={loading.subjects}
          onGenerate={() => run('subjects', generateSubjectReport)}
        />
      </div>
    </div>
  );
}
