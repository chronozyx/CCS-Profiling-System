import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { api } from '../../api/index.js';
import Loader from '../../components/Loader.jsx';
import {
  FaUserGraduate, FaChalkboardTeacher, FaCalendarAlt,
  FaClock, FaSearch, FaTrophy, FaFlask, FaBook, FaDoorOpen,
} from 'react-icons/fa';
import { MdPeople, MdHistory } from 'react-icons/md';

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function friendlyAction(action) {
  const m = action.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/i);
  if (!m) return action;
  const [, method, path] = m;
  const seg = path.split('/').filter(Boolean);
  const resource = seg[1] || seg[0] || path;
  const map = { GET: 'Viewed', POST: 'Created', PUT: 'Updated', DELETE: 'Deleted', PATCH: 'Modified' };
  return `${map[method] || method} ${resource}`;
}

// Map an audit log action string to a frontend route
function actionToRoute(action) {
  const m = action.match(/^[A-Z]+\s+\/api\/([^/]+)/i);
  if (!m) return null;
  const resource = m[1].toLowerCase();
  const routeMap = {
    students:     '/students',
    faculty:      '/faculty',
    events:       '/events',
    schedules:    '/scheduling',
    research:     '/research',
    rooms:        '/rooms',
    materials:    '/instructional',
    users:        '/users',
    audit:        '/audit',
  };
  return routeMap[resource] || null;
}

// ── Analog Clock ───────────────────────────────────────────────────────────
function ClockFace({ time }) {
  const s = time.getSeconds();
  const m = time.getMinutes();
  const h = time.getHours() % 12;
  const secDeg  = s * 6;
  const minDeg  = m * 6 + s * 0.1;
  const hourDeg = h * 30 + m * 0.5;
  const hand = (deg, len) => ({
    x2: 60 + len * Math.sin((deg * Math.PI) / 180),
    y2: 60 - len * Math.cos((deg * Math.PI) / 180),
  });
  return (
    <svg className="clock-face-svg" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="56" className="cf-ring cf-ring-outer" />
      <circle cx="60" cy="60" r="44" className="cf-ring cf-ring-inner" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <line key={i} x1={60+50*Math.sin(a)} y1={60-50*Math.cos(a)} x2={60+44*Math.sin(a)} y2={60-44*Math.cos(a)} className="cf-tick" />;
      })}
      {Array.from({ length: 60 }).map((_, i) => {
        if (i % 5 === 0) return null;
        const a = (i * 6 * Math.PI) / 180;
        return <line key={i} x1={60+56*Math.sin(a)} y1={60-56*Math.cos(a)} x2={60+52*Math.sin(a)} y2={60-52*Math.cos(a)} className="cf-min-tick" />;
      })}
      <line x1="60" y1="60" {...hand(hourDeg, 26)} className="cf-hand cf-hour" />
      <line x1="60" y1="60" {...hand(minDeg,  36)} className="cf-hand cf-minute" />
      <line x1="60" y1="60" {...hand(secDeg,  40)} className="cf-hand cf-second" />
      <circle cx="60" cy="60" r="3" className="cf-center" />
    </svg>
  );
}

