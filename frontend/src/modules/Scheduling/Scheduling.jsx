import { useState, useEffect, useCallback } from 'react';
import './Scheduling.css';
import { api } from '../../api/index.js';
import {
  FaPlus, FaEdit, FaTrash, FaTimes, FaSync, FaCalendarAlt, FaBook,
} from 'react-icons/fa';

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TYPES = ['LECTURE','LABORATORY','PURE_LECTURE'];
const TYPE_LABEL = { LECTURE:'Lecture', LABORATORY:'Laboratory', PURE_LECTURE:'Pure Lecture' };
const TYPE_CLASS = { LECTURE:'lecture', LABORATORY:'laboratory', PURE_LECTURE:'pure' };

const EMPTY_SCHED = { subject_id:'', faculty_id:'', room_id:'', section:'', day:'Monday', start_time:'07:30', end_time:'09:30' };
const EMPTY_SUBJ  = { code:'', title:'', type:'LECTURE', hours:2, units:2 };

function capStatus(enrolled, capacity) {
  const pct = (enrolled / capacity) * 100;
  if (pct > 100) return 'overcapacity';
  if (pct >= 90)  return 'near-full';
  return 'available';
}

// ── Schedule Modal ──────────────────────────────────────────────────────────
function ScheduleModal({ mode, form, setForm, subjects, faculty, rooms, onSubmit, onClose, saving }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="sch-overlay" onClick={onClose}>
      <div className="sch-modal" onClick={e => e.stopPropagation()}>
        <div className="sch-modal-header">
          <h2>{mode === 'create' ? 'Add Schedule' : 'Edit Schedule'}</h2>
          <button className="sch-modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={onSubmit} className="sch-form">
          <div className="sch-form-row">
            <div className="sch-form-group">
              <label>Subject *</label>
              <select required value={form.subject_id} onChange={e => f('subject_id', e.target.value)}>
                <option value="">— Select Subject —</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.title} ({TYPE_LABEL[s.type]})
                  </option>
                ))}
              </select>
            </div>
            <div className="sch-form-group">
              <label>Faculty *</label>
              <select required value={form.faculty_id} onChange={e => f('faculty_id', e.target.value)}>
                <option value="">— Select Faculty —</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.title} {f.first_name} {f.last_name} — {f.department}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="sch-form-row">
            <div className="sch-form-group">
              <label>Room *</label>
              <select required value={form.room_id} onChange={e => f('room_id', e.target.value)}>
                <option value="">— Select Room —</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.room_id} — {r.name} (cap: {r.capacity})
                  </option>
                ))}
              </select>
            </div>
            <div className="sch-form-group">
              <label>Section *</label>
              <input required value={form.section} onChange={e => f('section', e.target.value)} placeholder="e.g. BSIT-3A" />
            </div>
          </div>
          <div className="sch-form-row">
            <div className="sch-form-group">
              <label>Day *</label>
              <select required value={form.day} onChange={e => f('day', e.target.value)}>
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="sch-form-group">
              <label>Start Time *</label>
              <input required type="time" value={form.start_time} onChange={e => f('start_time', e.target.value)} />
            </div>
            <div className="sch-form-group">
              <label>End Time *</label>
              <input required type="time" value={form.end_time} onChange={e => f('end_time', e.target.value)} />
            </div>
          </div>
          <div className="sch-form-actions">
            <button type="button" className="sch-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="sch-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Add Schedule' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Subject Modal ───────────────────────────────────────────────────────────
