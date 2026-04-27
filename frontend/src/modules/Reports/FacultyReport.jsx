import { useState } from 'react';
import { api } from '../../api/index.js';
import { buildPdf } from '../../utils/pdfBuilder.js';
import { FaFilePdf, FaChalkboardTeacher } from 'react-icons/fa';
import './Reports.css';

const TYPE_LABEL = { LECTURE: 'Lecture', LABORATORY: 'Laboratory', PURE_LECTURE: 'Pure Lecture' };

async function generateMyReport() {
  // 1. Get own profile
  const profile  = await api.getMyFacultyProfile();
  // 2. Get subjects taught
  const subjects = await api.getFacultySubjects(profile.id);

  const fullName = `${profile.title} ${profile.first_name} ${profile.last_name}`;

  // ── Extra info block injected between header and table ──────────────────
  const extraHeaderFn = (doc, ty, margin, pageW) => {
    ty += 6;
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(0, 0, 0);
    doc.text('FACULTY INFORMATION', margin, ty);

    ty += 5;
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(40, 40, 40);

    const col1X = margin;
    const col2X = pageW / 2;

    const left = [
      ['Name',           fullName],
      ['Employee ID',    profile.employee_id],
      ['Department',     profile.department],
      ['Specialization', profile.specialization || '—'],
    ];
    const right = [
      ['Employment Status', profile.employment_status],
      ['Min Load',          `${profile.min_load} units`],
      ['Max Load',          `${profile.max_load} units`],
      ['Current Load',      `${profile.current_load} / ${profile.max_load} units`],
    ];

    const rowH = 5;
    left.forEach(([label, value], i) => {
      const y = ty + i * rowH;
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, col1X, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, col1X + 32, y);
    });
    right.forEach(([label, value], i) => {
      const y = ty + i * rowH;
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, col2X, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, col2X + 38, y);
    });

    ty += left.length * rowH + 4;

    // thin separator
    doc.setDrawColor(180).setLineWidth(0.3);
    doc.line(margin, ty, pageW - margin, ty);

    return ty;
  };

  // ── Table rows ────────────────────────────────────────────────────────────
  const cols = ['#', 'Code', 'Subject Title', 'Type', 'Section', 'Day', 'Time', 'Room', 'Enrolled', 'Units'];
  const rows = subjects.map((s, i) => [
    i + 1,
    s.code,
    s.title,
    TYPE_LABEL[s.type] || s.type,
    s.section,
    s.day,
    `${s.start_time}–${s.end_time}`,
    s.room_code || '—',
    s.enrolled ?? '—',
    s.units,
  ]);

  await buildPdf(
    'Faculty Teaching Load Report',
    `${fullName}  |  Academic Year 2025–2026`,
    cols,
    rows,
    `faculty_report_${profile.employee_id}_${Date.now()}.pdf`,
    extraHeaderFn
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function FacultyReport() {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try { await generateMyReport(); }
    catch (e) { alert('Failed to generate PDF: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="rpt-container">
      <div className="rpt-page-header">
        <div>
          <h1>My Report</h1>
          <p className="rpt-subtitle">Download your official teaching load report as PDF</p>
        </div>
        <div className="rpt-header-badge" style={{ borderColor: 'rgba(59,130,246,.3)', color: '#3b82f6', background: 'rgba(59,130,246,.08)' }}>
          <FaChalkboardTeacher size={16} /> Faculty
        </div>
      </div>

      <div className="rpt-cards">
        <div className="rpt-card">
          <div className="rpt-card-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <FaChalkboardTeacher size={28} />
          </div>
          <div className="rpt-card-info">
            <h3>Teaching Load Report</h3>
            <p>
              Includes your name, employee ID, department, specialization, employment status,
              teaching load summary, and a full list of subjects you handle with schedule details.
            </p>
          </div>
          <button
            className="rpt-btn"
            onClick={handleGenerate}
            disabled={loading}
            style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
          >
            {loading ? 'Generating…' : <><FaFilePdf size={13} /> Download PDF</>}
          </button>
        </div>
      </div>
    </div>
  );
}
