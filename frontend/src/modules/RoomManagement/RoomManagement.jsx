import { useState, useEffect, useCallback } from 'react';
import './RoomManagement.css';
import { api } from '../../api/index.js';
import { FaBuilding, FaPlus, FaMapMarkerAlt, FaChair, FaUsers, FaEdit, FaTrash, FaTimes, FaSync } from 'react-icons/fa';

const EMPTY = { room_id:'', name:'', type:'LECTURE_ROOM', building:'CCS Building', floor:'', capacity:'', current_occupancy:'0', status:'Available' };

function utilStatus(pct) { if(pct>=90) return 'critical'; if(pct>=75) return 'warning'; return 'normal'; }

export default function RoomManagement() {
  const [rooms, setRooms]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState({...EMPTY});
  const ff = (k,v) => setForm(p=>({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try { setRooms(await api.getRooms()); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(()=>{ load(); },[load]);

  const total     = rooms.length;
  const available = rooms.filter(r=>r.status==='Available').length;
  const occupied  = rooms.filter(r=>r.status==='Occupied').length;

  const openCreate = () => { setForm({...EMPTY}); setEditId(null); setShowModal(true); };
  const openEdit   = r  => { setForm({ room_id:r.room_id, name:r.name, type:r.type, building:r.building||'', floor:r.floor||'', capacity:r.capacity, current_occupancy:r.current_occupancy||0, status:r.status }); setEditId(r.id); setShowModal(true); };

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const body = { ...form, capacity: Number(form.capacity), current_occupancy: Number(form.current_occupancy)||0 };
      if(editId) {
        const updated = await api.updateRoom(editId, body);
        setRooms(prev=>prev.map(r=>r.id===editId?updated:r));
      } else {
        const created = await api.createRoom(body);
        setRooms(prev=>[...prev, created]);
      }
      setShowModal(false);
    } catch(e) { alert('Save failed: '+e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if(!window.confirm('Delete this room?')) return;
    try { await api.deleteRoom(id); setRooms(prev=>prev.filter(r=>r.id!==id)); }
    catch(e) { alert('Delete failed: '+e.message); }
  };

  return (
    <div className="room-container">
      <div className="page-header">
        <div className="page-header-left"><h1>Room Management</h1><p>{total} rooms total</p></div>
        <div style={{display:'flex',gap:'8px'}}>
          <button className="btn-secondary" onClick={load} title="Refresh"><FaSync/></button>
          <button className="btn-primary" onClick={openCreate}><FaPlus/> Add Room</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-tile"><span className="stat-tile-num">{total}</span><span className="stat-tile-label">Total Rooms</span></div>
        <div className="stat-tile"><span className="stat-tile-num" style={{color:'#16a34a'}}>{available}</span><span className="stat-tile-label">Available</span></div>
        <div className="stat-tile"><span className="stat-tile-num" style={{color:'#d97706'}}>{occupied}</span><span className="stat-tile-label">Occupied</span></div>
      </div>

      {loading&&<div className="empty-state">Loading rooms…</div>}
      <div className="rooms-grid">
        {!loading&&rooms.length===0&&<div className="empty-state">No rooms found.</div>}
        {rooms.map(room=>{
          const pct=((room.current_occupancy/room.capacity)*100).toFixed(1);
          const us=utilStatus(+pct);
          const fillClass=us==='critical'?'progress-fill-red':us==='warning'?'progress-fill-yellow':'progress-fill-green';
          const typeLabel = room.type==='LABORATORY_ROOM'?'Laboratory Room':'Lecture Room';
          return (
            <div key={room.id} className="room-card">
              <div className="room-card-top">
                <div><h3>{room.name}</h3><p className="room-id">{room.room_id}</p></div>
                <span className={`room-status-badge ${room.status?.toLowerCase()}`}>{room.status}</span>
              </div>
              <div className="room-details">
                <div className="room-detail-row"><span className="rd-label"><FaBuilding/> Building</span><span className="rd-value">{room.building}</span></div>
                <div className="room-detail-row"><span className="rd-label"><FaMapMarkerAlt/> Floor</span><span className="rd-value">{room.floor}</span></div>
                <div className="room-detail-row"><span className="rd-label"><FaChair/> Type</span><span className="rd-value">{typeLabel}</span></div>
                <div className="room-detail-row"><span className="rd-label"><FaUsers/> Capacity</span><span className="rd-value">{room.capacity}</span></div>
              </div>
              <div className="room-capacity-section">
                <div className="room-cap-header"><span>Utilization</span><span className={`util-pct ${us}`}>{pct}%</span></div>
                <div className="progress-track"><div className={`progress-fill ${fillClass}`} style={{width:`${Math.min(+pct,100)}%`}}/></div>
                <div className="room-cap-nums">{room.current_occupancy} / {room.capacity} students</div>
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
                <button className="btn-secondary" style={{flex:1}} onClick={()=>openEdit(room)}><FaEdit/> Edit</button>
                <button className="btn-danger" style={{flex:1}} onClick={()=>handleDelete(room.id)}><FaTrash/> Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2>{editId?'Edit Room':'Add Room'}</h2><button className="modal-close" onClick={()=>setShowModal(false)}><FaTimes/></button></div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div className="form-grid">
                  <div className="form-group"><label>Room ID *</label><input required value={form.room_id} onChange={e=>ff('room_id',e.target.value)} placeholder="LR-401"/></div>
                  <div className="form-group"><label>Room Name *</label><input required value={form.name} onChange={e=>ff('name',e.target.value)}/></div>
                </div>
                <div className="form-group"><label>Type *</label>
                  <select value={form.type} onChange={e=>ff('type',e.target.value)}><option value="LECTURE_ROOM">Lecture Room</option><option value="LABORATORY_ROOM">Laboratory Room</option></select>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>Building</label><input value={form.building} onChange={e=>ff('building',e.target.value)}/></div>
                  <div className="form-group"><label>Floor</label><input value={form.floor} onChange={e=>ff('floor',e.target.value)}/></div>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>Capacity *</label><input required type="number" min="1" value={form.capacity} onChange={e=>ff('capacity',e.target.value)}/></div>
                  <div className="form-group"><label>Current Occupancy</label><input type="number" min="0" value={form.current_occupancy} onChange={e=>ff('current_occupancy',e.target.value)}/></div>
                </div>
                <div className="form-group"><label>Status</label>
                  <select value={form.status} onChange={e=>ff('status',e.target.value)}><option>Available</option><option>Occupied</option></select>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={()=>setShowModal(false)} disabled={saving}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving…':editId?'Save Changes':'Add Room'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
