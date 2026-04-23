/**
 * FacultyDetail — /faculty/:id
 *
 * Fetches a single faculty member by URL param and renders their full profile.
 * Mirrors the pattern used by StudentDetail.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './FacultyProfile.css';
import { api } from '../../api/index.js';
import { useRole } from '../../context/AuthContext.jsx';
import Loader from '../../components/Loader.jsx';
import {
  FaArrowLeft, FaEdit, FaTrash, FaCheckCircle,
  FaExclamationTriangle, FaBook,
} from 'react-icons/fa';
import { MdPerson } from 'react-icons/md';

const TYPE_LABEL = { LECTURE: 'Lecture', LABORATORY: 'Laboratory', PURE_LECTURE: 'Pure Lecture' };
const TYPE_CLASS = { LECTURE: 'lecture', LABORATORY: 'laboratory', PURE_LECTURE: 'pure' };

const toUI = r => ({
  id: r.id, employee_id: r.employee_id,
  firstName: r.first_name, lastName: r.last_name, title: r.title,
  department: r.department, email: r.email, phone: r.phone || '',
  specialization: r.specialization || '', employmentStatus: r.employment_status,
  minLoad: r.min_load, maxLoad: r.max_load, currentLoad: r.current_load || 0,
});

function loadStatus(cur, min, max) {
  if (cur > max) return 'overload';
  if (cur < min) return 'underload';
  return 'normal';
}

export default function FacultyDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { isAdmin, isFaculty } = useRole();

  const [faculty,  setFaculty]  = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');

    // Faculty role: always load their own profile via /me (JWT-based)
    // so the page always shows the logged-in user's data, not whoever's ID is in the URL
    const profilePromise = isFaculty
      ? api.getMyFacultyProfile()
      : api.getFacultyById(id);

    profilePromise
      .then(data => {
        if (cancelled) return;
        const ui = toUI(data);
        setFaculty(ui);
        // fetch subjects using the actual faculty row id (not the URL param for faculty role)
        return api.getFacultySubjects(ui.id).catch(() => []);
      })
      .then(subs => { if (!cancelled && subs) setSubjects(subs); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id, isFaculty]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this faculty member?')) return;
    try {
      await api.deleteFaculty(id);
      navigate('/faculty', { replace: true });
    } catch (e) { alert('Delete failed: ' + e.message); }
  };

  if (loading) return <div className="faculty-container"><Loader full /></div>;
  if (error)   return <div className="faculty-container"><div style={{ color: '#ef4444', padding: '1rem' }}>⚠ {error}</div></div>;
  if (!faculty) return null;

  const ls = loadStatus(faculty.currentLoad, faculty.minLoad, faculty.maxLoad);

  return (
    <div className="faculty-container">
      <div className="back-bar">
        {!isFaculty && (
          <button className="btn-back" onClick={() => navigate('/faculty')}>
            <FaArrowLeft /> Back to Faculty
          </button>
        )}
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-info" onClick={() => navigate(`/faculty/${id}/edit`)}>
              <FaEdit /> Edit
            </button>
            <button className="btn-danger" onClick={handleDelete}>
              <FaTrash /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="hero-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="hero-avatar">{faculty.firstName[0]}{faculty.lastName[0]}</div>
        <div className="hero-info">
          <h1>{faculty.title} {faculty.firstName} {faculty.lastName}</h1>
          <p>{faculty.employee_id} &bull; {faculty.department} &bull; {faculty.specialization}</p>
          <div style={{ marginTop: '8px' }}>
            <span className={`load-badge ${ls}`}>
              {ls === 'normal'    && <><FaCheckCircle /> Normal Load</>}
              {ls === 'overload'  && <><FaExclamationTriangle /> Overload</>}
              {ls === 'underload' && <><FaExclamationTriangle /> Underload</>}
            </span>
          </div>
        </div>
      </div>

      <div className="faculty-detail-grid">
        <div className="card">
          <div className="card-title"><MdPerson /> Professional Information</div>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Email</span><span className="info-value">{faculty.email}</span></div>
            <div className="info-row"><span className="info-label">Phone</span><span className="info-value">{faculty.phone}</span></div>
            <div className="info-row"><span className="info-label">Status</span><span className="info-value">{faculty.employmentStatus}</span></div>
            <div className="info-row"><span className="info-label">Specialization</span><span className="info-value">{faculty.specialization}</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Teaching Load</div>
          <div className="load-summary-grid">
            <div className="load-summary-item"><div className="lsi-val">{faculty.currentLoad}</div><div className="lsi-lbl">Current</div></div>
            <div className="load-summary-item"><div className="lsi-val">{faculty.minLoad}</div><div className="lsi-lbl">Min</div></div>
            <div className="load-summary-item"><div className="lsi-val">{faculty.maxLoad}</div><div className="lsi-lbl">Max</div></div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div className="progress-track">
              <div
                className={`progress-fill ${ls === 'overload' ? 'progress-fill-red' : ls === 'underload' ? 'progress-fill-yellow' : 'progress-fill-green'}`}
                style={{ width: `${Math.min((faculty.currentLoad / faculty.maxLoad) * 100, 100)}%` }}
              />
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-tertiary)', marginTop: '6px', textAlign: 'right' }}>
              {faculty.currentLoad} / {faculty.maxLoad} units
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-title"><FaBook /> Subjects Handled ({subjects.length})</div>
        {subjects.length === 0
          ? <p style={{ color: 'var(--text-tertiary)', fontSize: '.875rem', margin: '8px 0 0' }}>No subjects assigned yet.</p>
          : (
            <div className="fac-subjects-table-wrap">
              <table className="fac-subjects-table">
                <thead>
                  <tr>
                    <th>Code</th><th>Subject</th><th>Type</th>
                    <th>Section</th><th>Day</th><th>Time</th>
                    <th>Room</th><th>Enrolled</th><th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s, i) => (
                    <tr key={i}>
                      <td><strong>{s.code}</strong></td>
                      <td>{s.title}</td>
                      <td>
                        <span className={`fac-type-badge fac-type-${TYPE_CLASS[s.type] || 'lecture'}`}>
                          {TYPE_LABEL[s.type] || s.type}
                        </span>
                      </td>
                      <td>{s.section}</td>
                      <td>{s.day}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{s.start_time} – {s.end_time}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{s.room_code}</span>
                          <small style={{ color: 'var(--text-tertiary)', fontSize: '.72rem' }}>{s.room_name}</small>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          color: s.enrolled >= s.capacity ? '#ef4444' : s.enrolled >= s.capacity * 0.9 ? '#d97706' : '#16a34a',
                          fontWeight: 700,
                        }}>
                          {s.enrolled}/{s.capacity}
                        </span>
                      </td>
                      <td><strong>{s.units}</strong></td>
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
