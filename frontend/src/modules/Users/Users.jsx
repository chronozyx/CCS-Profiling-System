import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/index.js';
import {
  FaEdit, FaTrash, FaSearch, FaTimes, FaSync,
  FaEye, FaEyeSlash, FaUserCog, FaChalkboardTeacher, FaUserGraduate,
  FaShieldAlt, FaRedo, FaIdCard, FaLock,
} from 'react-icons/fa';
import './Users.css';
import Loader from '../../components/Loader.jsx';

const ROLE_META = {
  admin:   { label: 'Admin',   icon: FaUserCog,           color: '#ef4444', bg: '#fef2f2', hint: 'admin123' },
  faculty: { label: 'Faculty', icon: FaChalkboardTeacher, color: '#3b82f6', bg: '#eff6ff', hint: 'faculty123' },
  student: { label: 'Student', icon: FaUserGraduate,      color: '#10b981', bg: '#f0fdf4', hint: 'student123' },
};

function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.student;
  const Icon = m.icon;
  return (
    <span className="usr-role-badge" style={{ '--c': m.color, '--bg': m.bg }}>
      <Icon size={10} /> {m.label}
    </span>
  );
}

function PasswordInput({ value, onChange, placeholder = 'Enter password' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="usr-pw-wrap">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
      />
      <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1}>
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}