// ── Mini Calendar ──────────────────────────────────────────────────────────
function MiniCalendar({ date }) {
  const year  = date.getFullYear();
  const month = date.getMonth();
  const today = date.getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return (
    <div className="mini-calendar">
      <div className="mc-header">{monthName}</div>
      <div className="mc-weekdays">{['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="mc-wd">{d}</span>)}</div>
      <div className="mc-body">
        {weeks.map((week, wi) => (
          <div key={wi} className="mc-week">
            {Array.from({ length: 7 }).map((_, di) => {
              const day = week[di] ?? null;
              return (
                <span key={di} className={`mc-day${!day ? ' mc-empty' : ''}${day === today ? ' mc-today' : ''}`}>
                  {day}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Global Search ──────────────────────────────────────────────────────────
function GlobalSearch() {
  const navigate = useNavigate();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState(null);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const ref   = useRef(null);
  const timer = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const data = await api.search(q);
      setResults(data); // { students, faculty, events }
    } catch { setResults(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResults(null); setOpen(false); return; }
    setOpen(true);
    timer.current = setTimeout(() => search(query), 350);
    return () => clearTimeout(timer.current);
  }, [query, search]);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (path) => { setOpen(false); setQuery(''); navigate(path); };
  const total = results
    ? (results.students?.length || 0) + (results.faculty?.length || 0) + (results.events?.length || 0)
      + (results.research?.length || 0) + (results.subjects?.length || 0) + (results.rooms?.length || 0)
    : 0;

  return (
    <div className="gs-wrap" ref={ref}>
      <div className="gs-input-wrap">
        <FaSearch className="gs-icon" />
        <input
          className="gs-input"
          placeholder="Search students, faculty, events, research…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
        />
        {query && <button className="gs-clear" onClick={() => { setQuery(''); setResults(null); setOpen(false); }}>×</button>}
      </div>

      {open && (
        <div className="gs-dropdown">
          {loading && <div className="gs-loading"><Loader size={28} /></div>}

          {!loading && results && total === 0 && (
            <div className="gs-empty">No results for "{query}"</div>
          )}

          {!loading && results && total > 0 && (
            <>
              {results.students?.length > 0 && (
                <div className="gs-section">
                  <div className="gs-section-label gs-section-label--link" onClick={() => go('/students')}>
                    <FaUserGraduate size={11} /> Students
                    <span className="gs-see-all">See all →</span>
                  </div>
                  {results.students.map((s, i) => (
                    <div key={i} className="gs-item" onClick={() => go(`/students/${s.id}`)}>
                      <div className="gs-item-avatar">{s.first_name?.[0]}{s.last_name?.[0]}</div>
                      <div>
                        <div className="gs-item-name">{s.first_name} {s.last_name}</div>
                        <div className="gs-item-sub">{s.program} · {s.year_level}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.faculty?.length > 0 && (
                <div className="gs-section">
                  <div className="gs-section-label gs-section-label--link" onClick={() => go('/faculty')}>
                    <FaChalkboardTeacher size={11} /> Faculty
                    <span className="gs-see-all">See all →</span>
                  </div>
                  {results.faculty.map((f, i) => (
                    <div key={i} className="gs-item" onClick={() => go(`/faculty/${f.id}`)}>
                      <div className="gs-item-avatar">{f.first_name?.[0]}{f.last_name?.[0]}</div>
                      <div>
                        <div className="gs-item-name">{f.title} {f.first_name} {f.last_name}</div>
                        <div className="gs-item-sub">{f.department}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.events?.length > 0 && (
                <div className="gs-section">
                  <div className="gs-section-label gs-section-label--link" onClick={() => go('/events')}>
                    <FaCalendarAlt size={11} /> Events
                    <span className="gs-see-all">See all →</span>
                  </div>
                  {results.events.map((e, i) => (
                    <div key={i} className="gs-item" onClick={() => go('/events')}>
                      <div className="gs-item-avatar gs-item-avatar--event"><FaCalendarAlt size={13} /></div>
                      <div>
                        <div className="gs-item-name">{e.title}</div>
                        <div className="gs-item-sub">{e.type} · {e.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.research?.length > 0 && (
                <div className="gs-section">
                  <div className="gs-section-label gs-section-label--link" onClick={() => go('/research')}>
                    <FaFlask size={11} /> Research
                    <span className="gs-see-all">See all →</span>
                  </div>
                  {results.research.map((r, i) => (
                    <div key={i} className="gs-item" onClick={() => go('/research')}>
                      <div className="gs-item-avatar gs-item-avatar--event"><FaFlask size={13} /></div>
                      <div>
                        <div className="gs-item-name">{r.title.length > 50 ? r.title.slice(0, 50) + '…' : r.title}</div>
                        <div className="gs-item-sub">{r.category}{r.year_published ? ` · ${r.year_published}` : ''}{r.authors ? ` · ${r.authors}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.subjects?.length > 0 && (
                <div className="gs-section">
                  <div className="gs-section-label gs-section-label--link" onClick={() => go('/scheduling')}>
                    <FaBook size={11} /> Subjects
                    <span className="gs-see-all">See all →</span>
                  </div>
                  {results.subjects.map((s, i) => (
                    <div key={i} className="gs-item" onClick={() => go('/scheduling')}>
                      <div className="gs-item-avatar gs-item-avatar--event"><FaBook size={13} /></div>
                      <div>
                        <div className="gs-item-name">{s.code} — {s.title}</div>
                        <div className="gs-item-sub">{s.type} · {s.units} units</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.rooms?.length > 0 && (
                <div className="gs-section">
                  <div className="gs-section-label gs-section-label--link" onClick={() => go('/rooms')}>
                    <FaDoorOpen size={11} /> Rooms
                    <span className="gs-see-all">See all →</span>
                  </div>
                  {results.rooms.map((r, i) => (
                    <div key={i} className="gs-item" onClick={() => go('/rooms')}>
                      <div className="gs-item-avatar gs-item-avatar--event"><FaDoorOpen size={13} /></div>
                      <div>
                        <div className="gs-item-name">{r.room_id} — {r.name}</div>
                        <div className="gs-item-sub">{r.type} · Capacity: {r.capacity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, colorClass, to }) {
  const navigate = useNavigate();
  return (
    <div className={`stat-card ${colorClass}`} onClick={() => navigate(to)} style={{ cursor: 'pointer' }}>
      <div className="stat-icon"><Icon size={30} /></div>
      <div className="stat-info">
        <h3>{value.toLocaleString()}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const stats = data || { totalStudents: 0, totalFaculty: 0, upcomingEvents: 0, totalSchedules: 0 };
  const dist  = data?.facultyDistribution || [];
  const researchers = data?.topResearchers || [];
  const recentStudents = data?.recentStudents || [];
  const recentActivity = data?.recentActivity || [];

  const rankIcon = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';

  return (
    <div className="dashboard-container">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="db-title">CCS Dashboard</h1>
          <p className="db-subtitle">College of Computer Studies — Profiling System</p>
        </div>
        <GlobalSearch />
      </div>

      <div className="dashboard-main-layout">

        {/* ══ LEFT COLUMN ══ */}
        <div className="dashboard-left">

          {/* Stat cards */}
          <div className="stats-grid">
            <StatCard icon={FaUserGraduate}     value={stats.totalStudents}  label="Total Students"   colorClass="students"  to="/students" />
            <StatCard icon={FaChalkboardTeacher} value={stats.totalFaculty}   label="Total Faculty"    colorClass="faculty"   to="/faculty" />
            <StatCard icon={FaCalendarAlt}       value={stats.upcomingEvents} label="Upcoming Events"  colorClass="events"    to="/events" />
            <StatCard icon={FaClock}             value={stats.totalSchedules} label="Total Schedules"  colorClass="schedules" to="/scheduling" />
          </div>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
              <Loader size={48} />
            </div>
          ) : (
            <div className="dashboard-widgets">

              {/* Faculty Distribution */}
              <div className="widget distribution-widget">
                <h3 className="widget-h3-link" onClick={() => navigate('/faculty')}><MdPeople /> Faculty Distribution <span className="widget-see-all">See all →</span></h3>
                {dist.length === 0
                  ? <p className="widget-empty">No faculty data.</p>
                  : (
                    <div className="distribution-list">
                      {dist.map((d, i) => (
                        <div key={i} className="dist-item dist-item--clickable" title={`${d.count} faculty (${d.percent}%)`} onClick={() => navigate(`/faculty?dept=${encodeURIComponent(d.label)}`)}>
                          <span className="dist-label">{d.label}</span>
                          <div className="progress-bar">
                            <div className="progress" style={{ width: `${d.percent}%` }} />
                          </div>
                          <span className="dist-count">{d.count}</span>
                          <span className="dist-pct">{d.percent}%</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Top Researchers */}
              <div className="widget researcher-widget">
                <h3 className="widget-h3-link" onClick={() => navigate('/research')}><FaTrophy /> Top Researchers <span className="widget-see-all">See all →</span></h3>
                {researchers.length === 0
                  ? <p className="widget-empty">No research data.</p>
                  : (
                    <div className="researcher-list">
                      {researchers.map((r, i) => (
                        <div key={i} className="researcher-item" onClick={() => navigate('/research')} style={{ cursor:'pointer' }}>
                          <span className="rank-medal">{rankIcon(i)}</span>
                          <div className="researcher-info">
                            <strong title={r.title}>{r.title.length > 48 ? r.title.slice(0, 48) + '…' : r.title}</strong>
                            <small>Score: <b>{r.score}</b>{r.authors[0] ? ` · ${r.authors[0]}` : ''}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Recently Added Students */}
              <div className="widget recent-students-widget">
                <h3 className="widget-h3-link" onClick={() => navigate('/students')}><FaUserGraduate /> Recently Added Students <span className="widget-see-all">See all →</span></h3>
                {recentStudents.length === 0
                  ? <p className="widget-empty">No students yet.</p>
                  : (
                    <div className="recent-students-list">
                      {recentStudents.map((s, i) => (
                        <div key={i} className="recent-student-item" onClick={() => navigate(`/students/${s.id}`)} style={{ cursor:'pointer' }}>
                          <div className="rs-avatar">{s.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                          <div className="rs-info">
                            <strong>{s.name}</strong>
                            <small>{s.program} · {s.year}</small>
                            <div className="rs-skills">
                              {s.skills.slice(0, 3).map(sk => <span key={sk} className="rs-skill-tag">{sk}</span>)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Recent Activity */}
              <div className="widget activity-widget">
                <h3 className="widget-h3-link" onClick={() => navigate('/audit')}><MdHistory /> Recent Activity <span className="widget-see-all">See all →</span></h3>
                {recentActivity.length === 0
                  ? <p className="widget-empty">No activity yet.</p>
                  : (
                    <div className="activity-list">
                      {recentActivity.map((a, i) => {
                        const route = actionToRoute(a.action);
                        return (
                          <div key={i} className="activity-item" onClick={() => route && navigate(route)} style={{ cursor: route ? 'pointer' : 'default' }}>
                            <div className="activity-dot" />
                            <div className="activity-content">
                              <strong>{friendlyAction(a.action)}</strong>
                              <small>{a.user} · {timeAgo(a.time)}</small>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>

            </div>
          )}
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="dashboard-right">
          <div className="time-widget">
            <div className="tw-bg-ring tw-ring-1" />
            <div className="tw-bg-ring tw-ring-2" />
            <div className="tw-bg-ring tw-ring-3" />

            <div className="tw-clock-wrap">
              <ClockFace time={now} />
            </div>

            <div className="tw-time-glow" aria-hidden="true">{timeStr}</div>
            <div className="tw-time">{timeStr}</div>
            <div className="tw-date">{dateStr}</div>

            <div className="tw-divider" />
            <MiniCalendar date={now} />
          </div>
        </div>

      </div>
    </div>
  );
}
