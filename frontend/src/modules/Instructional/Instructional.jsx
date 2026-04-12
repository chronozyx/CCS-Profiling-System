import { useState, useEffect, useCallback } from 'react';
import './Instructional.css';
import { api } from '../../api/index.js';
import { FaPlus, FaFileAlt, FaEdit, FaBookOpen, FaLink, FaTrash, FaTimes, FaSync } from 'react-icons/fa';

const MAPPING = [
  { subject:'IT301', name:'Data Structures',  faculty:'Dr. Maria Santos', section:'3A' },
  { subject:'IT302', name:'Web Development',  faculty:'Prof. John Reyes', section:'3B' },
  { subject:'IT401', name:'Machine Learning', faculty:'Dr. Maria Santos', section:'4A' },
];

const typeIcon = t => { if(t==='Syllabus') return <FaFileAlt/>; if(t==='Lesson Plan') return <FaEdit/>; return <FaBookOpen/>; };
const typeBadgeClass = t => { if(t==='Syllabus') return 'badge badge-blue'; if(t==='Lesson Plan') return 'badge badge-purple'; return 'badge badge-green'; };

const EMPTY = { subject:'', faculty:'', type:'Syllabus', title:'' };

export default function Instructional() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({...EMPTY});
  const ff = (k,v) => setForm(p=>({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try { setMaterials(await api.getMaterials()); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(()=>{ load(); },[load]);

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const created = await api.createMaterial(form);
      setMaterials(prev=>[created,...prev]);
      setShowModal(false); setForm({...EMPTY});
    } catch(e) { alert('Save failed: '+e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if(!window.confirm('Delete this material?')) return;
    try { await api.deleteMaterial(id); setMaterials(prev=>prev.filter(m=>m.id!==id)); }
    catch(e) { alert('Delete failed: '+e.message); }
  };

  return (
    <div className="instructional-container">
      <div className="page-header">
        <div className="page-header-left"><h1>Instructional Management</h1></div>
        <button className="btn-secondary" onClick={load} title="Refresh"><FaSync/></button>
      </div>

      <div className="instructional-grid">
        <div className="card">
          <div className="card-title"><FaBookOpen/> Course Materials</div>
          <button className="btn-primary" style={{marginBottom:'12px'}} onClick={()=>setShowModal(true)}><FaPlus/> Upload Material</button>
          {loading&&<div style={{color:'var(--text-tertiary)',fontSize:'.875rem',padding:'8px 0'}}>Loading…</div>}
          <div className="material-list">
            {!loading&&materials.length===0&&<div style={{color:'var(--text-tertiary)',fontSize:'.875rem'}}>No materials yet.</div>}
            {materials.map(m=>(
              <div key={m.id} className="material-item">
                <div className="material-icon">{typeIcon(m.type)}</div>
                <div className="material-info">
                  <strong>{m.title}</strong>
                  <p>{m.subject}</p>
                  <small>{m.faculty} &bull; {m.upload_date?.slice(0,10)}</small>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'4px',alignItems:'flex-end'}}>
                  <span className={typeBadgeClass(m.type)}>{m.type}</span>
                  <button className="btn-icon btn-icon-danger" onClick={()=>handleDelete(m.id)} title="Delete"><FaTrash/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><FaLink/> Subject-to-Faculty Mapping</div>
          <div style={{marginTop:'4px'}}>
            <table className="mapping-table">
              <thead><tr><th>Code</th><th>Subject</th><th>Faculty</th><th>Section</th></tr></thead>
              <tbody>
                {MAPPING.map((m,i)=>(
                  <tr key={i}>
                    <td><code style={{fontSize:'.75rem',background:'var(--bg-tertiary)',padding:'2px 6px',borderRadius:'4px'}}>{m.subject}</code></td>
                    <td>{m.name}</td><td>{m.faculty}</td><td>{m.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2>Upload Material</h2><button className="modal-close" onClick={()=>setShowModal(false)}><FaTimes/></button></div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div className="form-group"><label>Title *</label><input required value={form.title} onChange={e=>ff('title',e.target.value)}/></div>
                <div className="form-group"><label>Subject *</label><input required value={form.subject} onChange={e=>ff('subject',e.target.value)} placeholder="IT301 – Data Structures"/></div>
                <div className="form-group"><label>Faculty</label><input value={form.faculty} onChange={e=>ff('faculty',e.target.value)}/></div>
                <div className="form-group"><label>Type *</label>
                  <select value={form.type} onChange={e=>ff('type',e.target.value)}><option>Syllabus</option><option>Lesson Plan</option><option>Course Material</option></select>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={()=>setShowModal(false)} disabled={saving}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving…':'Upload'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
