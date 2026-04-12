import { useState, useEffect, useCallback } from 'react';
import './FacultyProfile.css';
import { api } from '../../api/index.js';
import { useAuth, useRole } from '../../context/AuthContext.jsx';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaCheckCircle, FaExclamationTriangle, FaTimes, FaArrowLeft, FaSync, FaBook } from 'react-icons/fa';
import { MdPerson } from 'react-icons/md';

const TYPE_LABEL = { LECTURE:'Lecture', LABORATORY:'Laboratory', PURE_LECTURE:'Pure Lecture' };
const TYPE_CLASS = { LECTURE:'lecture', LABORATORY:'laboratory', PURE_LECTURE:'pure' };

const EMPTY = { employee_id:'', firstName:'', lastName:'', title:'Prof.', department:'Information Technology', email:'', phone:'', specialization:'', employmentStatus:'Full-time', maxLoad:21, minLoad:15 };

const toUI = r => ({
  id: r.id, employee_id: r.employee_id,
  firstName: r.first_name, lastName: r.last_name, title: r.title,
  department: r.department, email: r.email, phone: r.phone||'',
  specialization: r.specialization||'', employmentStatus: r.employment_status,
  minLoad: r.min_load, maxLoad: r.max_load, currentLoad: r.current_load||0,
});
const toDB = f => ({
  employee_id: f.employee_id, first_name: f.firstName, last_name: f.lastName,
  title: f.title, department: f.department, email: f.email, phone: f.phone,
  specialization: f.specialization, employment_status: f.employmentStatus,
  min_load: Number(f.minLoad), max_load: Number(f.maxLoad), current_load: Number(f.currentLoad||0),
});

function loadStatus(cur, min, max) {
  if(cur>max) return 'overload'; if(cur<min) return 'underload'; return 'normal';
}