function EditModal({ form, setForm, onSubmit, onClose, saving }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const isAdmin = form.role === 'admin';
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="usr-overlay" onClick={onClose}>
      <div className="usr-modal" onClick={e => e.stopPropagation()}>
        <div className="usr-modal-header">
          <h2><FaEdit size={13} /> Edit Account</h2>
          <button className="usr-modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={onSubmit} className="usr-form">

          {/* Read-only info */}
          <div className="usr-edit-info">
            <div className="usr-avatar" style={{ '--c': ROLE_META[form.role]?.color || '#6b7280' }}>
              {form.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{form.name}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-tertiary)' }}>{form.email}</div>
              <RoleBadge role={form.role} />
            </div>
          </div>

          {/* Login ID — student/faculty only */}
          {!isAdmin && (
            <div className="usr-form-group">
              <label><FaIdCard size={11} /> Login ID</label>
              <input
                value={form.login_id || ''}
                onChange={e => f('login_id', e.target.value)}
                placeholder="Login ID"
                maxLength={50}
              />
            </div>
          )}

          {/* Password */}
          <div className="usr-form-group">
            <label><FaLock size={11} /> New Password <span className="usr-field-note">(leave blank to keep current)</span></label>
            <div className="usr-pw-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password || ''}
                onChange={e => f('password', e.target.value)}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                {showPw ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {!isAdmin && (
              <span className="usr-hint">Leave blank to keep current password</span>
            )}
          </div>

          <div className="usr-form-actions">
            <button type="button" className="usr-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="usr-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordCell({ value }) {
  const [show, setShow] = useState(false);
  if (!value) return <span className="usr-no-profile">—</span>;
  return (
    <div className="usr-pw-cell">
      <code className="usr-pw-value">{show ? value : '•'.repeat(value.length)}</code>
      <button
        className="usr-pw-toggle"
        onClick={() => setShow(s => !s)}
        title={show ? 'Hide' : 'Show'}
      >
        {show ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
      </button>
    </div>
  );
}

function ResetModal({ user, onClose, onReset }) { return null; } // removed — password editing is now in EditModal

function DeleteModal({ user, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const m = ROLE_META[user.role] || ROLE_META.student;
  const Icon = m.icon;

  const hasProfile = user.student_id || user.employee_id;

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm(user.id);
    setDeleting(false);
    onClose();
  };

  return (
    <div className="usr-overlay" onClick={onClose}>
      <div className="usr-modal usr-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="usr-modal-header">
          <h2 style={{ color: '#ef4444' }}><FaTrash size={13} /> Delete User</h2>
          <button className="usr-modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="usr-form">
          <div className="usr-delete-info">
            <div className="usr-delete-avatar" style={{ '--c': m.color }}>
              <Icon size={20} />
            </div>
            <div>
              <div className="usr-delete-name">{user.name}</div>
              <div className="usr-delete-email">{user.email}</div>
            </div>
          </div>

          <div className="usr-delete-warning">
            <strong>This will permanently delete:</strong>
            <ul>
              <li>The user account ({user.role})</li>
              {user.role === 'student' && user.student_id && (
                <li>Student profile — <code>{user.student_id}</code> ({user.program} {user.year_level})</li>
              )}
              {user.role === 'faculty' && user.employee_id && (
                <li>Faculty profile — <code>{user.employee_id}</code> ({user.faculty_title}, {user.department})</li>
              )}
              {user.role === 'student' && (
                <li>All faculty assignments for this student</li>
              )}
              {user.role === 'faculty' && (
                <li>All student assignments linked to this faculty</li>
              )}
              {!hasProfile && <li>No linked profile found</li>}
            </ul>
            <p className="usr-delete-irreversible">This action cannot be undone.</p>
          </div>

          <div className="usr-form-actions">
            <button type="button" className="usr-btn-cancel" onClick={onClose} disabled={deleting}>Cancel</button>
            <button type="button" className="usr-btn-delete" onClick={handleConfirm} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const EMPTY = { name: '', email: '', password: '', role: 'student' };
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');
  const [filterRole,   setFilterRole]   = useState('');
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState({ ...EMPTY });
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (search)     params.search = search;
      setUsers(await api.getUsers(params));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filterRole, search]);

  useEffect(() => { load(); }, [load]);

  const openEdit = u => { setForm({ ...u, password: '', login_id: u.login_id || '' }); setEditTarget(u); };

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const updated = await api.updateUser(form.id, form);
      setUsers(prev => prev.map(u => u.id === form.id ? { ...u, ...updated } : u));
      setEditTarget(null);
    } catch (e) { alert('Save failed: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e) { alert('Delete failed: ' + e.message); }
  };

  const handleRegenLoginId = async (id) => {
    if (!window.confirm('Generate a new Login ID for this user?')) return;
    try {
      const res = await api.regenerateLoginId(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, login_id: res.login_id } : u));
    } catch (e) { alert('Failed: ' + e.message); }
  };

  // Group by role for display
  const grouped = ['admin', 'faculty', 'student'].reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r);
    return acc;
  }, {});

  const counts = {
    admin:   grouped.admin.length,
    faculty: grouped.faculty.length,
    student: grouped.student.length,
  };

  return (
    <div className="usr-container">
      {/* Header */}
      <div className="usr-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>User Management</h1>
            <span className="usr-admin-badge"><FaShieldAlt size={10} /> Admin Only</span>
          </div>
          <p className="usr-subtitle">{users.length} total accounts</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="usr-btn-secondary" onClick={load} title="Refresh"><FaSync /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="usr-stats-row">
        {Object.entries(ROLE_META).map(([r, m]) => {
          const Icon = m.icon;
          return (
            <div key={r} className="usr-stat" style={{ '--c': m.color }}>
              <div className="usr-stat-icon"><Icon size={22} /></div>
              <div>
                <div className="usr-stat-val">{counts[r]}</div>
                <div className="usr-stat-lbl">{m.label}s</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="usr-filter-bar">
        <div className="usr-search-wrap">
          <FaSearch className="usr-search-icon" />
          <input
            className="usr-search"
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="usr-clear-search" onClick={() => setSearch('')}><FaTimes /></button>}
        </div>
        <div className="usr-role-filters">
          {['', 'admin', 'faculty', 'student'].map(r => (
            <button
              key={r}
              className={`usr-filter-btn ${filterRole === r ? 'active' : ''}`}
              style={r ? { '--c': ROLE_META[r].color } : {}}
              onClick={() => setFilterRole(r)}
            >
              {r ? ROLE_META[r].label : 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="usr-error">⚠ {error}</div>}
      {loading && <div className="usr-loading"><Loader padded /></div>}

      {/* Tables grouped by role */}
      {!loading && ['admin', 'faculty', 'student'].map(r => {
        const list = grouped[r];
        if (filterRole && filterRole !== r) return null;
        const m = ROLE_META[r];
        const Icon = m.icon;
        return (
          <div key={r} className="usr-group">
            <div className="usr-group-header" style={{ '--c': m.color }}>
              <Icon size={15} />
              <span>{m.label} Accounts</span>
              <span className="usr-group-count">{list.length}</span>
            </div>

            {list.length === 0
              ? <div className="usr-empty">No {m.label.toLowerCase()} accounts found.</div>
              : (
                <div className="usr-table-wrap">
                  <table className="usr-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Login ID</th>
                        <th>Email</th>
                        <th>Password</th>
                        <th>Role</th>
                        <th>Profile</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="usr-name-cell">
                              <div className="usr-avatar" style={{ '--c': m.color }}>
                                {u.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <span>{u.name}</span>
                            </div>
                          </td>
                          <td>
                            {u.login_id
                              ? <code className="usr-login-id">{u.login_id}</code>
                              : <span className="usr-no-profile">—</span>}
                          </td>
                          <td><code className="usr-email">{u.email}</code></td>
                          <td><PasswordCell value={u.plain_password} /></td>
                          <td><RoleBadge role={u.role} /></td>
                          <td className="usr-profile-cell">
                            {u.role === 'student' && u.student_id && (
                              <span className="usr-profile-info">
                                {u.student_id} · {u.program} {u.year_level}
                              </span>
                            )}
                            {u.role === 'faculty' && u.employee_id && (
                              <span className="usr-profile-info">
                                {u.faculty_title} · {u.department}
                              </span>
                            )}
                            {(!u.student_id && !u.employee_id) && (
                              <span className="usr-no-profile">No profile linked</span>
                            )}
                          </td>
                          <td className="usr-date">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className="usr-actions">
                              <button className="usr-icon-btn usr-icon-btn--edit"  onClick={() => openEdit(u)}              title="Edit credentials"><FaEdit /></button>
                              {u.role !== 'admin' && (
                                <button className="usr-icon-btn usr-icon-btn--regen" onClick={() => handleRegenLoginId(u.id)} title="New Login ID"><FaRedo /></button>
                              )}
                              <button className="usr-icon-btn usr-icon-btn--del"   onClick={() => setDeleteTarget(u)}       title="Delete"><FaTrash /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        );
      })}

      {editTarget && (
        <EditModal
          form={form} setForm={setForm}
          onSubmit={handleSubmit} onClose={() => setEditTarget(null)} saving={saving}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
