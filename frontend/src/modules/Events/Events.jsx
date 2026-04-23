import { useState, useEffect, useCallback } from 'react';
import './Events.css';
import Loader from '../../components/Loader.jsx';
import { api } from '../../api/index.js';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaChalkboardTeacher, FaUsers, FaPlus, FaTimes, FaTrash, FaEdit, FaSync } from 'react-icons/fa';

const EMPTY = { title:'', type:'Seminar', date:'', time:'', venue:'', faculty:'', participants:'' };

export default function Events() {
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState({...EMPTY});
  const ff = (k,v) => setForm(p=>({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try { setEvents(await api.getEvents()); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(()=>{ load(); },[load]);

  const openCreate = () => { setForm({...EMPTY}); setEditId(null); setShowModal(true); };
  const openEdit   = ev => { setForm({ title:ev.title, type:ev.type, date:ev.date?.slice(0,10)||'', time:ev.time||'', venue:ev.venue||'', faculty:ev.faculty||'', participants:ev.participants||'' }); setEditId(ev.id); setShowModal(true); };

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const body = { ...form, participants: Number(form.participants)||0 };
      if(editId) {
        const updated = await api.updateEvent(editId, body);
        setEvents(prev=>prev.map(ev=>ev.id===editId?updated:ev));
      } else {
        const created = await api.createEvent({...body, status:'Upcoming'});
        setEvents(prev=>[...prev, created]);
      }
      setShowModal(false);
    } catch(e) { alert('Save failed: '+e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if(!window.confirm('Delete this event?')) return;
    try { await api.deleteEvent(id); setEvents(prev=>prev.filter(ev=>ev.id!==id)); }
    catch(e) { alert('Delete failed: '+e.message); }
  };

  return (
    <div className="events-container">
      <div className="page-header">
        <div className="page-header-left"><h1>Events Management</h1><p>{events.length} events scheduled</p></div>
        <div style={{display:'flex',gap:'8px'}}>
          <button className="btn-secondary" onClick={load} title="Refresh"><FaSync/></button>
          <button className="btn-primary" onClick={openCreate}><FaPlus/> Create Event</button>
        </div>
      </div>

      {loading&&<div className="empty-state"><Loader padded /></div>}
      <div className="events-grid">
        {!loading&&events.length===0&&<div className="empty-state">No events yet.</div>}
        {events.map(ev=>(
          <div key={ev.id} className="event-card">
            <div className="event-card-top">
              <h3>{ev.title}</h3>
              <span className={`event-type-badge ${ev.type?.toLowerCase()}`}>{ev.type}</span>
            </div>
            <div className="event-details">
              <div className="event-detail-row"><FaCalendarAlt/><span>{ev.date?.slice(0,10)}</span></div>
              <div className="event-detail-row"><FaClock/><span>{ev.time}</span></div>
              <div className="event-detail-row"><FaMapMarkerAlt/><span>{ev.venue}</span></div>
              <div className="event-detail-row"><FaChalkboardTeacher/><span>{ev.faculty}</span></div>
              <div className="event-detail-row"><FaUsers/><span>{ev.participants} participants</span></div>
            </div>
            <div className="event-card-actions">
              <button className="btn-secondary" style={{flex:1}} onClick={()=>openEdit(ev)}><FaEdit/> Edit</button>
              <button className="btn-danger" style={{flex:1}} onClick={()=>handleDelete(ev.id)}><FaTrash/> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId?'Edit Event':'Create New Event'}</h2>
              <button className="modal-close" onClick={()=>setShowModal(false)}><FaTimes/></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div className="form-group"><label>Event Title *</label><input required value={form.title} onChange={e=>ff('title',e.target.value)}/></div>
                <div className="form-group"><label>Type *</label>
                  <select value={form.type} onChange={e=>ff('type',e.target.value)}><option>Seminar</option><option>Workshop</option><option>Competition</option></select>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>Date *</label><input required type="date" value={form.date} onChange={e=>ff('date',e.target.value)}/></div>
                  <div className="form-group"><label>Time</label><input type="time" value={form.time} onChange={e=>ff('time',e.target.value)}/></div>
                </div>
                <div className="form-group"><label>Venue</label><input value={form.venue} onChange={e=>ff('venue',e.target.value)}/></div>
                <div className="form-group"><label>Assigned Faculty</label><input value={form.faculty} onChange={e=>ff('faculty',e.target.value)}/></div>
                <div className="form-group"><label>Expected Participants</label><input type="number" min="0" value={form.participants} onChange={e=>ff('participants',e.target.value)}/></div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={()=>setShowModal(false)} disabled={saving}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving…':editId?'Save Changes':'Create Event'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