function SubjectModal({ mode, form, setForm, onSubmit, onClose, saving }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="sch-overlay" onClick={onClose}>
      <div className="sch-modal sch-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="sch-modal-header">
          <h2>{mode === 'create' ? 'Add Subject' : 'Edit Subject'}</h2>
          <button className="sch-modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={onSubmit} className="sch-form">
          <div className="sch-form-row">
            <div className="sch-form-group">
              <label>Code *</label>
              <input required value={form.code} onChange={e => f('code', e.target.value)} placeholder="e.g. IT301" />
            </div>
            <div className="sch-form-group">
              <label>Type *</label>
              <select value={form.type} onChange={e => f('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
            </div>
          </div>
          <div className="sch-form-group">
            <label>Title *</label>
            <input required value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. Data Structures and Algorithms" />
          </div>
          <div className="sch-form-row">
            <div className="sch-form-group">
              <label>Hours</label>
              <input type="number" min="1" max="10" value={form.hours} onChange={e => f('hours', +e.target.value)} />
            </div>
            <div className="sch-form-group">
              <label>Units</label>
              <input type="number" min="1" max="10" value={form.units} onChange={e => f('units', +e.target.value)} />
            </div>
          </div>
          <div className="sch-form-actions">
            <button type="button" className="sch-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="sch-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Add Subject' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function Scheduling() {
  const [schedules, setSchedules] = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [faculty,   setFaculty]   = useState([]);
  const [rooms,     setRooms]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [tab,       setTab]       = useState('schedules'); // 'schedules' | 'subjects'

  // Schedule modal
  const [schedModal,  setSchedModal]  = useState(false);
  const [schedMode,   setSchedMode]   = useState('create');
  const [schedForm,   setSchedForm]   = useState({ ...EMPTY_SCHED });

  // Subject modal
  const [subjModal,   setSubjModal]   = useState(false);
  const [subjMode,    setSubjMode]    = useState('create');
  const [subjForm,    setSubjForm]    = useState({ ...EMPTY_SUBJ });

  const loadAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [sc, su, fa, ro] = await Promise.all([
        api.getSchedules(),
        api.getSubjects(),
        api.getFaculty(),
        api.getRooms(),
      ]);
      setSchedules(sc);
      setSubjects(su);
      setFaculty(fa);
      setRooms(ro);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Schedule handlers ──
  const openCreateSched = () => { setSchedForm({ ...EMPTY_SCHED }); setSchedMode('create'); setSchedModal(true); };
  const openEditSched   = s  => {
    setSchedForm({
      id: s.id,
      subject_id: String(s.subject_id || ''),
      faculty_id: String(s.faculty_id || ''),
      room_id:    String(s.room_id    || ''),
      section:    s.section,
      day:        s.day,
      start_time: s.start_time,
      end_time:   s.end_time,
    });
    setSchedMode('edit'); setSchedModal(true);
  };

  const handleSchedSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (schedMode === 'create') {
        await api.createSchedule(schedForm);
      } else {
        await api.updateSchedule(schedForm.id, schedForm);
      }
      setSchedModal(false);
      await loadAll();
    } catch (e) { alert('Failed: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDeleteSched = async id => {
    if (!window.confirm('Delete this schedule?')) return;
    try { await api.deleteSchedule(id); setSchedules(prev => prev.filter(s => s.id !== id)); }
    catch (e) { alert('Delete failed: ' + e.message); }
  };

  // ── Subject handlers ──
  const openCreateSubj = () => { setSubjForm({ ...EMPTY_SUBJ }); setSubjMode('create'); setSubjModal(true); };
  const openEditSubj   = s  => { setSubjForm({ ...s }); setSubjMode('edit'); setSubjModal(true); };

  const handleSubjSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (subjMode === 'create') {
        const created = await api.createSubject(subjForm);
        setSubjects(prev => [...prev, created]);
      } else {
        const updated = await api.updateSubject(subjForm.id, subjForm);
        setSubjects(prev => prev.map(s => s.id === subjForm.id ? updated : s));
      }
      setSubjModal(false);
    } catch (e) { alert('Failed: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDeleteSubj = async id => {
    if (!window.confirm('Delete this subject? This will also remove linked schedules.')) return;
    try { await api.deleteSubject(id); setSubjects(prev => prev.filter(s => s.id !== id)); }
    catch (e) { alert('Delete failed: ' + e.message); }
  };

  return (
    <div className="scheduling-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Scheduling</h1>
          <p>{schedules.length} schedule{schedules.length !== 1 ? 's' : ''} this semester</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="sch-btn-secondary" onClick={loadAll} title="Refresh"><FaSync /></button>
          {tab === 'schedules'
            ? <button className="sch-btn-primary" onClick={openCreateSched}><FaPlus /> Add Schedule</button>
            : <button className="sch-btn-primary" onClick={openCreateSubj}><FaPlus /> Add Subject</button>}
        </div>
      </div>

      {error && <div className="sch-error">⚠ {error}</div>}

      {/* Subject type legend */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div className="card-title"><FaCalendarAlt /> Subject Time Types</div>
        <div className="time-types-grid">
          <div className="time-type-tile"><div className="tt-label">Lecture</div><div className="tt-desc">2 hours = 2 units</div></div>
          <div className="time-type-tile"><div className="tt-label">Laboratory</div><div className="tt-desc">3 hours = 1 unit</div></div>
          <div className="time-type-tile"><div className="tt-label">Pure Lecture</div><div className="tt-desc">3 hours = 3 units</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sch-tabs">
        <button className={tab === 'schedules' ? 'active' : ''} onClick={() => setTab('schedules')}>
          <FaCalendarAlt /> Schedules
        </button>
        <button className={tab === 'subjects' ? 'active' : ''} onClick={() => setTab('subjects')}>
          <FaBook /> Subjects
        </button>
      </div>

      {loading && <div className="sch-loading">Loading…</div>}

      {/* ── Schedules Table — grouped by subject ── */}
      {!loading && tab === 'schedules' && (
        <div className="data-table-wrap">
          {schedules.length === 0 ? (
            <div className="sch-empty" style={{padding:'2rem',textAlign:'center'}}>No schedules yet. Click "Add Schedule" to create one.</div>
          ) : (() => {
            // Group by subject_code
            const groups = schedules.reduce((acc, s) => {
              const key = s.subject_code;
              if (!acc[key]) acc[key] = { code: s.subject_code, title: s.subject_title, type: s.subject_type, units: s.units, rows: [] };
              acc[key].rows.push(s);
              return acc;
            }, {});

            return (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th><th>Subject</th><th>Type</th><th>Section</th>
                    <th>Faculty</th><th>Room</th><th>Capacity</th><th>Day</th><th>Time</th><th>Units</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(groups).map(group => (
                    group.rows.map((s, i) => {
                      const cs = capStatus(s.enrolled, s.capacity);
                      const isFirst = i === 0;
                      const rowSpan = group.rows.length;
                      return (
                        <tr key={s.id} className={isFirst && rowSpan > 1 ? 'sch-group-first' : ''}>
                          {/* Subject code + title + type + units — only on first row, spans all section rows */}
                          {isFirst && (
                            <>
                              <td rowSpan={rowSpan} className="sch-group-cell">
                                <strong>{group.code}</strong>
                              </td>
                              <td rowSpan={rowSpan} className="sch-group-cell">
                                {group.title}
                              </td>
                              <td rowSpan={rowSpan} className="sch-group-cell">
                                <span className={`type-badge ${TYPE_CLASS[group.type] || 'lecture'}`}>
                                  {TYPE_LABEL[group.type] || group.type}
                                </span>
                              </td>
                            </>
                          )}
                          <td>{s.section}</td>
                          <td>{s.faculty_first} {s.faculty_last}</td>
                          <td>
                            <div className="room-cell">
                              <span>{s.room_code}</span>
                              <small>{s.room_name}</small>
                            </div>
                          </td>
                          <td>
                            <div className="cap-wrap">
                              <span className="cap-nums">{s.enrolled}/{s.capacity}</span>
                              <div className="cap-bar">
                                <div className={`cap-fill ${cs}`} style={{ width:`${Math.min((s.enrolled/s.capacity)*100,100)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td>{s.day}</td>
                          <td style={{ whiteSpace:'nowrap' }}>{s.start_time} – {s.end_time}</td>
                          {isFirst && (
                            <td rowSpan={rowSpan} className="sch-group-cell">
                              <strong>{group.units}</strong>
                            </td>
                          )}
                          <td>
                            <div className="sch-row-actions">
                              <button className="sch-icon-btn sch-icon-btn--edit" onClick={() => openEditSched(s)} title="Edit"><FaEdit /></button>
                              <button className="sch-icon-btn sch-icon-btn--del"  onClick={() => handleDeleteSched(s.id)} title="Delete"><FaTrash /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}

      {/* ── Subjects Table ── */}
      {!loading && tab === 'subjects' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Code</th><th>Title</th><th>Type</th><th>Hours</th><th>Units</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {subjects.length === 0 && (
                <tr><td colSpan={6} className="sch-empty">No subjects yet.</td></tr>
              )}
              {subjects.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.code}</strong></td>
                  <td>{s.title}</td>
                  <td><span className={`type-badge ${TYPE_CLASS[s.type] || 'lecture'}`}>{TYPE_LABEL[s.type] || s.type}</span></td>
                  <td>{s.hours}</td>
                  <td><strong>{s.units}</strong></td>
                  <td>
                    <div className="sch-row-actions">
                      <button className="sch-icon-btn sch-icon-btn--edit" onClick={() => openEditSubj(s)} title="Edit"><FaEdit /></button>
                      <button className="sch-icon-btn sch-icon-btn--del"  onClick={() => handleDeleteSubj(s.id)} title="Delete"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {schedModal && (
        <ScheduleModal
          mode={schedMode} form={schedForm} setForm={setSchedForm}
          subjects={subjects} faculty={faculty} rooms={rooms}
          onSubmit={handleSchedSubmit} onClose={() => setSchedModal(false)} saving={saving}
        />
      )}
      {subjModal && (
        <SubjectModal
          mode={subjMode} form={subjForm} setForm={setSubjForm}
          onSubmit={handleSubjSubmit} onClose={() => setSubjModal(false)} saving={saving}
        />
      )}
    </div>
  );
}
