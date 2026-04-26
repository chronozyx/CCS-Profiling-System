import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentProfile.css';
import { api } from '../../api/index.js';
import { useAuth, useRole } from '../../context/AuthContext.jsx';
import Loader from '../../components/Loader.jsx';
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
            <div className="form-group"><label>Student ID *</label><input required value={form.student_id} onChange={e=>f('student_id',e.target.value.replace(/\D/g,'').slice(0,7))} placeholder="2026001" inputMode="numeric" maxLength={7}/></div>
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
  const navigate = useNavigate();

  const [students, setStudents]   = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [view, setView]           = useState('cards');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm]           = useState({...EMPTY_FORM});
  const [search, setSearch]               = useState('');
  const [filterProgram, setFilterProgram] = useState('All');
  const [filterYear, setFilterYear]       = useState('All');
  const [filterSkill, setFilterSkill]     = useState('All Skills');
  const [filterGender, setFilterGender]   = useState('All');

  const [page, setPage]   = useState(1);
  const [total, setTotal] = useState(0);
  const [latestStudent, setLatestStudent] = useState(null);
  const LIMIT = 20;

  const latestStudentRef = useRef(null);

  const loadStudents = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [res, scheds] = await Promise.all([
        api.getStudents({
          page,
          limit:     LIMIT,
          search:    search    || undefined,
          program:   filterProgram  !== 'All'        ? filterProgram  : undefined,
          yearLevel: filterYear     !== 'All'        ? filterYear     : undefined,
          skill:     filterSkill    !== 'All Skills' ? filterSkill    : undefined,
          gender:    filterGender   !== 'All'        ? filterGender   : undefined,
        }),
        api.getSchedules().catch(() => []),
      ]);

      setStudents(res.data.map(toUI));
      setTotal(res.pagination.total);
      setSchedules(scheds);

      // Only set latestStudent on initial load (no filters, page 1), never overwrite after a create
      if (!latestStudentRef.current && page === 1 && !search && filterProgram === 'All' && filterYear === 'All' && filterSkill === 'All Skills' && filterGender === 'All') {
        if (res.data.length > 0) {
          const latest = toUI(res.data[0]);
          latestStudentRef.current = latest;
          setLatestStudent(latest);
        }
      }

      if (isStudent && res.data.length > 0) {
        navigate(`/students/${res.data[0].id}`, { replace: true });
      }
    } catch(e) { setError(e.message); }
    finally    { setLoading(false); }
  }, [page, search, filterProgram, filterYear, filterSkill, filterGender, isStudent]);

  useEffect(() => { setPage(1); }, [search, filterProgram, filterYear, filterSkill, filterGender]);
  useEffect(() => { loadStudents(); }, [loadStudents]);

  const allSkills       = students.flatMap(s=>s.skills);
  const skillCount      = allSkills.reduce((a,s)=>{a[s]=(a[s]||0)+1;return a;},{});
  const topSkill        = Object.entries(skillCount).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
  const skillCategories = Object.keys(skillCount).length;

  

  const hasFilters = search||filterProgram!=='All'||filterYear!=='All'||filterSkill!=='All Skills'||filterGender!=='All';
  const openCreate = ()=>{ setForm({...EMPTY_FORM, schedule_ids:[]}); setModalMode('create'); setShowModal(true); };
  const openEdit   = s =>{ setForm({...s, student_id: s.student_id||''}); setModalMode('edit'); setShowModal(true); };
  // Navigate to the dynamic route /students/:id
  const openDetail = s => navigate(`/students/${s.id}`);
  const clearFilters=()=>{ setSearch('');setFilterProgram('All');setFilterYear('All');setFilterSkill('All Skills');setFilterGender('All'); };

  const handleDelete = async id => {
    if(!window.confirm('Delete this student?')) return;
    try {
      await api.deleteStudent(id);
      setStudents(prev=>prev.filter(s=>s.id!==id));
    } catch(e) { alert('Delete failed: '+e.message); }
  };

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if(modalMode==='create') {
        const created = await api.createStudent(toDB(form));
        if (form.schedule_ids?.length) {
          await api.enrollStudent(created.id, form.schedule_ids);
        }
        const newStudent = toUI(created);
        setStudents(prev=>[newStudent,...prev]);
        latestStudentRef.current = newStudent;
        setLatestStudent(newStudent);
        setTotal(prev => prev + 1);
      } else {
        const updated = await api.updateStudent(form.id, toDB(form));
        setStudents(prev=>prev.map(s=>s.id===form.id?toUI(updated):s));
      }
      setShowModal(false);
    } catch(e) { alert('Save failed: '+e.message); }
    finally { setSaving(false); }
  };

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
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
        <div className="sp-stat"><span className="sp-stat-num">{total}</span><span>Total Students</span></div>
        <div className="sp-stat"><span className="sp-stat-num">{skillCategories}</span><span>Skill Categories</span></div>
        <div className="sp-stat sp-stat-highlight"><span className="sp-stat-num">{topSkill}</span><span>Most Common Skill</span></div>
        <div className="sp-stat"><span className="sp-stat-num">{latestStudent ? latestStudent.firstName+' '+latestStudent.lastName : '—'}</span><span>Latest Added</span></div>
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
        {loading ? <Loader /> : <>Showing <strong>{students.length}</strong> of {total} students{hasFilters&&<span className="sp-filter-active-label"> (students)</span>}</>}
      </div>

      {loading && <Loader padded />}

      {!loading && view==='cards' && (
        <div className="sp-cards-grid">
          {students.length===0&&<div className="sp-no-results">No students match your filters.</div>}
          {students.map(s=>(
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
              {students.length===0&&<tr><td colSpan={isAdmin||isFaculty?8:7} className="sp-no-results">No students match your filters.</td></tr>}
              {students.map(s=>(
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
      {!loading && total > LIMIT && (
        <div className="sp-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {page} of {Math.ceil(total / LIMIT)}</span>
          <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {showModal&&<StudentModal mode={modalMode} form={form} setForm={setForm} schedules={schedules} onSubmit={handleSubmit} onClose={()=>setShowModal(false)} saving={saving}/>}
    </div>
  );
}