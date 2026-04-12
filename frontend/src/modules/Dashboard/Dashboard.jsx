import { useState, useEffect } from 'react';
import './Dashboard.css';
import { api } from '../../api/index.js';
import { FaUserGraduate, FaChalkboardTeacher, FaCalendarAlt, FaClock, FaSearch, FaTrophy, FaChartLine } from 'react-icons/fa';
import { MdPeople } from 'react-icons/md';

/* ── Clock-face SVG drawn with JS so it rotates in real time ── */
const ClockFace = ({ time }) => {
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours   = time.getHours() % 12;

  const secDeg  = seconds * 6;
  const minDeg  = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <svg className="clock-face-svg" viewBox="0 0 120 120" aria-hidden="true">
      {/* Outer ring */}
      <circle cx="60" cy="60" r="56" className="cf-ring cf-ring-outer" />
      <circle cx="60" cy="60" r="44" className="cf-ring cf-ring-inner" />

      {/* Hour ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 60 + 50 * Math.sin(angle);
        const y1 = 60 - 50 * Math.cos(angle);
        const x2 = 60 + 44 * Math.sin(angle);
        const y2 = 60 - 44 * Math.cos(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="cf-tick" />;
      })}

      {/* Radial minute lines */}
      {Array.from({ length: 60 }).map((_, i) => {
        const angle = (i * 6 * Math.PI) / 180;
        const x1 = 60 + 56 * Math.sin(angle);
        const y1 = 60 - 56 * Math.cos(angle);
        const x2 = 60 + 52 * Math.sin(angle);
        const y2 = 60 - 52 * Math.cos(angle);
        return i % 5 !== 0
          ? <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="cf-min-tick" />
          : null;
      })}

      {/* Hour hand */}
      <line
        x1="60" y1="60"
        x2={60 + 26 * Math.sin((hourDeg * Math.PI) / 180)}
        y2={60 - 26 * Math.cos((hourDeg * Math.PI) / 180)}
        className="cf-hand cf-hour"
      />
      {/* Minute hand */}
      <line
        x1="60" y1="60"
        x2={60 + 36 * Math.sin((minDeg * Math.PI) / 180)}
        y2={60 - 36 * Math.cos((minDeg * Math.PI) / 180)}
        className="cf-hand cf-minute"
      />
      {/* Second hand */}
      <line
        x1="60" y1="60"
        x2={60 + 40 * Math.sin((secDeg * Math.PI) / 180)}
        y2={60 - 40 * Math.cos((secDeg * Math.PI) / 180)}
        className="cf-hand cf-second"
      />
      {/* Center dot */}
      <circle cx="60" cy="60" r="3" className="cf-center" />
    </svg>
  );
};

