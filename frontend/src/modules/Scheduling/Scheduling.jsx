import { useState } from 'react';
import './Scheduling.css';
import { FaCalendarAlt, FaPlus } from 'react-icons/fa';

const SEED = [
  { id:1, code:'IT301',  subject:'Data Structures',     type:'Lecture',     hours:2, units:2, section:'3A', faculty:'Dr. Maria Santos', room:'LR-201',  roomType:'Lecture Room',    capacity:40, enrolled:35, day:'Monday',    time:'09:00 AM – 11:00 AM' },
  { id:2, code:'IT301L', subject:'Data Structures Lab', type:'Laboratory',  hours:3, units:1, section:'3A', faculty:'Dr. Maria Santos', room:'LAB-101', roomType:'Laboratory Room', capacity:30, enrolled:35, day:'Tuesday',   time:'01:00 PM – 04:00 PM' },
  { id:3, code:'IT401',  subject:'Machine Learning',    type:'Pure Lecture',hours:3, units:3, section:'4A', faculty:'Dr. Maria Santos', room:'LR-305',  roomType:'Lecture Room',    capacity:45, enrolled:42, day:'Wednesday', time:'10:00 AM – 01:00 PM' },
];

function capStatus(enrolled, capacity) {
  const pct = (enrolled / capacity) * 100;
  if (pct > 100) return 'overcapacity';
  if (pct >= 90)  return 'near-full';
  return 'available';
}

function typeBadgeClass(type) {
  if (type === 'Laboratory')   return 'laboratory';
  if (type === 'Pure Lecture') return 'pure';
  return 'lecture';
}

export default function Scheduling() {
  const [schedules] = useState(SEED);

  return (
    <div className="scheduling-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Scheduling</h1>
          <p>{schedules.length} schedules this semester</p>
        </div>
        <button className="btn-primary"><FaPlus /> Add Schedule</button>
      </div>

      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div className="card-title"><FaCalendarAlt /> Subject Time Types</div>
        <div className="time-types-grid">
          <div className="time-type-tile"><div className="tt-label">Lecture</div><div className="tt-desc">2 hours = 2 units</div></div>
          <div className="time-type-tile"><div className="tt-label">Laboratory</div><div className="tt-desc">3 hours = 1 unit</div></div>
          <div className="time-type-tile"><div className="tt-label">Pure Lecture</div><div className="tt-desc">3 hours = 3 units</div></div>
        </div>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th><th>Subject</th><th>Type</th><th>Section</th>
              <th>Faculty</th><th>Room</th><th>Capacity</th><th>Day</th><th>Time</th><th>Units</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(s => {
              const cs = capStatus(s.enrolled, s.capacity);
              return (
                <tr key={s.id}>
                  <td><strong>{s.code}</strong></td>
                  <td>{s.subject}</td>
                  <td><span className={`type-badge ${typeBadgeClass(s.type)}`}>{s.type}</span></td>
                  <td>{s.section}</td>
                  <td>{s.faculty}</td>
                  <td>
                    <div className="room-cell">
                      <span>{s.room}</span>
                      <small>{s.roomType}</small>
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
                  <td style={{ whiteSpace:'nowrap' }}>{s.time}</td>
                  <td><strong>{s.units}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
