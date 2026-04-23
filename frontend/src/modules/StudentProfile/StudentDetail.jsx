/**
 * StudentDetail — /students/:id
 *
 * Fetches a single student by URL param, renders their full profile.
 * Replaces the old `selected` state + detail view inside StudentProfile.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StudentProfile.css';
import { api } from '../../api/index.js';
import { useRole } from '../../context/AuthContext.jsx';
import {
  FaArrowLeft, FaEdit, FaTrash, FaUserGraduate,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaTag, FaUsers,
  FaExclamationTriangle, FaStar, FaBook, FaTimes,
} from 'react-icons/fa';

import Loader from '../../components/Loader.jsx';

const SKILL_COLORS = {
  'Programming':'#3b82f6','Basketball':'#f97316','Web Development':'#8b5cf6',
  'Data Science':'#06b6d4','Volleyball':'#ec4899','Networking':'#10b981',
  'Cybersecurity':'#ef4444','UI/UX Design':'#f59e0b','Swimming':'#0ea5e9',
  'Football':'#84cc16','Mobile Development':'#a855f7',
};
const TYPE_LABEL = { LECTURE:'Lecture', LABORATORY:'Laboratory', PURE_LECTURE:'Pure Lecture' };
const TYPE_CLASS = { LECTURE:'lecture', LABORATORY:'laboratory', PURE_LECTURE:'pure' };

const toUI = r => ({
  id:           r.id,
  student_id:   r.student_id,
  firstName:    r.first_name,
  lastName:     r.last_name,
  middleName:   r.middle_name  || '',
  age:          r.age,
  gender:       r.gender,
  email:        r.email,
  phone:        r.phone        || '',
  address:      r.address      || '',
  program:      r.program,
  yearLevel:    r.year_level,
  section:      r.section,
  skills:       Array.isArray(r.skills)       ? r.skills       : [],
  activities:   Array.isArray(r.activities)   ? r.activities   : [],
  affiliations: Array.isArray(r.affiliations) ? r.affiliations : [],
  violations:   Array.isArray(r.violations)   ? r.violations   : [],
  addedDate:    r.added_date   || '',
});

function Badge({ label, color }) {
  const c = color || '#6b7280';
  return <span className="skill-badge" style={{ background:c+'22', color:c, borderColor:c+'55' }}>{label}</span>;
}

export default function StudentDetail() {
  const { id }       = useParams();   // ← the :id from the URL
  const navigate     = useNavigate();
  const { isAdmin, isFaculty, isStudent, role } = useRole();

  const [student,     setStudent]     = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // Fetch student by ID from the URL param
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
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);  // re-runs whenever the :id in the URL changes

  const handleDelete = async () => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await api.deleteStudent(id);
      navigate('/students', { replace: true });
    } catch (e) { alert('Delete failed: ' + e.message); }
  };

  if (loading) return <div className="sp-container"><Loader padded /></div>;
  if (error)   return <div className="sp-container"><div style={{color:'#ef4444',padding:'1rem'}}>⚠ {error}</div></div>;
  if (!student) return null;

  const showViolations = isAdmin || isFaculty;
  const canEdit        = isAdmin || isFaculty;
  const canDelete      = isAdmin;

  return (
    <div className="sp-container">
      {/* Top bar */}
      <div className="sp-detail-topbar">
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {!isStudent && (
            <button className="btn-back" onClick={() => navigate('/students')}>
              <FaArrowLeft /> Back
            </button>
          )}
        </div>
        <div className="sp-detail-actions">
          {canEdit   && (
            <button className="btn-edit-action" onClick={() => navigate(`/students/${id}/edit`)}>
              <FaEdit /> Edit
            </button>
          )}
          {canDelete && (
            <button className="btn-delete-action" onClick={handleDelete}>
              <FaTrash /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Hero banner */}
      <div className="sp-detail-hero">
        <div className="sp-avatar-lg">{student.firstName[0]}{student.lastName[0]}</div>
        <div className="sp-detail-hero-info">
          <h1>{student.firstName} {student.middleName} {student.lastName}</h1>
          <p className="sp-detail-sub">
            {student.student_id} &bull; {student.program} &bull; {student.yearLevel} &bull; Section {student.section}
          </p>
          <div className="sp-detail-badges">
            {student.skills.map(sk => <Badge key={sk} label={sk} color={SKILL_COLORS[sk]} />)}
          </div>
        </div>
      </div>

      {/* Detail cards */}
      <div className="sp-detail-grid">
        <div className="sp-detail-card">
          <h3><FaUserGraduate /> {isStudent ? 'My Profile' : 'Personal Information'}</h3>
          <div className="sp-info-list">
            <div className="sp-info-row"><span>Age</span><strong>{student.age}</strong></div>
            <div className="sp-info-row"><span>Gender</span><strong>{student.gender}</strong></div>
            <div className="sp-info-row"><FaEnvelope /><span>Email</span><strong>{student.email}</strong></div>
            <div className="sp-info-row"><FaPhone /><span>Phone</span><strong>{student.phone}</strong></div>
            <div className="sp-info-row"><FaMapMarkerAlt /><span>Address</span><strong>{student.address}</strong></div>
          </div>
        </div>

        <div className="sp-detail-card">
          <h3><FaUserGraduate /> Academic History</h3>
          <div className="sp-info-list">
            <div className="sp-info-row"><span>Program</span><strong>{student.program}</strong></div>
            <div className="sp-info-row"><span>Year Level</span><strong>{student.yearLevel}</strong></div>
            <div className="sp-info-row"><span>Section</span><strong>{student.section}</strong></div>
            <div className="sp-info-row"><span>Date Added</span><strong>{student.addedDate}</strong></div>
          </div>
        </div>

        <div className="sp-detail-card">
          <h3><FaStar /> {isStudent ? 'My Skills' : 'Skills'}</h3>
          <div className="sp-tag-list">
            {student.skills.length
              ? student.skills.map(sk => <Badge key={sk} label={sk} color={SKILL_COLORS[sk]} />)
              : <span className="sp-empty">No skills listed</span>}
          </div>
        </div>

        <div className="sp-detail-card">
          <h3><FaUsers /> Affiliations</h3>
          <div className="sp-tag-list">
            {student.affiliations.length
              ? student.affiliations.map(a => <span key={a} className="affil-badge">{a}</span>)
              : <span className="sp-empty">None</span>}
          </div>
        </div>

        <div className="sp-detail-card">
          <h3><FaTag /> Non-Academic Activities</h3>
          <div className="sp-tag-list">
            {student.activities.length
              ? student.activities.map(a => <span key={a} className="activity-badge">{a}</span>)
              : <span className="sp-empty">None</span>}
          </div>
        </div>

        {showViolations && (
          <div className="sp-detail-card sp-violations">
            <h3><FaExclamationTriangle /> Violations</h3>
            {student.violations.length
              ? <ul className="violation-list">{student.violations.map((v, i) => <li key={i}>{v}</li>)}</ul>
              : <span className="sp-empty sp-clean">No violations on record ✓</span>}
          </div>
        )}
      </div>

      {/* Enrolled subjects */}
      <div className="sp-detail-card" style={{ marginTop:'1rem' }}>
        <h3><FaBook /> {isStudent ? 'My Enrolled Subjects' : 'Enrolled Subjects'} ({enrollments.length})</h3>
        {enrollments.length === 0
          ? <span className="sp-empty">No subjects enrolled yet.</span>
          : (
            <div className="sp-enroll-table-wrap">
              <table className="sp-enroll-table">
                <thead>
                  <tr><th>Code</th><th>Subject</th><th>Type</th><th>Section</th><th>Faculty</th><th>Day</th><th>Time</th><th>Room</th><th>Units</th></tr>
                </thead>
                <tbody>
                  {enrollments.map(e => (
                    <tr key={e.enrollment_id}>
                      <td><strong>{e.code}</strong></td>
                      <td>{e.title}</td>
                      <td><span className={`sp-type-badge sp-type-${TYPE_CLASS[e.type] || 'lecture'}`}>{TYPE_LABEL[e.type] || e.type}</span></td>
                      <td>{e.section}</td>
                      <td>{e.faculty_title} {e.faculty_first} {e.faculty_last}</td>
                      <td>{e.day}</td>
                      <td style={{ whiteSpace:'nowrap' }}>{e.start_time}–{e.end_time}</td>
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
  );
}
