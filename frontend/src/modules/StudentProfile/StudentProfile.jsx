import { useState, useMemo, useEffect, useCallback } from 'react';
import './StudentProfile.css';
import { api } from '../../api/index.js';
import { useAuth, useRole } from '../../context/AuthContext.jsx';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaTh, FaTable, FaTimes, FaUserGraduate,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaTag, FaUsers,
  FaExclamationTriangle, FaStar, FaArrowLeft, FaSync,
  FaShieldAlt, FaChalkboardTeacher, FaUserCircle, FaBook,
} from 'react-icons/fa';

const PROGRAMS    = ['All','BSIT','BSCS'];
const YEAR_LEVELS = ['All','1st Year','2nd Year','3rd Year','4th Year'];
const ALL_SKILLS  = ['All Skills','Programming','Basketball','Web Development',
  'Data Science','Volleyball','Networking','Cybersecurity','UI/UX Design',
  'Swimming','Football','Mobile Development'];
const SKILL_COLORS = {
  'Programming':'#3b82f6','Basketball':'#f97316','Web Development':'#8b5cf6',
  'Data Science':'#06b6d4','Volleyball':'#ec4899','Networking':'#10b981',
  'Cybersecurity':'#ef4444','UI/UX Design':'#f59e0b','Swimming':'#0ea5e9',
  'Football':'#84cc16','Mobile Development':'#a855f7',
};
const EMPTY_FORM = {
  student_id:'', firstName:'', lastName:'', middleName:'', age:'', gender:'Male',
  email:'', phone:'', address:'', program:'BSIT', yearLevel:'1st Year', section:'A',
  skills:[], activities:[], affiliations:[], violations:[],
};

const ROLE_META = {
  admin:   { label: 'Administrator', icon: FaShieldAlt,         color: '#ef4444' },
  faculty: { label: 'Faculty',       icon: FaChalkboardTeacher, color: '#3b82f6' },
  student: { label: 'Student',       icon: FaUserCircle,        color: '#10b981' },
};

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

const toDB = f => ({
  student_id:   f.student_id,
  first_name:   f.firstName,
  last_name:    f.lastName,
  middle_name:  f.middleName,
  age:          Number(f.age),
  gender:       f.gender,
  email:        f.email,
  phone:        f.phone,
  address:      f.address,
  program:      f.program,
  year_level:   f.yearLevel,
  section:      f.section,
  skills:       f.skills,
  activities:   f.activities,
  affiliations: f.affiliations,
  violations:   f.violations,
});

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || ROLE_META.student;
  const Icon = meta.icon;
  return (
    <span className="role-badge" style={{ '--badge-color': meta.color }}>
      <Icon size={11} /> {meta.label}
    </span>
  );
}

function Badge({ label, color }) {
  const c = color || '#6b7280';
  return <span className="skill-badge" style={{ background:c+'22', color:c, borderColor:c+'55' }}>{label}</span>;
}

function TagInput({ label, values, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => { const v=input.trim(); if(v&&!values.includes(v)) onChange([...values,v]); setInput(''); };
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="tag-input-wrap">
        {values.map(v=>(
          <span key={v} className="tag-chip">{v}
            <button type="button" onClick={()=>onChange(values.filter(x=>x!==v))}><FaTimes size={9}/></button>
          </span>
        ))}
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add();}}} placeholder={placeholder}/>
      </div>
      <button type="button" className="tag-add-btn" onClick={add}>+ Add</button>
    </div>
  );
}

const TYPE_LABEL = { LECTURE:'Lecture', LABORATORY:'Laboratory', PURE_LECTURE:'Pure Lecture' };
const TYPE_CLASS = { LECTURE:'lecture', LABORATORY:'laboratory', PURE_LECTURE:'pure' };

