import { useState, useEffect, useCallback } from 'react';
import './Research.css';
import Loader from '../../components/Loader.jsx';
import { api } from '../../api/index.js';
import { FaPlus, FaUsers, FaBook, FaCalendarAlt, FaFolder, FaTrash, FaTimes, FaSync } from 'react-icons/fa';

const EMPTY = { title:'', program:'BSIT', year_published: new Date().getFullYear(), category:'Published', evaluation_score:'', authors:[] };

export default function Research() {
  const [researches, setResearches] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [filterYear, setFilterYear]         = useState('all');
  const [filterProgram, setFilterProgram]   = useState('all');
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({...EMPTY});
  const [authorInput, setAuthorInput] = useState('');
  const ff = (k,v) => setForm(p=>({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try { setResearches(await api.getResearch()); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(()=>{ load(); },[load]);

  const filtered = researches.filter(r => {
    if(filterYear!=='all'&&String(r.year_published)!==filterYear) return false;
    if(filterProgram!=='all'&&r.program!==filterProgram) return false;
    return true;
  });

  const addAuthor = () => { const v=authorInput.trim(); if(v) { ff('authors',[...form.authors,v]); setAuthorInput(''); } };

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const created = await api.createResearch({ ...form, evaluation_score: Number(form.evaluation_score)||0, authors: form.authors.map(a=>({name:a,type:'faculty'})) });
      setResearches(prev=>[...prev, {...created, authors: form.authors, rank: prev.length+1}]);
      setShowModal(false); setForm({...EMPTY});
    } catch(e) { alert('Save failed: '+e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if(!window.confirm('Delete this research?')) return;
    try { await api.deleteResearch(id); setResearches(prev=>prev.filter(r=>r.id!==id)); }
    catch(e) { alert('Delete failed: '+e.message); }
  };

  return (
    <div className="research-container">
      <div className="page-header">
        <div className="page-header-left"><h1>College Research</h1><p>{filtered.length} research papers</p></div>
        <div style={{display:'flex',gap:'8px'}}>
          <button className="btn-secondary" onClick={load} title="Refresh"><FaSync/></button>
          <button className="btn-primary" onClick={()=>setShowModal(true)}><FaPlus/> Add Research</button>
        </div>
      </div>

      <div className="research-filters">
        <select className="filter-select" value={filterYear} onChange={e=>setFilterYear(e.target.value)}>
          <option value="all">All Years</option>
          {[...new Set(researches.map(r=>r.year_published))].sort((a,b)=>b-a).map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <select className="filter-select" value={filterProgram} onChange={e=>setFilterProgram(e.target.value)}>
          <option value="all">All Programs</option><option value="BSIT">BSIT</option><option value="BSCS">BSCS</option>
        </select>
      </div>

      {loading&&<div className="empty-state"><Loader padded /></div>}
      <div className="research-grid">
        {!loading&&filtered.length===0&&<div className="empty-state">No research papers found.</div>}
        {filtered.map((r,i)=>(
          <div key={r.id} className="research-card">
            <div className="research-card-top">
              <h3>{r.title}</h3>
              <div className="research-rank-badge">#{r.rank||i+1}</div>
            </div>
            <div className="research-meta">
              <div className="research-meta-row"><FaUsers/><span>{Array.isArray(r.authors)?r.authors.join(', '):r.authors||'—'}</span></div>
              <div className="research-meta-row"><FaBook/><span>{r.program}</span></div>
              <div className="research-meta-row"><FaCalendarAlt/><span>{r.year_published}</span></div>
              <div className="research-meta-row"><FaFolder/><span>{r.category}</span></div>
            </div>
            <div className="research-score-bar">
              <span>Evaluation Score</span>
              <span className="research-score-val">{r.evaluation_score}</span>
            </div>
            <button className="btn-danger" style={{marginTop:'8px',width:'100%',padding:'8px'}} onClick={()=>handleDelete(r.id)}><FaTrash/> Delete</button>
          </div>
        ))}
      </div>

      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2>Add Research</h2><button className="modal-close" onClick={()=>setShowModal(false)}><FaTimes/></button></div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div className="form-group"><label>Title *</label><input required value={form.title} onChange={e=>ff('title',e.target.value)}/></div>
                <div className="form-grid">
                  <div className="form-group"><label>Program</label>
                    <select value={form.program} onChange={e=>ff('program',e.target.value)}><option>BSIT</option><option>BSCS</option></select>
                  </div>
                  <div className="form-group"><label>Year Published</label><input type="number" value={form.year_published} onChange={e=>ff('year_published',+e.target.value)}/></div>
                  <div className="form-group"><label>Category</label><input value={form.category} onChange={e=>ff('category',e.target.value)}/></div>
                </div>
                <div className="form-group"><label>Evaluation Score</label><input type="number" step="0.1" min="0" max="100" value={form.evaluation_score} onChange={e=>ff('evaluation_score',e.target.value)}/></div>
                <div className="form-group">
                  <label>Authors</label>
                  <div className="tag-input-wrap">
                    {form.authors.map(a=><span key={a} className="tag-chip">{a}<button type="button" onClick={()=>ff('authors',form.authors.filter(x=>x!==a))}><FaTimes size={9}/></button></span>)}
                    <input value={authorInput} onChange={e=>setAuthorInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addAuthor();}}} placeholder="Author name"/>
                  </div>
                  <button type="button" className="tag-add-btn" onClick={addAuthor}>+ Add Author</button>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={()=>setShowModal(false)} disabled={saving}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving…':'Add Research'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
