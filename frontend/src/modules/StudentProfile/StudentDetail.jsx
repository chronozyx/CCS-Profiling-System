import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StudentDetail.css';
import { api } from '../../api/index.js';
import { useRole } from '../../context/AuthContext.jsx';
import Loader from '../../components/Loader.jsx';
import {
  FaArrowLeft, FaEdit, FaTrash, FaUserGraduate,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaTag, FaUsers,
  FaExclamationTriangle, FaStar, FaBook, FaCheckCircle,
  FaIdCard, FaCalendarAlt, FaLayerGroup, FaGraduationCap,
} from 'react-icons/fa';

const SKILL_COLORS = {
  'Programming':'#3b82f6','Basketball':'#f97316','Web Development':'#8b5cf6',
  'Data Science':'#06b6d4','Volleyball':'#ec4899','Networking':'#10b981',
  'Cybersecurity':'#ef4444','UI/UX Design':'#f59e0b','Swimming':'#0ea5e9',
  'Football':'#84cc16','Mobile Development':'#a855f7',
  'Python':'#3b82f6','Java':'#f97316','JavaScript':'#f59e0b',
  'React':'#06b6d4','Node.js':'#10b981','C++':'#8b5cf6',
  'Flutter':'#0ea5e9','Figma':'#ec4899','HTML':'#f97316','CSS':'#3b82f6',
};
const TYPE_LABEL = { LECTURE:'Lecture', LABORATORY:'Laboratory', PURE_LECTURE:'Pure Lecture' };
const TYPE_CLASS = { LECTURE:'lecture', LABORATORY:'laboratory', PURE_LECTURE:'pure' };

const toUI = r => ({
  id: r.id, student_id: r.student_id,
  firstName: r.first_name, lastName: r.last_name, middleName: r.middle_name || '',
  age: r.age, gender: r.gender, email: r.email,
  phone: r.phone || '', address: r.address || '',
  program: r.program, yearLevel: r.year_level, section: r.section,
  skills:       Array.isArray(r.skills)       ? r.skills       : [],
  activities:   Array.isArray(r.activities)   ? r.activities   : [],
  affiliations: Array.isArray(r.affiliations) ? r.affiliations : [],
  violations:   Array.isArray(r.violations)   ? r.violations   : [],
  addedDate: r.added_date || '',
});

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
}

function SkillPill({ label }) {
  const color = SKILL_COLORS[label] || '#6b7280';
  return <span className="sd-pill" style={{ background: color+'18', color, borderColor: color+'44' }}>{label}</span>;
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="sd-info-row">
      <span className="sd-info-label">{Icon && <Icon size={12} />} {label}</span>
      <span className="sd-info-value">{value || '—'}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, accent }) {
  return (
    <div className={`sd-card${accent ? ' sd-card--accent' : ''}`}>
      <div className="sd-card-header">
        {Icon && <Icon size={14} className="sd-card-icon" />}
        <span>{title}</span>
      </div>
      <div className="sd-card-body">{children}</div>
    </div>
  );
}