function StudentModal({ mode, form, setForm, schedules, onSubmit, onClose, saving }) {
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const toggleSchedule = (id) => {
    const ids = form.schedule_ids || [];
    setForm(p => ({
      ...p,
      schedule_ids: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id],
    }));
  };
  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal" onClick={e=>e.stopPropagation()}>
        <div className="sp-modal-header">
          <h2>{mode==='create'?'Add New Student':'Edit Student'}</h2>
          <button className="sp-modal-close" onClick={onClose}><FaTimes/></button>
        </div>
        <form className="sp-form" onSubmit={onSubmit}>
          <div className="sp-form-section-title">Personal Information</div>
          <div className="sp-form-row">
            <div className="form-group"><label>Student ID *</label><input required value={form.student_id} onChange={e=>f('student_id',e.target.value)} placeholder="STU-2026-006"/></div>
            <div className="form-group"><label>First Name *</label><input required value={form.firstName} onChange={e=>f('firstName',e.target.value)}/></div>
            <div className="form-group"><label>Last Name *</label><input required value={form.lastName} onChange={e=>f('lastName',e.target.value)}/></div>
          </div>
          <div className="sp-form-row">
            <div className="form-group"><label>Middle Name</label><input value={form.middleName} onChange={e=>f('middleName',e.target.value)}/></div>
            <div className="form-group"><label>Age *</label><input required type="number" min="15" max="60" value={form.age} onChange={e=>f('age',e.target.value)}/></div>
            <div className="form-group"><label>Gender *</label>
              <select value={form.gender} onChange={e=>f('gender',e.target.value)}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
          </div>
          <div className="sp-form-row">
            <div className="form-group"><label>Email *</label><input required type="email" value={form.email} onChange={e=>f('email',e.target.value)}/></div>
            <div className="form-group"><label>Phone *</label><input required value={form.phone} onChange={e=>f('phone',e.target.value)}/></div>
          </div>
          <div className="form-group"><label>Address</label><textarea rows={2} value={form.address} onChange={e=>f('address',e.target.value)}/></div>
          <div className="sp-form-section-title">Academic Information</div>
          <div className="sp-form-row">
            <div className="form-group"><label>Program *</label>
              <select value={form.program} onChange={e=>f('program',e.target.value)}><option>BSIT</option><option>BSCS</option></select>
            </div>
            <div className="form-group"><label>Year Level *</label>
              <select value={form.yearLevel} onChange={e=>f('yearLevel',e.target.value)}>
                <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
              </select>
            </div>
            <div className="form-group"><label>Section *</label><input required value={form.section} onChange={e=>f('section',e.target.value)}/></div>
          </div>
          <div className="sp-form-section-title">Skills, Activities &amp; More</div>
          <TagInput label="Skills" values={form.skills} onChange={v=>f('skills',v)} placeholder="e.g. Programming"/>
          <TagInput label="Non-Academic Activities" values={form.activities} onChange={v=>f('activities',v)} placeholder="e.g. Hackathon Club"/>
          <TagInput label="Affiliations" values={form.affiliations} onChange={v=>f('affiliations',v)} placeholder="e.g. ICTSO"/>
          <TagInput label="Violations" values={form.violations} onChange={v=>f('violations',v)} placeholder="e.g. Tardiness (2026-01-01)"/>

          {/* Enroll in subjects — only on create */}
          {mode === 'create' && schedules.length > 0 && (
            <>
              <div className="sp-form-section-title">Enroll in Subjects</div>
              <div className="sp-enroll-list">
                {schedules.map(s => {
                  const checked = (form.schedule_ids || []).includes(s.id);
                  return (
                    <label key={s.id} className={`sp-enroll-item ${checked ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSchedule(s.id)}
                      />
                      <div className="sp-enroll-info">
                        <span className="sp-enroll-code">{s.subject_code}</span>
                        <span className="sp-enroll-title">{s.subject_title}</span>
                        <span className={`sp-enroll-type sp-enroll-${TYPE_CLASS[s.subject_type] || 'lecture'}`}>
                          {TYPE_LABEL[s.subject_type] || s.subject_type}
                        </span>
                        <span className="sp-enroll-meta">{s.section} · {s.day} {s.start_time}–{s.end_time}</span>
                        <span className="sp-enroll-faculty">{s.faculty_first} {s.faculty_last}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          <div className="sp-form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary-sp" disabled={saving}>
              {saving ? 'Saving…' : mode==='create' ? 'Create Student' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { user } = useAuth();
  const { isAdmin, isFaculty, isStudent, role } = useRole();

  const [students, setStudents]   = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [view, setView]           = useState('cards');
  const [selected, setSelected]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm]           = useState({...EMPTY_FORM});
  const [search, setSearch]               = useState('');
  const [filterProgram, setFilterProgram] = useState('All');
  const [filterYear, setFilterYear]       = useState('All');
  const [filterSkill, setFilterSkill]     = useState('All Skills');
  const [filterGender, setFilterGender]   = useState('All');

  const loadStudents = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [data, scheds] = await Promise.all([
        api.getStudents(),
        api.getSchedules().catch(() => []),
      ]);
      setStudents(data.map(toUI));
      setSchedules(scheds);
      if (isStudent && data.length > 0) {
        const ui = toUI(data[0]);
        setSelected(ui);
        setView('detail');
        const enr = await api.getStudentEnrollments(ui.id).catch(() => []);
        setEnrollments(enr);
      }
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [isStudent]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const allSkills       = students.flatMap(s=>s.skills);
  const skillCount      = allSkills.reduce((a,s)=>{a[s]=(a[s]||0)+1;return a;},{});
  const topSkill        = Object.entries(skillCount).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
  const skillCategories = Object.keys(skillCount).length;

  const filtered = useMemo(()=>students.filter(s=>{
    const q=search.toLowerCase();
    const ms=!q||s.firstName.toLowerCase().includes(q)||s.lastName.toLowerCase().includes(q)||
      (s.student_id||'').toLowerCase().includes(q)||s.program.toLowerCase().includes(q)||
      s.skills.some(sk=>sk.toLowerCase().includes(q))||s.affiliations.some(a=>a.toLowerCase().includes(q));
    return ms&&(filterProgram==='All'||s.program===filterProgram)&&
      (filterYear==='All'||s.yearLevel===filterYear)&&
      (filterSkill==='All Skills'||s.skills.includes(filterSkill))&&
      (filterGender==='All'||s.gender===filterGender);
  }),[students,search,filterProgram,filterYear,filterSkill,filterGender]);

  const hasFilters = search||filterProgram!=='All'||filterYear!=='All'||filterSkill!=='All Skills'||filterGender!=='All';
  const openCreate = ()=>{ setForm({...EMPTY_FORM, schedule_ids:[]}); setModalMode('create'); setShowModal(true); };
  const openEdit   = s =>{ setForm({...s, student_id: s.student_id||''}); setModalMode('edit'); setShowModal(true); };
  const openDetail = async s => {
    setSelected(s); setView('detail');
    try {
      const enr = await api.getStudentEnrollments(s.id);
      setEnrollments(enr);
    } catch { setEnrollments([]); }
  };
  const goBack     = ()=>{ if(isStudent) return; setView('cards'); setSelected(null); };
  const clearFilters=()=>{ setSearch('');setFilterProgram('All');setFilterYear('All');setFilterSkill('All Skills');setFilterGender('All'); };

  const handleDelete = async id => {
    if(!window.confirm('Delete this student?')) return;
    try {
      await api.deleteStudent(id);
      setStudents(prev=>prev.filter(s=>s.id!==id));
      if(selected?.id===id) goBack();
    } catch(e) { alert('Delete failed: '+e.message); }
  };

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if(modalMode==='create') {
        const created = await api.createStudent(toDB(form));
        // Enroll in selected schedules
        if (form.schedule_ids?.length) {
          await api.enrollStudent(created.id, form.schedule_ids);
        }
        setStudents(prev=>[toUI(created),...prev]);
      } else {
        const updated = await api.updateStudent(form.id, toDB(form));
        const ui = toUI(updated);
        setStudents(prev=>prev.map(s=>s.id===form.id?ui:s));
        if(selected?.id===form.id) setSelected(ui);
      }
      setShowModal(false);
    } catch(e) { alert('Save failed: '+e.message); }
    finally { setSaving(false); }
  };

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (view==='detail' && selected) {
    // Students only see My Profile + My Skills — no violations shown to themselves
    const showViolations = isAdmin || isFaculty;
    const canEdit        = isAdmin || isFaculty;
    const canDelete      = isAdmin;

    return (
      <div className="sp-container">
        <div className="sp-detail-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {!isStudent && (
              <button className="btn-back" onClick={goBack}><FaArrowLeft/> Back</button>
            )}
            <RoleBadge role={role} />
          </div>
          <div className="sp-detail-actions">
            {canEdit   && <button className="btn-edit-action"   onClick={()=>openEdit(selected)}><FaEdit/> Edit</button>}
            {canDelete && <button className="btn-delete-action" onClick={()=>handleDelete(selected.id)}><FaTrash/> Delete</button>}
          </div>
        </div>

        <div className="sp-detail-hero">
          <div className="sp-avatar-lg">{selected.firstName[0]}{selected.lastName[0]}</div>
          <div className="sp-detail-hero-info">
            <h1>{selected.firstName} {selected.middleName} {selected.lastName}</h1>
            <p className="sp-detail-sub">
              {selected.student_id} &bull; {selected.program} &bull; {selected.yearLevel} &bull; Section {selected.section}
            </p>
            <div className="sp-detail-badges">
              {selected.skills.map(sk=><Badge key={sk} label={sk} color={SKILL_COLORS[sk]}/>)}
            </div>
          </div>
        </div>

        <div className="sp-detail-grid">
          {/* My Profile — visible to all roles */}
          <div className="sp-detail-card">
            <h3><FaUserGraduate/> {isStudent ? 'My Profile' : 'Personal Information'}</h3>
            <div className="sp-info-list">
              <div className="sp-info-row"><span>Age</span><strong>{selected.age}</strong></div>
              <div className="sp-info-row"><span>Gender</span><strong>{selected.gender}</strong></div>
              <div className="sp-info-row"><FaEnvelope/><span>Email</span><strong>{selected.email}</strong></div>
              <div className="sp-info-row"><FaPhone/><span>Phone</span><strong>{selected.phone}</strong></div>
              <div className="sp-info-row"><FaMapMarkerAlt/><span>Address</span><strong>{selected.address}</strong></div>
            </div>
          </div>

          <div className="sp-detail-card">
            <h3><FaUserGraduate/> Academic History</h3>
            <div className="sp-info-list">
              <div className="sp-info-row"><span>Program</span><strong>{selected.program}</strong></div>
              <div className="sp-info-row"><span>Year Level</span><strong>{selected.yearLevel}</strong></div>
              <div className="sp-info-row"><span>Section</span><strong>{selected.section}</strong></div>
              <div className="sp-info-row"><span>Date Added</span><strong>{selected.addedDate}</strong></div>
            </div>
          </div>

          {/* My Skills — visible to all roles */}
          <div className="sp-detail-card">
            <h3><FaStar/> {isStudent ? 'My Skills' : 'Skills'}</h3>
            <div className="sp-tag-list">
              {selected.skills.length
                ? selected.skills.map(sk=><Badge key={sk} label={sk} color={SKILL_COLORS[sk]}/>)
                : <span className="sp-empty">No skills listed</span>}
            </div>
          </div>

          <div className="sp-detail-card">
            <h3><FaUsers/> Affiliations</h3>
            <div className="sp-tag-list">
              {selected.affiliations.length
                ? selected.affiliations.map(a=><span key={a} className="affil-badge">{a}</span>)
                : <span className="sp-empty">None</span>}
            </div>
          </div>

          <div className="sp-detail-card">
            <h3><FaTag/> Non-Academic Activities</h3>
            <div className="sp-tag-list">
              {selected.activities.length
                ? selected.activities.map(a=><span key={a} className="activity-badge">{a}</span>)
                : <span className="sp-empty">None</span>}
            </div>
          </div>

          {/* Violations — hidden from students */}
          {showViolations && (
            <div className="sp-detail-card sp-violations">
              <h3><FaExclamationTriangle/> Violations</h3>
              {selected.violations.length
                ? <ul className="violation-list">{selected.violations.map((v,i)=><li key={i}>{v}</li>)}</ul>
                : <span className="sp-empty sp-clean">No violations on record ✓</span>}
            </div>
          )}
        </div>

        {/* Enrolled Subjects */}
        <div className="sp-detail-card" style={{marginTop:'1rem'}}>
          <h3><FaBook/> {isStudent ? 'My Enrolled Subjects' : 'Enrolled Subjects'} ({enrollments.length})</h3>
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
                        <td style={{whiteSpace:'nowrap'}}>{e.start_time}–{e.end_time}</td>
                        <td>{e.room_code}</td>
                        <td><strong>{e.units}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {showModal && <StudentModal mode={modalMode} form={form} setForm={setForm} schedules={schedules} onSubmit={handleSubmit} onClose={()=>setShowModal(false)} saving={saving}/>}
      </div>
    );
  }

  // ── LIST VIEW (admin + faculty only — students go straight to detail) ──────
  const pageTitle = isFaculty ? 'My Assigned Students' : 'Student Management';

  return (
    <div className="sp-container">
      <div className="sp-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
            <h1>{pageTitle}</h1>
            <RoleBadge role={role} />
          </div>
          <p className="sp-subtitle">{students.length} student{students.length!==1?'s':''} {isFaculty ? 'assigned to you' : 'enrolled'}</p>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <button className="btn-primary-sp" style={{background:'var(--bg-secondary)',color:'var(--primary-orange)',border:'1.5px solid var(--primary-orange)',boxShadow:'none'}} onClick={loadStudents} title="Refresh"><FaSync/></button>
          {/* Add Student — admin only */}
          {isAdmin && <button className="btn-primary-sp" onClick={openCreate}><FaPlus/> Add Student</button>}
        </div>
      </div>

      {error && (
        <div style={{background:'#fef2f2',color:'#ef4444',padding:'12px 16px',borderRadius:'10px',marginBottom:'1rem',border:'1px solid #fecaca'}}>
          ⚠ {error} — <button onClick={loadStudents} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',textDecoration:'underline'}}>Retry</button>
        </div>
      )}

      {/* Stats — admin + faculty */}
      <div className="sp-stats-row">
        <div className="sp-stat"><span className="sp-stat-num">{students.length}</span><span>Total Students</span></div>
        <div className="sp-stat"><span className="sp-stat-num">{skillCategories}</span><span>Skill Categories</span></div>
        <div className="sp-stat sp-stat-highlight"><span className="sp-stat-num">{topSkill}</span><span>Most Common Skill</span></div>
        <div className="sp-stat"><span className="sp-stat-num">{students[0]?students[0].firstName+' '+students[0].lastName:'—'}</span><span>Latest Added</span></div>
      </div>

      <div className="sp-filter-bar">
        <div className="sp-search-wrap">
          <FaSearch className="sp-search-icon"/>
          <input className="sp-search" placeholder="Search name, ID, skill, affiliation…" value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button className="sp-clear-search" onClick={()=>setSearch('')}><FaTimes/></button>}
        </div>
        <div className="sp-filters">
          <FaFilter className="sp-filter-icon"/>
          <select value={filterProgram} onChange={e=>setFilterProgram(e.target.value)}>{PROGRAMS.map(p=><option key={p}>{p}</option>)}</select>
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)}>{YEAR_LEVELS.map(y=><option key={y}>{y}</option>)}</select>
          <select value={filterSkill} onChange={e=>setFilterSkill(e.target.value)}>{ALL_SKILLS.map(s=><option key={s}>{s}</option>)}</select>
          <select value={filterGender} onChange={e=>setFilterGender(e.target.value)}>
            <option value="All">All Genders</option><option>Male</option><option>Female</option>
          </select>
          {hasFilters&&<button className="sp-clear-btn" onClick={clearFilters}><FaTimes/> Clear</button>}
        </div>
        <div className="sp-view-toggle">
          <button className={view==='cards'?'active':''} onClick={()=>setView('cards')} title="Cards"><FaTh/></button>
          <button className={view==='table'?'active':''} onClick={()=>setView('table')} title="Table"><FaTable/></button>
        </div>
      </div>

      <div className="sp-result-count">
        {loading ? 'Loading…' : <>Showing <strong>{filtered.length}</strong> of {students.length} students{hasFilters&&<span className="sp-filter-active-label"> (filtered)</span>}</>}
      </div>

      {loading && <div className="sp-no-results" style={{padding:'3rem'}}>Loading students…</div>}

      {!loading && view==='cards' && (
        <div className="sp-cards-grid">
          {filtered.length===0&&<div className="sp-no-results">No students match your filters.</div>}
          {filtered.map(s=>(
            <div key={s.id} className="sp-card" onClick={()=>openDetail(s)}>
              <div className="sp-card-top">
                <div className="sp-avatar">{s.firstName[0]}{s.lastName[0]}</div>
                <div className="sp-card-meta">
                  <h3>{s.firstName} {s.lastName}</h3>
                  <p>{s.student_id}</p>
                  <span className="sp-program-badge">{s.program}</span>
                </div>
                {/* Edit/Delete — hidden from students */}
                {(isAdmin || isFaculty) && (
                  <div className="sp-card-actions" onClick={e=>e.stopPropagation()}>
                    <button className="sp-icon-btn sp-edit" onClick={()=>openEdit(s)} title="Edit"><FaEdit/></button>
                    {isAdmin && <button className="sp-icon-btn sp-del" onClick={()=>handleDelete(s.id)} title="Delete"><FaTrash/></button>}
                  </div>
                )}
              </div>
              <div className="sp-card-body">
                <div className="sp-card-row"><span>Year &amp; Section</span><strong>{s.yearLevel} – {s.section}</strong></div>
                <div className="sp-card-row"><span>Gender / Age</span><strong>{s.gender}, {s.age} yrs</strong></div>
                <div className="sp-card-row"><FaEnvelope size={11}/><strong>{s.email}</strong></div>
              </div>
              <div className="sp-card-skills">
                {s.skills.slice(0,3).map(sk=><Badge key={sk} label={sk} color={SKILL_COLORS[sk]}/>)}
                {s.skills.length>3&&<span className="sp-more-badge">+{s.skills.length-3}</span>}
              </div>
              {/* Violations flag — hidden from students */}
              {(isAdmin || isFaculty) && s.violations.length>0 && (
                <div className="sp-violation-flag"><FaExclamationTriangle size={11}/> {s.violations.length} violation{s.violations.length>1?'s':''}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && view==='table' && (
        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Student</th><th>ID</th><th>Program</th><th>Year</th><th>Gender/Age</th><th>Skills</th>
                {(isAdmin || isFaculty) && <th>Violations</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={isAdmin||isFaculty?8:7} className="sp-no-results">No students match your filters.</td></tr>}
              {filtered.map(s=>(
                <tr key={s.id} className="sp-table-row" onClick={()=>openDetail(s)}>
                  <td><div className="sp-table-name"><div className="sp-avatar-sm">{s.firstName[0]}{s.lastName[0]}</div><span>{s.firstName} {s.lastName}</span></div></td>
                  <td><code>{s.student_id}</code></td>
                  <td><span className="sp-program-badge">{s.program}</span></td>
                  <td>{s.yearLevel}</td>
                  <td>{s.gender}, {s.age}</td>
                  <td><div className="sp-table-skills">{s.skills.slice(0,2).map(sk=><Badge key={sk} label={sk} color={SKILL_COLORS[sk]}/>)}{s.skills.length>2&&<span className="sp-more-badge">+{s.skills.length-2}</span>}</div></td>
                  {(isAdmin || isFaculty) && (
                    <td>{s.violations.length>0?<span className="sp-viol-count"><FaExclamationTriangle size={11}/> {s.violations.length}</span>:<span className="sp-clean-label">Clean</span>}</td>
                  )}
                  <td onClick={e=>e.stopPropagation()}>
                    <div className="sp-table-btns">
                      <button className="sp-icon-btn sp-view" onClick={()=>openDetail(s)} title="View"><FaEye/></button>
                      {(isAdmin || isFaculty) && <button className="sp-icon-btn sp-edit" onClick={()=>openEdit(s)} title="Edit"><FaEdit/></button>}
                      {isAdmin && <button className="sp-icon-btn sp-del" onClick={()=>handleDelete(s.id)} title="Delete"><FaTrash/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal&&<StudentModal mode={modalMode} form={form} setForm={setForm} schedules={schedules} onSubmit={handleSubmit} onClose={()=>setShowModal(false)} saving={saving}/>}
    </div>
  );
}
