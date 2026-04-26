import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FacultyProfile.css';
import { api } from '../../api/index.js';
import { useAuth, useRole } from '../../context/AuthContext.jsx';
import Loader from '../../components/Loader.jsx';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [faculty, setFaculty]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm]           = useState({...EMPTY});
  const [search, setSearch]       = useState('');
  const [filterDept,   setFilterDept]   = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterLoad,   setFilterLoad]   = useState('All');
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  const [latestFaculty, setLatestFaculty] = useState(null);
  const latestFacultyRef = useRef(null);

  // Pre-apply dept filter when navigating from dashboard
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dept = params.get('dept');
    if (dept) setFilterDept(dept);
  }, [location.search]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (isFaculty) {
        const profile = await api.getMyFacultyProfile();
        // Faculty role: go straight to their own detail page
        navigate(`/faculty/${toUI(profile).id}`, { replace: true });
        return;
      }
      const d = await api.getFaculty();
      const mapped = d.map(toUI);
      setFaculty(mapped);
      // Set latest only on first load, never overwrite after a create
      if (!latestFacultyRef.current && mapped.length > 0) {
        latestFacultyRef.current = mapped[0];
        setLatestFaculty(mapped[0]);
      }
    }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [isFaculty, navigate]);
  useEffect(()=>{ load(); },[load]);

  const filtered = faculty.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      f.firstName.toLowerCase().includes(q) ||
      f.lastName.toLowerCase().includes(q) ||
      f.department.toLowerCase().includes(q) ||
      f.specialization.toLowerCase().includes(q) ||
      (f.employee_id || '').toLowerCase().includes(q);
    const matchDept   = filterDept   === 'All' || f.department === filterDept;
    const matchStatus = filterStatus === 'All' || f.employmentStatus === filterStatus;
    const ls = loadStatus(f.currentLoad, f.minLoad, f.maxLoad);
    const matchLoad   = filterLoad   === 'All' || ls === filterLoad;
    return matchSearch && matchDept && matchStatus && matchLoad;
  });

  const hasFilters = search || filterDept !== 'All' || filterStatus !== 'All' || filterLoad !== 'All';
  const clearFilters = () => { setSearch(''); setFilterDept('All'); setFilterStatus('All'); setFilterLoad('All'); setPage(1); };

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, filterDept, filterStatus, filterLoad]);

  const totalPages = Math.ceil(filtered.length / LIMIT);
  const paginated  = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  // Stats computed from all faculty (not just current page)
  const specCount    = faculty.reduce((a, f) => { if (f.specialization) a[f.specialization] = (a[f.specialization]||0)+1; return a; }, {});
  const topSpec      = Object.entries(specCount).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';
  const specCategories = Object.keys(specCount).length;

  const openCreate = ()=>{ setForm({...EMPTY}); setModalMode('create'); setShowModal(true); };
  const openEdit   = f =>{ setForm({...f}); setModalMode('edit'); setShowModal(true); };
  const openDetail = f => navigate(`/faculty/${f.id}`);
  const ff = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleDelete = async id => {
    if(!window.confirm('Delete this faculty member?')) return;
    try { await api.deleteFaculty(id); setFaculty(prev=>prev.filter(f=>f.id!==id)); }
    catch(e) { alert('Delete failed: '+e.message); }
  };

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if(modalMode==='create') {
        const created = await api.createFaculty(toDB(form));
        const newFac = toUI(created);
        setFaculty(prev=>[newFac,...prev]);
        latestFacultyRef.current = newFac;
        setLatestFaculty(newFac);
      } else {
        const updated = await api.updateFaculty(form.id, toDB(form));
        const ui = toUI(updated);
        setFaculty(prev=>prev.map(f=>f.id===form.id?ui:f));
      }
      setShowModal(false);
    } catch(e) { alert('Save failed: '+e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="empty-state"><Loader full /></div>;
  if (error)   return <div style={{color:'#ef4444',padding:'1rem'}}>⚠ {error}</div>;

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

      {/* Stats row */}
      <div className="sp-stats-row">
        <div className="sp-stat"><span className="sp-stat-num">{faculty.length}</span><span>Total Faculty</span></div>
        <div className="sp-stat"><span className="sp-stat-num">{specCategories}</span><span>Specializations</span></div>
        <div className="sp-stat sp-stat-highlight"><span className="sp-stat-num fac-stat-spec">{topSpec}</span><span>Most Common Specialization</span></div>
        <div className="sp-stat"><span className="sp-stat-num fac-stat-spec">{latestFaculty ? `${latestFaculty.title} ${latestFaculty.firstName} ${latestFaculty.lastName}` : '—'}</span><span>Latest Added</span></div>
      </div>
      <div className="fac-filter-bar">
        <div className="fac-search-wrap">
          <FaSearch className="fac-search-icon"/>
          <input
            className="fac-search-input"
            placeholder="Search name, department, specialization…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="fac-clear-x" onClick={() => setSearch('')}><FaTimes/></button>}
        </div>

        <select className="fac-filter-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="All">All Departments</option>
          <option>Information Technology</option>
          <option>Computer Science</option>
        </select>

        <select className="fac-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          <option>Full-time</option>
          <option>Part-time</option>
        </select>

        <select className="fac-filter-select" value={filterLoad} onChange={e => setFilterLoad(e.target.value)}>
          <option value="All">All Load</option>
          <option value="normal">Normal</option>
          <option value="overload">Overload</option>
          <option value="underload">Underload</option>
        </select>

        {hasFilters && (
          <button className="fac-clear-btn" onClick={clearFilters}>
            <FaTimes size={11}/> Clear
          </button>
        )}
      </div>

      <div className="fac-result-count">
        {filtered.length === faculty.length
          ? <>{faculty.length} faculty member{faculty.length !== 1 ? 's' : ''}</>
          : <>Showing <strong>{filtered.length}</strong> of {faculty.length}{hasFilters && <span className="fac-filtered-label"> (filtered)</span>}</>
        }
      </div>
      {loading&&<div className="empty-state"><Loader padded /></div>}
      <div className="faculty-grid">
        {!loading&&filtered.length===0&&<div className="empty-state">No faculty members found.</div>}
        {paginated.map(f=>{
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
      {totalPages > 1 && (
        <div className="sp-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
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
            <div className="form-group"><label>Employee ID *</label><input required value={form.employee_id||''} onChange={e=>ff('employee_id',e.target.value.replace(/\D/g,'').slice(0,7))} placeholder="0000001" inputMode="numeric" maxLength={7}/><span style={{fontSize:'.75rem',color:'var(--text-tertiary)'}}>{(form.employee_id||'').length}/7 digits{(form.employee_id||'').length===7&&<span style={{color:'#16a34a'}}> ✓</span>}</span></div>
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