// ── Enhanced Student Profile (student role only) ───────────────────────────
function StudentProfileView({ student, enrollments }) {
  const [tab, setTab] = useState('overview');
  const initials = student.firstName[0] + student.lastName[0];

  const tabs = [
    { id: 'overview',  label: 'Overview',  icon: FaUserGraduate },
    { id: 'academic',  label: 'Academic',  icon: FaGraduationCap },
    { id: 'subjects',  label: 'Subjects',  icon: FaBook },
  ];

  return (
    <div className="sp-profile-layout">

      {/* ── LEFT: Profile Sidebar ── */}
      <aside className="sp-sidebar">
        <div className="sp-sidebar-avatar-wrap">
          <div className="sp-sidebar-avatar">{initials}</div>
          <div className="sp-sidebar-glow" />
        </div>

        <div className="sp-sidebar-name">
          {student.firstName} {student.middleName && student.middleName + ' '}{student.lastName}
        </div>
        <div className="sp-sidebar-id"><FaIdCard size={11} /> {student.student_id}</div>

        <div className="sp-sidebar-chips">
          <span className="sp-chip sp-chip--program">{student.program}</span>
          <span className="sp-chip sp-chip--year">{student.yearLevel}</span>
          <span className="sp-chip sp-chip--section">Section {student.section}</span>
        </div>

        {/* Stats */}
        <div className="sp-sidebar-stats">
          <div className="sp-sidebar-stat">
            <span className="sp-sidebar-stat-num">{student.skills.length}</span>
            <span className="sp-sidebar-stat-lbl">Skills</span>
          </div>
          <div className="sp-sidebar-stat">
            <span className="sp-sidebar-stat-num">{student.affiliations.length}</span>
            <span className="sp-sidebar-stat-lbl">Affiliations</span>
          </div>
          <div className="sp-sidebar-stat">
            <span className="sp-sidebar-stat-num">{student.activities.length}</span>
            <span className="sp-sidebar-stat-lbl">Activities</span>
          </div>
          <div className="sp-sidebar-stat">
            <span className="sp-sidebar-stat-num">{enrollments.length}</span>
            <span className="sp-sidebar-stat-lbl">Subjects</span>
          </div>
        </div>

        <div className="sp-sidebar-divider" />

        {/* Contact info */}
        <div className="sp-sidebar-contact">
          <div className="sp-contact-row"><FaEnvelope size={12} /><span>{student.email || '—'}</span></div>
          <div className="sp-contact-row"><FaPhone size={12} /><span>{student.phone || '—'}</span></div>
          <div className="sp-contact-row"><FaMapMarkerAlt size={12} /><span>{student.address || '—'}</span></div>
        </div>

        {/* Skills preview */}
        {student.skills.length > 0 && (
          <>
            <div className="sp-sidebar-divider" />
            <div className="sp-sidebar-section-label">Top Skills</div>
            <div className="sp-sidebar-skills">
              {student.skills.slice(0, 5).map(sk => <SkillPill key={sk} label={sk} />)}
              {student.skills.length > 5 && (
                <span className="sd-pill sd-pill--more">+{student.skills.length - 5}</span>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ── RIGHT: Tabbed Content ── */}
      <div className="sp-main">

        {/* Tab nav */}
        <div className="sp-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`sp-tab${tab === t.id ? ' sp-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {tab === 'overview' && (
          <div className="sp-tab-content">
            <div className="sp-section-grid">

              <SectionCard icon={FaUserGraduate} title="Personal Information">
                <InfoRow label="Age"    value={student.age} />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow icon={FaEnvelope}     label="Email"   value={student.email} />
                <InfoRow icon={FaPhone}        label="Phone"   value={student.phone} />
                <InfoRow icon={FaMapMarkerAlt} label="Address" value={student.address} />
              </SectionCard>

              <SectionCard icon={FaStar} title="Skills">
                {student.skills.length
                  ? <div className="sd-tag-wrap">{student.skills.map(sk => <SkillPill key={sk} label={sk} />)}</div>
                  : <span className="sd-empty">No skills listed</span>}
              </SectionCard>

              <SectionCard icon={FaUsers} title="Affiliations">
                {student.affiliations.length
                  ? <div className="sd-tag-wrap">{student.affiliations.map(a => <span key={a} className="sd-pill sd-pill--blue">{a}</span>)}</div>
                  : <span className="sd-empty">No affiliations</span>}
              </SectionCard>

              <SectionCard icon={FaTag} title="Non-Academic Activities">
                {student.activities.length
                  ? <div className="sd-tag-wrap">{student.activities.map(a => <span key={a} className="sd-pill sd-pill--green">{a}</span>)}</div>
                  : <span className="sd-empty">No activities listed</span>}
              </SectionCard>

            </div>
          </div>
        )}

        {/* ── Academic tab ── */}
        {tab === 'academic' && (
          <div className="sp-tab-content">
            <div className="sp-section-grid">

              <SectionCard icon={FaGraduationCap} title="Academic Information">
                <InfoRow label="Program"    value={student.program} />
                <InfoRow label="Year Level" value={student.yearLevel} />
                <InfoRow label="Section"    value={student.section} />
                <InfoRow icon={FaCalendarAlt} label="Date Enrolled" value={formatDate(student.addedDate)} />
              </SectionCard>

              <div className="sd-card">
                <div className="sd-card-header"><FaLayerGroup size={14} className="sd-card-icon" /><span>Summary</span></div>
                <div className="sd-card-body">
                  <div className="sd-summary-grid">
                    <div className="sd-summary-item">
                      <span className="sd-summary-num">{student.skills.length}</span>
                      <span className="sd-summary-lbl">Skills</span>
                    </div>
                    <div className="sd-summary-item">
                      <span className="sd-summary-num">{student.affiliations.length}</span>
                      <span className="sd-summary-lbl">Affiliations</span>
                    </div>
                    <div className="sd-summary-item">
                      <span className="sd-summary-num">{student.activities.length}</span>
                      <span className="sd-summary-lbl">Activities</span>
                    </div>
                    <div className="sd-summary-item">
                      <span className="sd-summary-num">{enrollments.length}</span>
                      <span className="sd-summary-lbl">Subjects</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Subjects tab ── */}
        {tab === 'subjects' && (
          <div className="sp-tab-content">
            <div className="sd-card sd-card--full">
              <div className="sd-card-header">
                <FaBook size={14} className="sd-card-icon" />
                <span>My Enrolled Subjects</span>
                <span className="sd-card-count">{enrollments.length}</span>
              </div>
              <div className="sd-card-body">
                {enrollments.length === 0
                  ? <span className="sd-empty">No subjects enrolled yet.</span>
                  : (
                    <div className="sd-table-wrap">
                      <table className="sd-table">
                        <thead>
                          <tr>
                            <th>Code</th><th>Subject</th><th>Type</th><th>Section</th>
                            <th>Faculty</th><th>Day</th><th>Time</th><th>Room</th><th>Units</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.map(e => (
                            <tr key={e.enrollment_id}>
                              <td><strong className="sd-code">{e.code}</strong></td>
                              <td>{e.title}</td>
                              <td>
                                <span className={`sd-type-badge sd-type-${TYPE_CLASS[e.type] || 'lecture'}`}>
                                  {TYPE_LABEL[e.type] || e.type}
                                </span>
                              </td>
                              <td>{e.section}</td>
                              <td>{e.faculty_title} {e.faculty_first} {e.faculty_last}</td>
                              <td>{e.day}</td>
                              <td className="sd-nowrap">{e.start_time}–{e.end_time}</td>
                              <td>{e.room_code}</td>
                              <td><strong>{e.units}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function StudentDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { isAdmin, isFaculty, isStudent } = useRole();

  const [student,     setStudent]     = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    Promise.all([
      api.getStudentById(id),
      api.getStudentEnrollments(id).catch(() => []),
    ])
      .then(([data, enr]) => {
        if (cancelled) return;
        setStudent(toUI(data));
        setEnrollments(enr);
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this student?')) return;
    try { await api.deleteStudent(id); navigate('/students', { replace: true }); }
    catch (e) { alert('Delete failed: ' + e.message); }
  };

  if (loading) return <div className="sd-container"><Loader full /></div>;
  if (error)   return <div className="sd-container"><div className="sd-error">⚠ {error}</div></div>;
  if (!student) return null;

  const canEdit   = isAdmin || isFaculty;
  const canDelete = isAdmin;
  const showViol  = isAdmin || isFaculty;
  const initials  = student.firstName[0] + student.lastName[0];

  // ── Student role: enhanced profile layout ──────────────────────────────
  if (isStudent) {
    return (
      <div className="sd-container">
        <StudentProfileView student={student} enrollments={enrollments} />
      </div>
    );
  }

  // ── Admin / Faculty: original layout ──────────────────────────────────
  return (
    <div className="sd-container">

      <div className="sd-topbar">
        <button className="sd-btn-back" onClick={() => navigate('/students')}>
          <FaArrowLeft size={13} /> Back
        </button>
        <div className="sd-topbar-actions">
          {canEdit   && <button className="sd-btn-edit"   onClick={() => navigate(`/students/${id}/edit`)}><FaEdit size={13} /> Edit</button>}
          {canDelete && <button className="sd-btn-delete" onClick={handleDelete}><FaTrash size={13} /> Delete</button>}
        </div>
      </div>

      <div className="sd-hero">
        <div className="sd-hero-avatar">{initials}</div>
        <div className="sd-hero-info">
          <h1 className="sd-hero-name">{student.firstName} {student.middleName} {student.lastName}</h1>
          <div className="sd-hero-meta">
            <span className="sd-meta-chip"><FaIdCard size={11} /> {student.student_id}</span>
            <span className="sd-meta-chip">{student.program}</span>
            <span className="sd-meta-chip">{student.yearLevel}</span>
            <span className="sd-meta-chip">Section {student.section}</span>
          </div>
          <div className="sd-hero-skills">
            {student.skills.slice(0, 6).map(sk => <SkillPill key={sk} label={sk} />)}
            {student.skills.length > 6 && <span className="sd-pill sd-pill--more">+{student.skills.length - 6} more</span>}
          </div>
        </div>
        <div className="sd-hero-badge"><span className="sd-program-badge">{student.program}</span></div>
      </div>

      <div className="sd-row2">
        <SectionCard icon={FaUserGraduate} title="Personal Information">
          <InfoRow label="Age"    value={student.age} />
          <InfoRow label="Gender" value={student.gender} />
          <InfoRow icon={FaEnvelope}     label="Email"   value={student.email} />
          <InfoRow icon={FaPhone}        label="Phone"   value={student.phone} />
          <InfoRow icon={FaMapMarkerAlt} label="Address" value={student.address} />
        </SectionCard>
        <SectionCard icon={FaBook} title="Academic History">
          <InfoRow label="Program"    value={student.program} />
          <InfoRow label="Year Level" value={student.yearLevel} />
          <InfoRow label="Section"    value={student.section} />
          <InfoRow icon={FaCalendarAlt} label="Date Added" value={formatDate(student.addedDate)} />
        </SectionCard>
        <SectionCard icon={FaStar} title="Skills">
          {student.skills.length
            ? <div className="sd-tag-wrap">{student.skills.map(sk => <SkillPill key={sk} label={sk} />)}</div>
            : <span className="sd-empty">No skills listed</span>}
        </SectionCard>
        <SectionCard icon={FaUsers} title="Affiliations">
          {student.affiliations.length
            ? <div className="sd-tag-wrap">{student.affiliations.map(a => <span key={a} className="sd-pill sd-pill--blue">{a}</span>)}</div>
            : <span className="sd-empty">No affiliations</span>}
        </SectionCard>
      </div>

      <div className="sd-row3">
        <SectionCard icon={FaTag} title="Non-Academic Activities">
          {student.activities.length
            ? <div className="sd-tag-wrap">{student.activities.map(a => <span key={a} className="sd-pill sd-pill--green">{a}</span>)}</div>
            : <span className="sd-empty">No activities listed</span>}
        </SectionCard>
        {showViol && (
          <SectionCard icon={student.violations.length ? FaExclamationTriangle : FaCheckCircle} title="Violations" accent={student.violations.length > 0}>
            {student.violations.length === 0
              ? <div className="sd-clean"><FaCheckCircle size={16} /><span>No violations on record</span></div>
              : <ul className="sd-violation-list">{student.violations.map((v,i) => <li key={i} className="sd-violation-item"><FaExclamationTriangle size={11} /> {v}</li>)}</ul>}
          </SectionCard>
        )}
        <div className="sd-card sd-card--muted">
          <div className="sd-card-header"><FaLayerGroup size={14} className="sd-card-icon" /><span>Summary</span></div>
          <div className="sd-card-body">
            <div className="sd-summary-grid">
              <div className="sd-summary-item"><span className="sd-summary-num">{student.skills.length}</span><span className="sd-summary-lbl">Skills</span></div>
              <div className="sd-summary-item"><span className="sd-summary-num">{student.affiliations.length}</span><span className="sd-summary-lbl">Affiliations</span></div>
              <div className="sd-summary-item"><span className="sd-summary-num">{student.activities.length}</span><span className="sd-summary-lbl">Activities</span></div>
              <div className="sd-summary-item"><span className="sd-summary-num" style={{color:student.violations.length?'#ef4444':'#16a34a'}}>{student.violations.length}</span><span className="sd-summary-lbl">Violations</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="sd-card sd-card--full">
        <div className="sd-card-header">
          <FaBook size={14} className="sd-card-icon" />
          <span>Enrolled Subjects</span>
          <span className="sd-card-count">{enrollments.length}</span>
        </div>
        <div className="sd-card-body">
          {enrollments.length === 0
            ? <span className="sd-empty">No subjects enrolled yet.</span>
            : (
              <div className="sd-table-wrap">
                <table className="sd-table">
                  <thead><tr><th>Code</th><th>Subject</th><th>Type</th><th>Section</th><th>Faculty</th><th>Day</th><th>Time</th><th>Room</th><th>Units</th></tr></thead>
                  <tbody>
                    {enrollments.map(e => (
                      <tr key={e.enrollment_id}>
                        <td><strong className="sd-code">{e.code}</strong></td>
                        <td>{e.title}</td>
                        <td><span className={`sd-type-badge sd-type-${TYPE_CLASS[e.type]||'lecture'}`}>{TYPE_LABEL[e.type]||e.type}</span></td>
                        <td>{e.section}</td>
                        <td>{e.faculty_title} {e.faculty_first} {e.faculty_last}</td>
                        <td>{e.day}</td>
                        <td className="sd-nowrap">{e.start_time}–{e.end_time}</td>
                        <td>{e.room_code}</td>
                        <td><strong>{e.units}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>

    </div>
  );
}
