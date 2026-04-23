import { useState, useEffect, useCallback, useMemo } from 'react';
import './Instructional.css';
import { api } from '../../api/index.js';
import { useRole } from '../../context/AuthContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../../components/Loader.jsx';
import {
  FaPlus, FaFileAlt, FaEdit, FaBookOpen, FaTrash, FaTimes,
  FaSync, FaChevronDown, FaChevronRight, FaLayerGroup,
} from 'react-icons/fa';

const TYPE_OPTIONS = [
  'Lecture Slides', 'Lab Manual', 'Reference Material',
  'Assignment', 'Exam', 'Syllabus', 'Lesson Plan', 'Other',
];

const TYPE_COLOR = {
  'Lecture Slides':    { bg:'#eff6ff', color:'#3b82f6', border:'#bfdbfe' },
  'Lab Manual':        { bg:'#faf5ff', color:'#7c3aed', border:'#ddd6fe' },
  'Reference Material':{ bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
  'Assignment':        { bg:'#fff7ed', color:'#ea580c', border:'#fed7aa' },
  'Exam':              { bg:'#fef2f2', color:'#ef4444', border:'#fecaca' },
  'Syllabus':          { bg:'#eff6ff', color:'#2563eb', border:'#bfdbfe' },
  'Lesson Plan':       { bg:'#f5f3ff', color:'#7c3aed', border:'#ddd6fe' },
  'Other':             { bg:'#f9fafb', color:'#6b7280', border:'#e5e7eb' },
};

const typeIcon = t => {
  if (t === 'Syllabus' || t === 'Lesson Plan') return <FaFileAlt />;
  if (t === 'Lab Manual') return <FaEdit />;
  return <FaBookOpen />;
};

const EMPTY = { subject: '', faculty: '', type: 'Lecture Slides', title: '', _subjectKey: '' };

export default function Instructional() {
  const { isFaculty } = useRole();
  const { user } = useAuth();
  // Faculty full name as stored in schedules (e.g. "Maria Santos")
  const facultyFullName = isFaculty && user?.name
    ? user.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Engr\.)\s*/i, '').trim()
    : null;
  const [materials,   setMaterials]   = useState([]);
  const [schedules,   setSchedules]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState({ ...EMPTY });
  const [expanded,    setExpanded]    = useState(null); // subject key currently open
  const ff = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mats, scheds] = await Promise.all([
        api.getMaterials(),
        api.getSchedules().catch(() => []),
      ]);
      setMaterials(mats);
      setSchedules(scheds);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Build unified subject list ─────────────────────────────────────────
  // Each entry has: id (title-based), code, title, faculty, section, materials[]
  const subjectMap = useMemo(() => {
    const map = new Map(); // keyed by normalized title (lowercase)

    // 1. Seed from schedules — these are the "official" subjects
    schedules.forEach(s => {
      const normTitle = s.subject_title.toLowerCase().trim();
      if (!map.has(normTitle)) {
        map.set(normTitle, {
          id:       normTitle,
          code:     s.subject_code,
          title:    s.subject_title,
          faculty:  `${s.faculty_first} ${s.faculty_last}`,
          section:  s.section,
          fromSched: true,
          materials: [],
        });
      }
    });

    // 2. Match materials to subjects by title (fuzzy: material.subject may be
    //    "Cybersecurity Fundamentals" OR "IT401 — Cybersecurity Fundamentals")
    materials.forEach(m => {
      const raw = (m.subject || '').trim();

      // Try to extract just the title part if it contains " — "
      const titlePart = raw.includes(' — ') ? raw.split(' — ').slice(1).join(' — ').trim() : raw;
      const normTitle = titlePart.toLowerCase();

      if (map.has(normTitle)) {
        map.get(normTitle).materials.push(m);
      } else {
        // Orphan material — subject not in schedules, create a card for it
        if (!map.has(normTitle)) {
          map.set(normTitle, {
            id:        normTitle,
            code:      null,
            title:     titlePart || raw,
            faculty:   m.faculty || '',
            section:   '',
            fromSched: false,
            materials: [],
          });
        }
        map.get(normTitle).materials.push(m);
      }
    });

    // Sort: scheduled subjects first (by code), then orphans alphabetically
    const all = Array.from(map.values()).sort((a, b) => {
      if (a.fromSched && !b.fromSched) return -1;
      if (!a.fromSched && b.fromSched) return 1;
      return (a.code || a.title).localeCompare(b.code || b.title);
    });

    // Faculty: only show their own subjects
    if (facultyFullName) {
      return all.filter(s =>
        s.faculty.toLowerCase().includes(facultyFullName.toLowerCase())
      );
    }
    return all;
  }, [schedules, materials, facultyFullName]);

  // Dropdown options for the modal — one per unique subject title from schedules
  // Faculty: only their own subjects
  const subjectOptions = useMemo(() => {
    const seen = new Set();
    return schedules
      .filter(s => {
        if (!isFaculty || !facultyFullName) return true;
        const name = `${s.faculty_first} ${s.faculty_last}`.toLowerCase();
        return name.includes(facultyFullName.toLowerCase());
      })
      .reduce((acc, s) => {
        const key = s.subject_title.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          acc.push({
            key,
            code:    s.subject_code,
            title:   s.subject_title,
            faculty: `${s.faculty_first} ${s.faculty_last}`,
            label:   `${s.subject_code} — ${s.subject_title}`,
            subject: s.subject_title,
          });
        }
        return acc;
      }, []);
  }, [schedules, isFaculty, facultyFullName]);

  const handleSubjectChange = (key) => {
    const opt = subjectOptions.find(o => o.key === key);
    if (opt) {
      // Store just the title — matches how existing materials are stored
      setForm(p => ({ ...p, subject: opt.subject, faculty: opt.faculty, _subjectKey: key }));
    } else {
      setForm(p => ({ ...p, subject: '', faculty: '', _subjectKey: '' }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const created = await api.createMaterial({
        subject: form.subject,
        faculty: form.faculty,
        type:    form.type,
        title:   form.title,
      });
      setMaterials(prev => [created, ...prev]);
      setExpanded(form.subject.toLowerCase().trim());
      setShowModal(false);
      setForm({ ...EMPTY });
    } catch (e) { alert('Save failed: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this material?')) return;
    try { await api.deleteMaterial(id); setMaterials(prev => prev.filter(m => m.id !== id)); }
    catch (e) { alert('Delete failed: ' + e.message); }
  };

  const openModal = (subjectId) => {
    if (subjectId) {
      // subjectId is the normalized title key
      const entry = subjectMap.find(s => s.id === subjectId);
      const opt   = entry ? subjectOptions.find(o => o.key === entry.id) : null;
      if (opt) {
        setForm({ ...EMPTY, subject: opt.subject, faculty: opt.faculty, _subjectKey: opt.key });
      } else if (entry) {
        setForm({ ...EMPTY, subject: entry.title, faculty: entry.faculty });
      } else {
        setForm({ ...EMPTY });
      }
    } else {
      setForm({ ...EMPTY });
    }
    setShowModal(true);
  };

  const toggle = (key) => setExpanded(prev => prev === key ? null : key);

  return (
    <div className="instructional-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Instructional Management</h1>
          <p>{subjectMap.length} subject{subjectMap.length !== 1 ? 's' : ''} · {subjectMap.reduce((sum, s) => sum + s.materials.length, 0)} material{subjectMap.reduce((sum, s) => sum + s.materials.length, 0) !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="btn-secondary" onClick={load} title="Refresh"><FaSync /></button>
          <button className="btn-primary" onClick={() => openModal(null)}><FaPlus /> Upload Material</button>
        </div>
      </div>

      {loading && <Loader padded />}

      {!loading && subjectMap.length === 0 && (
        <div className="im-empty">
          <FaLayerGroup size={40} style={{ opacity:.3, marginBottom:'12px' }} />
          <p>No subjects or materials yet.</p>
          <p style={{ fontSize:'.8rem', opacity:.6 }}>Add schedules in Scheduling first, then upload materials here.</p>
        </div>
      )}

      {/* Subject cards */}
      <div className="im-subject-list">
        {subjectMap.map(entry => {
          const open = expanded === entry.id;
          return (
            <div key={entry.id} className={`im-subject-card ${open ? 'open' : ''}`}>
              <div className="im-subject-header" onClick={() => toggle(entry.id)}>
                <div className="im-subject-icon"><FaBookOpen size={18} /></div>
                <div className="im-subject-info">
                  <div className="im-subject-name">
                    {entry.code
                      ? <><span className="im-subject-code">{entry.code}</span> {entry.title}</>
                      : entry.title}
                    {!entry.fromSched && (
                      <span className="im-orphan-badge" title="No schedule found for this subject">no schedule</span>
                    )}
                  </div>
                  {entry.faculty && (
                    <div className="im-subject-meta">
                      {entry.faculty}{entry.section ? ` · ${entry.section}` : ''}
                    </div>
                  )}
                </div>
                <div className="im-subject-right">
                  <span className="im-mat-count">{entry.materials.length} material{entry.materials.length !== 1 ? 's' : ''}</span>
                  <button
                    className="im-upload-btn"
                    onClick={e => { e.stopPropagation(); openModal(entry.id); }}
                    title="Upload material for this subject"
                  >
                    <FaPlus size={11} /> Add
                  </button>
                  {open ? <FaChevronDown size={14} className="im-chevron" /> : <FaChevronRight size={14} className="im-chevron" />}
                </div>
              </div>

              {open && (
                <div className="im-materials">
                  {entry.materials.length === 0 ? (
                    <div className="im-no-materials">
                      No materials uploaded yet.
                      <button className="im-add-first" onClick={() => openModal(entry.id)}>
                        <FaPlus size={10} /> Upload first material
                      </button>
                    </div>
                  ) : (
                    entry.materials.map(m => {
                      const tc = TYPE_COLOR[m.type] || TYPE_COLOR['Other'];
                      return (
                        <div key={m.id} className="im-material-row">
                          <div className="im-mat-icon" style={{ color:tc.color, background:tc.bg, border:`1px solid ${tc.border}` }}>
                            {typeIcon(m.type)}
                          </div>
                          <div className="im-mat-info">
                            <span className="im-mat-title">{m.title}</span>
                            <span className="im-mat-date">{m.upload_date?.slice(0,10)}</span>
                          </div>
                          <span className="im-mat-type" style={{ background:tc.bg, color:tc.color, border:`1px solid ${tc.border}` }}>
                            {m.type}
                          </span>
                          {!isFaculty && (
                          <button className="im-del-btn" onClick={() => handleDelete(m.id)} title="Delete">
                            <FaTrash size={12} />
                          </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Material</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div className="form-group">
                  <label>Title *</label>
                  <input required value={form.title} onChange={e => ff('title', e.target.value)} placeholder="e.g. Week 1 - Introduction" />
                </div>

                <div className="form-group">
                  <label>Subject *</label>
                  {subjectOptions.length > 0 ? (
                    <select required value={form._subjectKey || ''} onChange={e => handleSubjectChange(e.target.value)}>
                      <option value="">— Select Subject —</option>
                      {subjectOptions.map(o => (
                        <option key={o.key} value={o.key}>{o.label} ({o.faculty})</option>
                      ))}
                    </select>
                  ) : (
                    <input required value={form.subject} onChange={e => ff('subject', e.target.value)} placeholder="Type subject name" />
                  )}
                </div>

                <div className="form-group">
                  <label>Faculty</label>
                  <input
                    value={form.faculty}
                    onChange={e => ff('faculty', e.target.value)}
                    placeholder="Auto-filled from subject"
                    readOnly={!!form._subjectKey}
                    style={form._subjectKey ? { background:'var(--bg-tertiary)', color:'var(--text-secondary)' } : {}}
                  />
                </div>

                <div className="form-group">
                  <label>Type *</label>
                  <select value={form.type} onChange={e => ff('type', e.target.value)}>
                    {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Upload'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
