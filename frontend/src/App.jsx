import { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './context/AuthContext.jsx';
import { api } from './api/index.js';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Loader from './components/Loader.jsx';
import {
  MdDashboard, MdPerson, MdPeople, MdSchedule,
  MdEvent, MdScience, MdBook, MdMeetingRoom,
  MdLightMode, MdDarkMode, MdLogout, MdMenu, MdClose,
  MdChevronLeft, MdChevronRight, MdSecurity, MdManageAccounts, MdLock,
  MdAssessment,
} from 'react-icons/md';
import { FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import Dashboard      from './modules/Dashboard/Dashboard';
import StudentProfile from './modules/StudentProfile/StudentProfile';
import StudentDetail  from './modules/StudentProfile/StudentDetail';
import FacultyProfile from './modules/FacultyProfile/FacultyProfile';
import FacultyDetail  from './modules/FacultyProfile/FacultyDetail';
import Events         from './modules/Events/Events';
import Scheduling     from './modules/Scheduling/Scheduling';
import Research       from './modules/Research/Research';
import Instructional  from './modules/Instructional/Instructional';
import RoomManagement from './modules/RoomManagement/RoomManagement';
import AuditLog       from './modules/AuditLog/AuditLog';
import Users          from './modules/Users/Users';
import Reports        from './modules/Reports/Reports';
import FacultyReport  from './modules/Reports/FacultyReport';
import StudentReport  from './modules/Reports/StudentReport';

// Each nav item maps to a URL path
const NAV_GROUPS = [
  {
    label: 'Main Menu',
    items: [
      { path: '/dashboard',    name: 'Dashboard',   nameStudent: null,         nameFaculty: null,         icon: MdDashboard,      roles: ['admin'] },
      { path: '/students',     name: 'Students',    nameStudent: 'My Profile', nameFaculty: null,         icon: MdPerson,         roles: ['admin','student'] },
      { path: '/faculty',      name: 'Faculty',     nameStudent: null,         nameFaculty: 'My Profile', icon: MdPeople,         roles: ['admin','faculty'] },
      { path: '/users',        name: 'Users',       nameStudent: null,         nameFaculty: null,         icon: MdManageAccounts, roles: ['admin'] },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/scheduling',   name: 'Scheduling',   icon: MdSchedule,    roles: ['admin', 'faculty'] },
      { path: '/events',       name: 'Events',       icon: MdEvent,       roles: ['admin'] },
      { path: '/research',     name: 'Research',     icon: MdScience,     roles: ['admin'] },
      { path: '/instructional',name: 'Instructional',icon: MdBook,        roles: ['admin', 'faculty'] },
      { path: '/rooms',        name: 'Rooms',        icon: MdMeetingRoom, roles: ['admin', 'faculty'] },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/reports',         name: 'Reports',      icon: MdAssessment,  roles: ['admin'] },
      { path: '/faculty-report',  name: 'My Report',    icon: MdAssessment,  roles: ['faculty'] },
      { path: '/student-report',  name: 'My Report',    icon: MdAssessment,  roles: ['student'] },
      { path: '/audit',           name: 'Audit Logs',   icon: MdSecurity,    roles: ['admin'] },
    ],
  },
];

// Map path → module id (used by can() in AuthContext)
const PATH_TO_MODULE = {
  '/dashboard':     'dashboard',
  '/students':      'student',
  '/students/:id':  'student',
  '/faculty':       'faculty',
  '/faculty/:id':   'faculty',
  '/users':         'users',
  '/scheduling':    'scheduling',
  '/events':        'events',
  '/research':      'research',
  '/instructional': 'instructional',
  '/rooms':         'rooms',
  '/reports':          'reports',
  '/faculty-report':   'faculty-report',
  '/student-report':   'student-report',
  '/audit':            'audit',
};

function getInitials(name = '', email = '') {
  if (name) return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

// ── Shell layout (sidebar + main area) ────────────────────────────────────
function AppShell() {
  const { user, logout, role, can } = useAuth();
  const navigate = useNavigate();
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode,   setDarkMode]   = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [tooltip,    setTooltip]    = useState({ text: '', y: 0 });
  const sidebarRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') { setDarkMode(true); document.documentElement.classList.add('dark'); }
  }, []);

  useEffect(() => {
    const handler = e => {
      if (mobileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target))
        setMobileOpen(false);
      if (profileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen, profileOpen]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const sidebarClass = [
    'sidebar',
    collapsed  ? 'sidebar--collapsed' : 'sidebar--expanded',
    mobileOpen ? 'sidebar--mobile-open' : '',
  ].join(' ');

  return (
    <div className={`app-root ${collapsed ? 'app--collapsed' : 'app--expanded'}`}>

      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <button className="hamburger-btn" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
        {mobileOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </button>

      {/* ══ SIDEBAR ══ */}
      <aside className={sidebarClass} ref={sidebarRef}>

        <div className="sb-header">
          <div className="sb-logo" onClick={() => collapsed && setCollapsed(false)}>
            <div className="sb-logo-ring"><img src="/ccs.png" alt="CCS" /></div>
            {!collapsed && (
              <div className="sb-logo-text">
                <span className="sb-logo-title">CCS</span>
                <span className="sb-logo-sub">Profiling System</span>
              </div>
            )}
          </div>
          <button
            className="sb-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <MdChevronRight size={18} /> : <MdChevronLeft size={18} />}
          </button>
        </div>

        {/* ── Nav groups — NavLink handles active state via URL ── */}
        <nav className="sb-nav">
          {NAV_GROUPS.map(group => {
            const visibleItems = group.items.filter(item => item.roles.includes(role));
            if (!visibleItems.length) return null;
            return (
              <div key={group.label} className="sb-group">
                {!collapsed && <span className="sb-group-label">{group.label}</span>}
                {collapsed && <div className="sb-group-divider" />}
                {visibleItems.map(({ path, name, nameStudent, nameFaculty, icon: Icon }) => {
                  const moduleId = PATH_TO_MODULE[path];
                  const label = (role === 'student' && nameStudent)
                    ? nameStudent
                    : (role === 'faculty' && nameFaculty)
                    ? nameFaculty
                    : name;

                  // Block forbidden paths — don't render the link at all
                  if (!can(moduleId)) return null;

                  return (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={() => setMobileOpen(false)}
                      onMouseEnter={e => collapsed && setTooltip({ text: label, y: e.currentTarget.getBoundingClientRect().top + 20 })}
                      onMouseLeave={() => setTooltip({ text: '', y: 0 })}
                      title={collapsed ? label : ''}
                      className={({ isActive }) =>
                        `sb-item${isActive ? ' sb-item--active' : ''}`
                      }
                    >
                      <span className="sb-item-icon"><Icon size={20} /></span>
                      {!collapsed && <span className="sb-item-label">{label}</span>}
                      {/* active dot is handled by CSS via sb-item--active */}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* ── Bottom ── */}
        <div className="sb-bottom">
          <div
            className="sb-profile sb-profile--clickable"
            onClick={() => setProfileOpen(o => !o)}
            title={collapsed ? user.name || 'Profile' : ''}
            onMouseEnter={e => collapsed && setTooltip({ text: user.name || 'Profile', y: e.currentTarget.getBoundingClientRect().top + 20 })}
            onMouseLeave={() => setTooltip({ text: '', y: 0 })}
          >
            <div className="sb-avatar">{getInitials(user.name, user.email)}</div>
            {!collapsed && (
              <>
                <div className="sb-profile-info">
                  <span className="sb-profile-name">{user.name || 'Admin'}</span>
                  <span className="sb-profile-role">
                    <FaShieldAlt size={9} /> {role === 'admin' ? 'Administrator' : role === 'faculty' ? 'Faculty' : 'Student'}
                  </span>
                </div>
                <span className="sb-profile-chevron">{profileOpen ? '▲' : '▼'}</span>
              </>
            )}
          </div>

          {/* Profile dropdown */}
          {profileOpen && (
            <div className="sb-profile-menu">
              {(role === 'faculty' || role === 'student') && (
                <button
                  className="sb-profile-menu-item"
                  onClick={() => { setShowChangePw(true); setProfileOpen(false); }}
                >
                  <span className="sb-item-icon"><MdLock size={17} /></span>
                  Change Password
                </button>
              )}
              <button
                className="sb-profile-menu-item"
                onClick={() => { toggleTheme(); setProfileOpen(false); }}
              >
                <span className="sb-item-icon">
                  {darkMode ? <MdLightMode size={17} /> : <MdDarkMode size={17} />}
                </span>
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button
                className="sb-profile-menu-item sb-profile-menu-item--logout"
                onClick={() => { setShowLogout(true); setProfileOpen(false); }}
              >
                <span className="sb-item-icon"><MdLogout size={17} /></span>
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {collapsed && tooltip.text && (
        <div className="sb-tooltip" style={{ top: tooltip.y }}>{tooltip.text}</div>
      )}

      {/* ══ MAIN CONTENT — Routes render here ══ */}
      <div className="app-main">
        <main className="main-content">
          <Routes>
            {/* Default redirect based on role */}
            <Route path="/" element={
              <Navigate to={role === 'student' ? '/students' : role === 'faculty' ? '/faculty' : '/dashboard'} replace />
            } />

            {/* Protected routes */}
            <Route path="/dashboard"     element={<ProtectedRoute module="dashboard">    <Dashboard />      </ProtectedRoute>} />
            <Route path="/students"      element={<ProtectedRoute module="student">      <StudentProfile /> </ProtectedRoute>} />
            <Route path="/students/:id"  element={<ProtectedRoute module="student">      <StudentDetail />  </ProtectedRoute>} />
            <Route path="/faculty"       element={<ProtectedRoute module="faculty">      <FacultyProfile /> </ProtectedRoute>} />
            <Route path="/faculty/:id"   element={<ProtectedRoute module="faculty">      <FacultyDetail />  </ProtectedRoute>} />
            <Route path="/users"         element={<ProtectedRoute module="users">        <Users />          </ProtectedRoute>} />
            <Route path="/scheduling"    element={<ProtectedRoute module="scheduling">   <Scheduling />     </ProtectedRoute>} />
            <Route path="/events"        element={<ProtectedRoute module="events">       <Events />         </ProtectedRoute>} />
            <Route path="/research"      element={<ProtectedRoute module="research">     <Research />       </ProtectedRoute>} />
            <Route path="/instructional" element={<ProtectedRoute module="instructional"><Instructional />  </ProtectedRoute>} />
            <Route path="/rooms"         element={<ProtectedRoute module="rooms">        <RoomManagement /> </ProtectedRoute>} />
            <Route path="/audit"         element={<ProtectedRoute module="audit">        <AuditLog />       </ProtectedRoute>} />
            <Route path="/reports"        element={<ProtectedRoute module="reports">         <Reports />        </ProtectedRoute>} />
            <Route path="/faculty-report" element={<ProtectedRoute module="faculty-report">  <FacultyReport />  </ProtectedRoute>} />
            <Route path="/student-report" element={<ProtectedRoute module="student-report">  <StudentReport />  </ProtectedRoute>} />

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-inner">
            <div className="footer-left">
              <img src="/ccs.png" alt="CCS Logo" className="footer-logo" />
              <div>
                <span className="footer-title">CCS Profiling System</span>
                <span className="footer-sub">College of Computing Studies</span>
              </div>
            </div>
            <div className="footer-center">© {new Date().getFullYear()} CCS 4IT-D. All rights reserved.</div>
            <div className="footer-right">v.3.4</div>
          </div>
        </footer>
      </div>

      {/* Logout modal */}
      {showLogout && (
        <div className="logout-overlay" onClick={() => setShowLogout(false)}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-icon-wrap"><MdLogout size={28} /></div>
            <h3>Sign Out</h3>
            <p>Are you sure you want to log out?</p>
            <div className="logout-actions">
              <button className="btn-cancel-logout" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="btn-confirm-logout" onClick={() => { logout(); setShowLogout(false); }}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password modal */}
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}

// ── Change Password Modal ─────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext,    setShowNext]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (next !== confirm) { setError('New passwords do not match.'); return; }
    if (next.length < 6)  { setError('New password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      await api.changePassword(current, next);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    flex: 1, padding: '9px 12px', borderRadius: '8px',
    border: '1.5px solid var(--border-color)', fontSize: '.875rem',
    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
    outline: 'none', minWidth: 0,
  };
  const wrapStyle = {
    display: 'flex', alignItems: 'center', gap: '6px',
    border: '1.5px solid var(--border-color)', borderRadius: '8px',
    background: 'var(--bg-secondary)', padding: '0 10px 0 0', overflow: 'hidden',
  };
  const eyeStyle = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
    padding: '0 2px', flexShrink: 0,
  };

  return (
    <div className="logout-overlay" onClick={onClose}>
      <div className="logout-modal" style={{ width: '360px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
        <div className="logout-icon-wrap" style={{ background: '#eff6ff', color: '#3b82f6' }}>
          <MdLock size={28} />
        </div>
        <h3>Change Password</h3>
        {success ? (
          <p style={{ color: '#16a34a', fontWeight: 600 }}>✓ Password changed successfully!</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '4px' }}>
            {/* Current password */}
            <div style={wrapStyle}>
              <input
                type={showCurrent ? 'text' : 'password'}
                placeholder="Current password" required
                value={current} onChange={e => setCurrent(e.target.value)}
                style={{ ...inputStyle, border: 'none', padding: '9px 12px' }}
              />
              <button type="button" style={eyeStyle} onClick={() => setShowCurrent(s => !s)} tabIndex={-1}>
                {showCurrent ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>
            {/* New password */}
            <div style={wrapStyle}>
              <input
                type={showNext ? 'text' : 'password'}
                placeholder="New password" required
                value={next} onChange={e => setNext(e.target.value)}
                style={{ ...inputStyle, border: 'none', padding: '9px 12px' }}
              />
              <button type="button" style={eyeStyle} onClick={() => setShowNext(s => !s)} tabIndex={-1}>
                {showNext ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>
            {/* Confirm new password */}
            <div style={wrapStyle}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm new password" required
                value={confirm} onChange={e => setConfirm(e.target.value)}
                style={{ ...inputStyle, border: 'none', padding: '9px 12px' }}
              />
              <button type="button" style={eyeStyle} onClick={() => setShowConfirm(s => !s)} tabIndex={-1}>
                {showConfirm ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '.8rem', margin: 0 }}>⚠ {error}</p>}
            <div className="logout-actions" style={{ marginTop: '4px' }}>
              <button type="button" className="btn-cancel-logout" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-confirm-logout" disabled={saving} style={{ background: '#3b82f6' }}>
                {saving ? 'Saving…' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Root App — handles auth gate before rendering the shell ────────────────
export default function App() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="app-loading">
      <Loader size={64} />
    </div>
  );

  // Not logged in → show Login page (no routes needed)
  if (!user) return <Login />;

  // Logged in → render the full shell with React Router routes
  return <AppShell />;
}