export default function FacultyProfile() {
  const { isAdmin, isFaculty } = useRole();
  const { user } = useAuth();
  const [faculty, setFaculty]     = useState([]);
  const [subjects, setSubjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [view, setView]           = useState('list');
  const [selected, setSelected]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm]           = useState({...EMPTY});
  const [search, setSearch]       = useState('');

  const loadSubjects = useCallback(async (facultyId) => {
    try {
      const data = await api.getFacultySubjects(facultyId);
      setSubjects(data);
    } catch { setSubjects([]); }
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (isFaculty) {
        const profile = await api.getMyFacultyProfile();
        const ui = toUI(profile);
        setSelected(ui);
        setView('detail');
        await loadSubjects(ui.id);
      } else {
        const d = await api.getFaculty();
        setFaculty(d.map(toUI));
      }
    }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [isFaculty, loadSubjects]);
  useEffect(()=>{ load(); },[load]);

  const filtered = faculty.filter(f => {
    const q=search.toLowerCase();
    return !q||f.firstName.toLowerCase().includes(q)||f.lastName.toLowerCase().includes(q)||f.department.toLowerCase().includes(q);
  });

  const openCreate = ()=>{ setForm({...EMPTY}); setModalMode('create'); setShowModal(true); };
  const openEdit   = f =>{ setForm({...f}); setModalMode('edit'); setShowModal(true); };
  const openDetail = f =>{ setSelected(f); setView('detail'); loadSubjects(f.id); };
  const goBack     = ()=>{ setView('list'); setSelected(null); };
  const ff = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleDelete = async id => {
    if(!window.confirm('Delete this faculty member?')) return;
    try { await api.deleteFaculty(id); setFaculty(prev=>prev.filter(f=>f.id!==id)); if(selected?.id===id) goBack(); }
    catch(e) { alert('Delete failed: '+e.message); }
  };

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if(modalMode==='create') {
        const created = await api.createFaculty(toDB(form));
        setFaculty(prev=>[toUI(created),...prev]);
      } else {
        const updated = await api.updateFaculty(form.id, toDB(form));
        const ui = toUI(updated);
        setFaculty(prev=>prev.map(f=>f.id===form.id?ui:f));
        if(selected?.id===form.id) setSelected(ui);
      }
      setShowModal(false);
    } catch(e) { alert('Save failed: '+e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="empty-state">Loading profile…</div>;
  if (error)   return <div style={{color:'#ef4444',padding:'1rem'}}>⚠ {error}</div>;

  if(view==='detail'&&selected) {
    const ls = loadStatus(selected.currentLoad, selected.minLoad, selected.maxLoad);
    return (
      <div className="faculty-container">
        <div className="back-bar">
          {isAdmin && (
            <button className="btn-back" onClick={goBack}><FaArrowLeft/> Back to Faculty</button>
          )}
          {isAdmin && (
            <div style={{display:'flex',gap:'8px'}}>
              <button className="btn-info" onClick={()=>openEdit(selected)}><FaEdit/> Edit</button>
              <button className="btn-danger" onClick={()=>handleDelete(selected.id)}><FaTrash/> Delete</button>
            </div>
          )}
        </div>
        <div className="hero-banner" style={{marginBottom:'1.5rem'}}>
          <div className="hero-avatar">{selected.firstName[0]}{selected.lastName[0]}</div>
          <div className="hero-info">
            <h1>{selected.title} {selected.firstName} {selected.lastName}</h1>
            <p>{selected.employee_id} &bull; {selected.department} &bull; {selected.specialization}</p>
            <div style={{marginTop:'8px'}}>
              <span className={`load-badge ${ls}`}>
                {ls==='normal'&&<><FaCheckCircle/> Normal Load</>}
                {ls==='overload'&&<><FaExclamationTriangle/> Overload</>}
                {ls==='underload'&&<><FaExclamationTriangle/> Underload</>}
              </span>
            </div>
          </div>
        </div>
        <div className="faculty-detail-grid">
          <div className="card">
            <div className="card-title"><MdPerson/> Professional Information</div>
            <div className="info-list">
              <div className="info-row"><span className="info-label">Email</span><span className="info-value">{selected.email}</span></div>
              <div className="info-row"><span className="info-label">Phone</span><span className="info-value">{selected.phone}</span></div>
              <div className="info-row"><span className="info-label">Status</span><span className="info-value">{selected.employmentStatus}</span></div>
              <div className="info-row"><span className="info-label">Specialization</span><span className="info-value">{selected.specialization}</span></div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Teaching Load</div>
            <div className="load-summary-grid">
              <div className="load-summary-item"><div className="lsi-val">{selected.currentLoad}</div><div className="lsi-lbl">Current</div></div>
              <div className="load-summary-item"><div className="lsi-val">{selected.minLoad}</div><div className="lsi-lbl">Min</div></div>
              <div className="load-summary-item"><div className="lsi-val">{selected.maxLoad}</div><div className="lsi-lbl">Max</div></div>
            </div>
            <div style={{marginTop:'14px'}}>
              <div className="progress-track">
                <div className={`progress-fill ${ls==='overload'?'progress-fill-red':ls==='underload'?'progress-fill-yellow':'progress-fill-green'}`}
                  style={{width:`${Math.min((selected.currentLoad/selected.maxLoad)*100,100)}%`}}/>
              </div>
              <div style={{fontSize:'.75rem',color:'var(--text-tertiary)',marginTop:'6px',textAlign:'right'}}>{selected.currentLoad} / {selected.maxLoad} units</div>
            </div>
          </div>
        </div>

        {/* ── Subjects / Schedules ── */}
        <div className="card" style={{marginTop:'1rem'}}>
          <div className="card-title"><FaBook/> Subjects Handled ({subjects.length})</div>
          {subjects.length === 0
            ? <p style={{color:'var(--text-tertiary)',fontSize:'.875rem',margin:'8px 0 0'}}>No subjects assigned yet.</p>
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
                        <td style={{whiteSpace:'nowrap'}}>{s.start_time} – {s.end_time}</td>
                        <td>
                          <div style={{display:'flex',flexDirection:'column'}}>
                            <span>{s.room_code}</span>
                            <small style={{color:'var(--text-tertiary)',fontSize:'.72rem'}}>{s.room_name}</small>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            color: s.enrolled >= s.capacity ? '#ef4444' : s.enrolled >= s.capacity * 0.9 ? '#d97706' : '#16a34a',
                            fontWeight: 700
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
        {showModal&&<FacultyModal mode={modalMode} form={form} ff={ff} onSubmit={handleSubmit} onClose={()=>setShowModal(false)} saving={saving}/>}
      </div>
    );
  }

  return (
    <div className="faculty-container">
      <div className="page-header">
        <div className="page-header-left"><h1>Faculty Management</h1><p>{faculty.length} faculty members</p></div>
        <div style={{display:'flex',gap:'8px'}}>
          <button className="btn-secondary" onClick={load} title="Refresh"><FaSync/></button>
          {isAdmin && <button className="btn-primary" onClick={openCreate}><FaPlus/> Add Faculty</button>}
        </div>
      </div>
      {error&&<div style={{background:'#fef2f2',color:'#ef4444',padding:'12px 16px',borderRadius:'10px',marginBottom:'1rem',border:'1px solid #fecaca'}}>⚠ {error}</div>}
      <div className="filter-bar" style={{marginBottom:'1.25rem'}}>
        <div className="search-wrap" style={{flex:1}}>
          <FaSearch/>
          <input className="search-input" placeholder="Search by name or department…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {search&&<button className="sp-clear-btn" onClick={()=>setSearch('')}><FaTimes/> Clear</button>}
      </div>
      {loading&&<div className="empty-state">Loading faculty from database…</div>}
      <div className="faculty-grid">
        {!loading&&filtered.length===0&&<div className="empty-state">No faculty members found.</div>}
        {filtered.map(f=>{
          const ls=loadStatus(f.currentLoad,f.minLoad,f.maxLoad);
          return (
            <div key={f.id} className="faculty-card">
              <div className="faculty-card-header">
                <div className="faculty-avatar">{f.firstName[0]}{f.lastName[0]}</div>
                <div className="faculty-card-meta"><h3>{f.title} {f.firstName} {f.lastName}</h3><p>{f.employee_id}</p></div>
                <span className={`load-badge ${ls}`} style={{fontSize:'.68rem',padding:'3px 8px'}}>{ls==='normal'?'✓':'⚠'} {ls}</span>
              </div>
              <div className="faculty-card-body">
                <div className="fc-row"><span className="fc-label">Department</span><span className="fc-value">{f.department}</span></div>
                <div className="fc-row"><span className="fc-label">Specialization</span><span className="fc-value">{f.specialization}</span></div>
                <div className="fc-row"><span className="fc-label">Load</span><span className="fc-value">{f.currentLoad}/{f.maxLoad} units</span></div>
                <div className="fc-row"><span className="fc-label">Status</span><span className="fc-value">{f.employmentStatus}</span></div>
              </div>
              <div className="faculty-card-actions">
                <button className="btn-primary" style={{flex:1}} onClick={()=>openDetail(f)}><FaEye/> View</button>
                {isAdmin && <button className="btn-icon btn-icon-info" onClick={()=>openEdit(f)} title="Edit"><FaEdit/></button>}
                {isAdmin && <button className="btn-icon btn-icon-danger" onClick={()=>handleDelete(f.id)} title="Delete"><FaTrash/></button>}
              </div>
            </div>
          );
        })}
      </div>
      {showModal&&<FacultyModal mode={modalMode} form={form} ff={ff} onSubmit={handleSubmit} onClose={()=>setShowModal(false)} saving={saving}/>}
    </div>
  );
}

function FacultyModal({ mode, form, ff, onSubmit, onClose, saving }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode==='create'?'Add New Faculty':'Edit Faculty'}</h2>
          <button className="modal-close" onClick={onClose}><FaTimes/></button>
        </div>
        <div className="modal-body">
          <form onSubmit={onSubmit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div className="form-section-label">Personal Information</div>
            <div className="form-group"><label>Employee ID *</label><input required value={form.employee_id||''} onChange={e=>ff('employee_id',e.target.value)} placeholder="FAC-2026-004"/></div>
            <div className="form-grid">
              <div className="form-group"><label>Title</label>
                <select value={form.title} onChange={e=>ff('title',e.target.value)}><option>Prof.</option><option>Dr.</option><option>Mr.</option><option>Ms.</option></select>
              </div>
              <div className="form-group"><label>First Name *</label><input required value={form.firstName} onChange={e=>ff('firstName',e.target.value)}/></div>
              <div className="form-group"><label>Last Name *</label><input required value={form.lastName} onChange={e=>ff('lastName',e.target.value)}/></div>
            </div>
            <div className="form-section-label">Professional Details</div>
            <div className="form-grid">
              <div className="form-group"><label>Department *</label>
                <select value={form.department} onChange={e=>ff('department',e.target.value)}><option>Information Technology</option><option>Computer Science</option></select>
              </div>
              <div className="form-group"><label>Employment Status</label>
                <select value={form.employmentStatus} onChange={e=>ff('employmentStatus',e.target.value)}><option>Full-time</option><option>Part-time</option></select>
              </div>
            </div>
            <div className="form-group"><label>Specialization *</label><input required value={form.specialization} onChange={e=>ff('specialization',e.target.value)}/></div>
            <div className="form-group"><label>Email *</label><input required type="email" value={form.email} onChange={e=>ff('email',e.target.value)}/></div>
            <div className="form-group"><label>Phone *</label><input required value={form.phone} onChange={e=>ff('phone',e.target.value)}/></div>
            <div className="form-grid">
              <div className="form-group"><label>Min Load</label><input type="number" value={form.minLoad} onChange={e=>ff('minLoad',+e.target.value)}/></div>
              <div className="form-group"><label>Max Load</label><input type="number" value={form.maxLoad} onChange={e=>ff('maxLoad',+e.target.value)}/></div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving…':mode==='create'?'Create Faculty':'Save Changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