/* ── Mini calendar ── */
const MiniCalendar = ({ date }) => {
  const year  = date.getFullYear();
  const month = date.getMonth();
  const today = date.getDate();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7)
    weeks.push(cells.slice(i, i + 7));

  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="mini-calendar">
      <div className="mc-header">{monthName}</div>
      <div className="mc-weekdays">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <span key={d} className="mc-wd">{d}</span>
        ))}
      </div>
      <div className="mc-body">
        {weeks.map((week, wi) => (
          <div key={wi} className="mc-week">
            {Array.from({ length: 7 }).map((_, di) => {
              const day = week[di] ?? null;
              return (
                <span
                  key={di}
                  className={`mc-day ${!day ? 'mc-empty' : ''} ${day === today ? 'mc-today' : ''}`}
                >
                  {day}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Main Dashboard ── */
const Dashboard = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const [stats, setStats] = useState({ totalStudents:0, totalFaculty:0, upcomingEvents:0, totalSchedules:0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [topResearchers, setTopResearchers] = useState([]);

  useEffect(() => {
    api.getDashboard().then(d => {
      setStats({ totalStudents: d.totalStudents, totalFaculty: d.totalFaculty, upcomingEvents: d.upcomingEvents, totalSchedules: d.totalSchedules });
      setRecentStudents(d.recentStudents || []);
      setTopResearchers(d.topResearchers || []);
    }).catch(() => {});
  }, []);

  const [recentActivities] = useState([
    { id: 1, action: 'New student enrolled',          time: '5 mins ago',  user: 'Admin'         },
    { id: 2, action: 'Faculty profile updated',        time: '15 mins ago', user: 'Dr. Smith'     },
    { id: 3, action: 'Event created: Tech Summit 2026',time: '1 hour ago',  user: 'Dean'          },
    { id: 4, action: 'Research paper submitted',       time: '2 hours ago', user: 'Prof. Johnson' }
  ]);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>CCS Dashboard</h1>
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Global Search…" />
        </div>
      </div>

      <div className="dashboard-main-layout">
        {/* ── LEFT COLUMN ── */}
        <div className="dashboard-left">
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card students">
              <div className="stat-icon"><FaUserGraduate size={36} /></div>
              <div className="stat-info"><h3>{stats.totalStudents}</h3><p>Total Students</p></div>
            </div>
            <div className="stat-card faculty">
              <div className="stat-icon"><FaChalkboardTeacher size={36} /></div>
              <div className="stat-info"><h3>{stats.totalFaculty}</h3><p>Total Faculty</p></div>
            </div>
            <div className="stat-card events">
              <div className="stat-icon"><FaCalendarAlt size={36} /></div>
              <div className="stat-info"><h3>{stats.upcomingEvents}</h3><p>Upcoming Events</p></div>
            </div>
            <div className="stat-card schedules">
              <div className="stat-icon"><FaClock size={36} /></div>
              <div className="stat-info"><h3>{stats.totalSchedules}</h3><p>Today's Schedule</p></div>
            </div>
          </div>

          {/* Widgets */}
          <div className="dashboard-widgets">
            <div className="widget chart-widget">
              <h3><FaChartLine /> Student Growth Chart</h3>
              <div className="chart-placeholder">
                <div className="bar" style={{height:'60%'}}><span>2023</span></div>
                <div className="bar" style={{height:'80%'}}><span>2024</span></div>
                <div className="bar" style={{height:'95%'}}><span>2025</span></div>
                <div className="bar" style={{height:'100%'}}><span>2026</span></div>
              </div>
            </div>

            <div className="widget distribution-widget">
              <h3><MdPeople /> Faculty Distribution</h3>
              <div className="distribution-list">
                <div className="dist-item">
                  <span>BSIT</span>
                  <div className="progress-bar"><div className="progress" style={{width:'65%'}}></div></div>
                  <span>45</span>
                </div>
                <div className="dist-item">
                  <span>BSCS</span>
                  <div className="progress-bar"><div className="progress" style={{width:'48%'}}></div></div>
                  <span>42</span>
                </div>
              </div>
            </div>

            <div className="widget researcher-widget">
              <h3><FaTrophy /> Best Researcher Panel</h3>
              <div className="researcher-list">
                {topResearchers.map((r, i) => (
                  <div key={i} className="researcher-item">
                    <span className="rank">#{r.rank||i+1}</span>
                    <div className="researcher-info">
                      <strong>{Array.isArray(r.authors)?r.authors[0]:r.name||'—'}</strong>
                      <small>Score: {r.score}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="widget activity-widget">
              <h3>📋 Recent Activity Logs</h3>
              <div className="activity-list">
                {recentActivities.map(a => (
                  <div key={a.id} className="activity-item">
                    <div className="activity-content">
                      <strong>{a.action}</strong>
                      <small>{a.user} · {a.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="widget recent-students-widget">
              <h3><FaUserGraduate /> Recently Added Students</h3>
              <div className="recent-students-list">
                {recentStudents.map((s, i) => (
                  <div key={i} className="recent-student-item">
                    <div className="rs-avatar">{s.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                    <div className="rs-info">
                      <strong>{s.name}</strong>
                      <small>{s.program} · {s.year}</small>
                      <div className="rs-skills">
                        {s.skills.map(sk => <span key={sk} className="rs-skill-tag">{sk}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN — Time & Date Widget ── */}
        <div className="dashboard-right">
          <div className="time-widget">
            {/* Decorative background rings */}
            <div className="tw-bg-ring tw-ring-1" />
            <div className="tw-bg-ring tw-ring-2" />
            <div className="tw-bg-ring tw-ring-3" />

            {/* Analog clock face */}
            <div className="tw-clock-wrap">
              <ClockFace time={now} />
            </div>

            {/* Digital time */}
            <div className="tw-time-glow" aria-hidden="true">{timeStr}</div>
            <div className="tw-time">{timeStr}</div>
            <div className="tw-date">{dateStr}</div>

            {/* Divider */}
            <div className="tw-divider" />

            {/* Mini calendar */}
            <MiniCalendar date={now} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
