import { useState, useEffect, useRef } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import {
  MdDashboard, MdPerson, MdPeople, MdSchedule,
  MdEvent, MdScience, MdBook, MdMeetingRoom,
  MdLightMode, MdDarkMode, MdLogout, MdMenu, MdClose,
  MdChevronLeft, MdChevronRight, MdSecurity, MdManageAccounts,
} from 'react-icons/md';
import { FaShieldAlt } from 'react-icons/fa';
import Dashboard      from './modules/Dashboard/Dashboard';
import StudentProfile from './modules/StudentProfile/StudentProfile';
import FacultyProfile from './modules/FacultyProfile/FacultyProfile';
import Events         from './modules/Events/Events';
import Scheduling     from './modules/Scheduling/Scheduling';
import Research       from './modules/Research/Research';
import Instructional  from './modules/Instructional/Instructional';
import RoomManagement from './modules/RoomManagement/RoomManagement';
import AuditLog       from './modules/AuditLog/AuditLog';
import Users          from './modules/Users/Users';

const NAV_GROUPS = [
  {
    label: 'Main Menu',
    items: [
      { id: 'dashboard', name: 'Dashboard',  icon: MdDashboard,      roles: ['admin'] },
      { id: 'student',   name: 'Students',   nameStudent: 'My Profile', icon: MdPerson, roles: ['admin','student'] },
      { id: 'faculty',   name: 'Faculty',    nameFaculty: 'My Profile', icon: MdPeople, roles: ['admin','faculty'] },
      { id: 'users',     name: 'Users',      icon: MdManageAccounts, roles: ['admin'] },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'scheduling',   name: 'Scheduling',   icon: MdSchedule,    roles: ['admin'] },
      { id: 'events',       name: 'Events',       icon: MdEvent,       roles: ['admin'] },
      { id: 'research',     name: 'Research',     icon: MdScience,     roles: ['admin'] },
      { id: 'instructional',name: 'Instructional',icon: MdBook,        roles: ['admin'] },
      { id: 'rooms',        name: 'Rooms',        icon: MdMeetingRoom, roles: ['admin'] },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'audit', name: 'Audit Logs', icon: MdSecurity, roles: ['admin'] },
    ],
  },
];

