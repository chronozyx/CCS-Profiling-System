import { useState } from 'react';
import { api } from '../../api/index.js';
import { buildPdf } from '../../utils/pdfBuilder.js';
import { FaFilePdf, FaUserGraduate } from 'react-icons/fa';
import './Reports.css';

const TYPE_LABEL = { LECTURE: 'Lecture', LABORATORY: 'Laboratory', PURE_LECTURE: 'Pure Lecture' };

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function generateMyReport() {
  // Student role: getStudents() returns only their own record
  const res     = await api.getStudents({ page: 1, limit: 1 });
  const profile = res.data?.[0];
  if (!profile) throw new Error('Student profile not found.');

  const enrollments = await api.getStudentEnrollments(profile.id);

  const fullName = `${profile.first_name}${profile.middle_name ? ' ' + profile.middle_name : ''} ${profile.last_name}`;

  // ── Info block between header and table ───────────────────────────────────
  const extraHeaderFn = (doc, ty, margin, pageW) => {
    ty += 6;

    // Section title
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(0, 0, 0);
    doc.text('STUDENT INFORMATION', margin, ty);

    ty += 5;
    doc.setFontSize(8);

    const col1X = margin;
    const col2X = pageW / 2;
    const rowH  = 5;

    const left = [
      ['Full Name',   fullName],
      ['Student ID',  profile.student_id],
      ['Gender',      profile.gender],
      ['Age',         String(profile.age)],
      ['Email',       profile.email],
      ['Phone',       profile.phone || '—'],
      ['Address',     profile.address || '—'],
    ];
    const right = [
      ['Program',     profile.program],
      ['Year Level',  profile.year_level],
      ['Section',     profile.section],
      ['Date Enrolled', formatDate(profile.added_date)],
      ['Skills',      (profile.skills?.join(', ') || '—')],
      ['Affiliations',(profile.affiliations?.join(', ') || '—')],
      ['Activities',  (profile.activities?.join(', ') || '—')],
    ];

    left.forEach(([label, value], i) => {
      const y = ty + i * rowH;
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, col1X, y);
      doc.setFont('helvetica', 'normal');
      // truncate long values
      const maxW = (pageW / 2) - margin - 36;
      const truncated = doc.splitTextToSize(value, maxW)[0] || value;
      doc.text(truncated, col1X + 34, y);
    });

    right.forEach(([label, value], i) => {
      const y = ty + i * rowH;
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, col2X, y);
      doc.setFont('helvetica', 'normal');
      const maxW = (pageW / 2) - margin - 38;
      const truncated = doc.splitTextToSize(value, maxW)[0] || value;
      doc.text(truncated, col2X + 36, y);
    });

    ty += Math.max(left.length, right.length) * rowH + 4;

    // thin separator before table
    doc.setDrawColor(180).setLineWidth(0.3);
    doc.line(margin, ty, pageW - margin, ty);

    ty += 3;
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(0, 0, 0);
    doc.text('ENROLLED SUBJECTS', margin, ty);

    return ty;
  };

  // ── Table ─────────────────────────────────────────────────────────────────
  const cols = ['#', 'Code', 'Subject Title', 'Type', 'Section', 'Faculty', 'Day', 'Time', 'Room', 'Units'];
  const rows = enrollments.map((e, i) => [
    i + 1,
    e.code,
    e.title,
    TYPE_LABEL[e.type] || e.type,
    e.section,
    `${e.faculty_title || ''} ${e.faculty_first || ''} ${e.faculty_last || ''}`.trim(),
    e.day,
    `${e.start_time}–${e.end_time}`,
    e.room_code || '—',
    e.units,
  ]);

  await buildPdf(
    'Student Academic Report',
    `${fullName}  |  ${profile.program} – ${profile.year_level}  |  Academic Year 2025–2026`,
    cols,
    rows,
    `student_report_${profile.student_id}_${Date.now()}.pdf`,
    extraHeaderFn
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function StudentReport() {
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
          <p className="rpt-subtitle">Download your official academic report as PDF</p>
        </div>
        <div className="rpt-header-badge" style={{ borderColor: 'rgba(16,185,129,.3)', color: '#10b981', background: 'rgba(16,185,129,.08)' }}>
          <FaUserGraduate size={16} /> Student
        </div>
      </div>

      <div className="rpt-cards">
        <div className="rpt-card">
          <div className="rpt-card-icon" style={{ background: '#f0fdf4', color: '#10b981' }}>
            <FaUserGraduate size={28} />
          </div>
          <div className="rpt-card-info">
            <h3>Academic Report</h3>
            <p>
              Includes your full name, student ID, personal details, academic information
              (program, year level, section), skills, affiliations, and a complete list
              of your enrolled subjects with schedule details.
            </p>
          </div>
          <button
            className="rpt-btn"
            onClick={handleGenerate}
            disabled={loading}
            style={{ borderColor: '#10b981', color: '#10b981' }}
          >
            {loading ? 'Generating…' : <><FaFilePdf size={13} /> Download PDF</>}
          </button>
        </div>
      </div>
    </div>
  );
}