function getInitials(name = '', email = '') {
  if (name) return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export default function App() {
  const { user, loading, logout, role, can } = useAuth();
  const [currentModule, setCurrentModule] = useState(
    () => role === 'student' ? 'student' : role === 'faculty' ? 'faculty' : 'dashboard'
  );
  const [collapsed,     setCollapsed]     = useState(false);   // desktop collapse
  const [mobileOpen,    setMobileOpen]    = useState(false);   // mobile drawer
  const [darkMode,      setDarkMode]      = useState(false);
  const [showLogout,    setShowLogout]    = useState(false);
  const [tooltip,       setTooltip]       = useState({ text: '', y: 0 });
  const sidebarRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') { setDarkMode(true); document.documentElement.classList.add('dark'); }
  }, []);

  // close mobile drawer on outside click
  useEffect(() => {
    const handler = e => {
      if (mobileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const navigate = id => {
    if (!can(id)) return;   // silently block nav to forbidden modules
    setCurrentModule(id);
    setMobileOpen(false);
  };

  if (loading) return (
    <div className="app-loading">
      <div className="app-loading-spinner" />
      <p>Loading…</p>
    </div>
  );

  if (!user) return <Login />;

  const renderModule = () => {
    const moduleMap = {
      dashboard:     <Dashboard />,
      student:       <StudentProfile />,
      faculty:       <FacultyProfile />,
      events:        <Events />,
      scheduling:    <Scheduling />,
      research:      <Research />,
      instructional: <Instructional />,
      rooms:         <RoomManagement />,
      audit:         <AuditLog />,
      users:         <Users />,
    };
    const el = moduleMap[currentModule] ?? <Dashboard />;
    return (
      <ProtectedRoute module={currentModule} onRedirect={setCurrentModule}>
        {el}
      </ProtectedRoute>
    );
  };

  const sidebarClass = [
    'sidebar',
    collapsed  ? 'sidebar--collapsed' : 'sidebar--expanded',
    mobileOpen ? 'sidebar--mobile-open' : '',
  ].join(' ');

  return (
    <div className={`app-root ${collapsed ? 'app--collapsed' : 'app--expanded'}`}>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      {/* ── Hamburger (mobile only) ── */}
      <button className="hamburger-btn" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
        {mobileOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </button>

      {/* ══════════════════════════════════
          SIDEBAR
      ══════════════════════════════════ */}
      <aside className={sidebarClass} ref={sidebarRef}>

        {/* ── Header ── */}
        <div className="sb-header">
          <div className="sb-logo" onClick={() => collapsed && setCollapsed(false)}>
            <div className="sb-logo-ring">
              <img src="/ccs.png" alt="CCS" />
            </div>
            {!collapsed && (
              <div className="sb-logo-text">
                <span className="sb-logo-title">CCS</span>
                <span className="sb-logo-sub">Profiling System</span>
              </div>
            )}
          </div>
          {/* Desktop collapse toggle */}
          <button
            className="sb-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <MdChevronRight size={18} /> : <MdChevronLeft size={18} />}
          </button>
        </div>

        {/* ── Nav groups ── */}
        <nav className="sb-nav">
          {NAV_GROUPS.map(group => {
            const visibleItems = group.items.filter(item => item.roles.includes(role));
            if (!visibleItems.length) return null;
            return (
              <div key={group.label} className="sb-group">
                {!collapsed && <span className="sb-group-label">{group.label}</span>}
                {collapsed && <div className="sb-group-divider" />}
                {visibleItems.map(({ id, name, nameStudent, nameFaculty, icon: Icon }) => {
                  const active = currentModule === id;
                  const label  = (role === 'student' && nameStudent)
                    ? nameStudent
                    : (role === 'faculty' && nameFaculty)
                    ? nameFaculty
                    : name;
                  return (
                    <button
                      key={id}
                      className={`sb-item ${active ? 'sb-item--active' : ''}`}
                      onClick={() => navigate(id)}
                      onMouseEnter={e => collapsed && setTooltip({ text: label, y: e.currentTarget.getBoundingClientRect().top + 20 })}
                      onMouseLeave={() => setTooltip({ text: '', y: 0 })}
                      title={collapsed ? label : ''}
                    >
                      <span className="sb-item-icon"><Icon size={20} /></span>
                      {!collapsed && <span className="sb-item-label">{label}</span>}
                      {active && !collapsed && <span className="sb-item-dot" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* ── Bottom section ── */}
        <div className="sb-bottom">
          {/* Theme toggle */}
          <button
            className="sb-item sb-item--muted"
            onClick={toggleTheme}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
            onMouseEnter={e => collapsed && setTooltip({ text: darkMode ? 'Light Mode' : 'Dark Mode', y: e.currentTarget.getBoundingClientRect().top + 20 })}
            onMouseLeave={() => setTooltip({ text: '', y: 0 })}
          >
            <span className="sb-item-icon">
              {darkMode ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
            </span>
            {!collapsed && <span className="sb-item-label">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Divider */}
          <div className="sb-divider" />

          {/* User profile */}
          <div className="sb-profile">
            <div className="sb-avatar">{getInitials(user.name, user.email)}</div>
            {!collapsed && (
              <div className="sb-profile-info">
                <span className="sb-profile-name">{user.name || 'Admin'}</span>
                <span className="sb-profile-role">
                  <FaShieldAlt size={9} /> {role === 'admin' ? 'Administrator' : role === 'faculty' ? 'Faculty' : 'Student'}
                </span>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            className="sb-item sb-item--logout"
            onClick={() => setShowLogout(true)}
            title="Logout"
            onMouseEnter={e => collapsed && setTooltip({ text: 'Logout', y: e.currentTarget.getBoundingClientRect().top + 20 })}
            onMouseLeave={() => setTooltip({ text: '', y: 0 })}
          >
            <span className="sb-item-icon"><MdLogout size={20} /></span>
            {!collapsed && <span className="sb-item-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Collapsed tooltip ── */}
      {collapsed && tooltip.text && (
        <div className="sb-tooltip" style={{ top: tooltip.y }}>{tooltip.text}</div>
      )}

      {/* ══════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════ */}
      <div className="app-main">
        <main className="main-content">
          {renderModule()}
        </main>

        <footer className="app-footer">
          <div className="footer-inner">
            <div className="footer-left">
              <img src="/ccs.png" alt="CCS Logo" className="footer-logo" />
              <div>
                <span className="footer-title">CCS Profiling System</span>
                <span className="footer-sub">College of Computer Studies</span>
              </div>
            </div>
            <div className="footer-center">© {new Date().getFullYear()} CCS 4IT-D. All rights reserved.</div>
            <div className="footer-right">v.2.3</div>
          </div>
        </footer>
      </div>

      {/* ── Logout modal ── */}
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
    </div>
  );
}
