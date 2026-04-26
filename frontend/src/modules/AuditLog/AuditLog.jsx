import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/index.js';
import {
  FaShieldAlt, FaCheckCircle, FaBan, FaExclamationTriangle,
  FaSync, FaFilter, FaTimes, FaTrash, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';
import { MdTimeline } from 'react-icons/md';
import './AuditLog.css';

const STATUS_META = {
  allowed: { label: 'Allowed', icon: FaCheckCircle,       color: '#16a34a' },
  denied:  { label: 'Denied',  icon: FaBan,               color: '#ef4444' },
  error:   { label: 'Error',   icon: FaExclamationTriangle,color: '#f59e0b' },
};

const METHOD_COLORS = {
  GET:    '#3b82f6', POST:   '#10b981',
  PUT:    '#f59e0b', DELETE: '#ef4444',
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.allowed;
  const Icon = m.icon;
  return (
    <span className="al-badge" style={{ '--c': m.color }}>
      <Icon size={10} /> {m.label}
    </span>
  );
}

function MethodBadge({ method }) {
  const color = METHOD_COLORS[method] || '#6b7280';
  return (
    <span className="al-method" style={{ '--c': color }}>{method}</span>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="al-stat" style={{ '--c': color }}>
      <div className="al-stat-icon"><Icon size={20} /></div>
      <div>
        <div className="al-stat-val">{value ?? '—'}</div>
        <div className="al-stat-lbl">{label}</div>
      </div>
    </div>
  );
}

// ── Clear Logs Modal ───────────────────────────────────────────────────────
const UNIT_OPTIONS = [
  { value: 'days',   label: 'Days',   multiplier: 1 },
  { value: 'weeks',  label: 'Weeks',  multiplier: 7 },
  { value: 'months', label: 'Months', multiplier: 30 },
  { value: 'years',  label: 'Years',  multiplier: 365 },
];

function ClearLogsModal({ onClose, onCleared }) {
  const [amount,  setAmount]  = useState(90);
  const [unit,    setUnit]    = useState('days');
  const [clearing, setClearing] = useState(false);

  const multiplier = UNIT_OPTIONS.find(o => o.value === unit)?.multiplier || 1;
  const totalDays  = amount * multiplier;

  const handleConfirm = async () => {
    setClearing(true);
    try {
      const res = await api.clearOldLogs(totalDays);
      onCleared(res.message || `Deleted ${res.deleted} log entries.`);
      onClose();
    } catch (e) {
      alert('Failed: ' + e.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="al-modal-overlay" onClick={onClose}>
      <div className="al-modal" onClick={e => e.stopPropagation()}>
        <div className="al-modal-header">
          <div className="al-modal-icon"><FaTrash size={20} /></div>
          <h3>Clear Old Logs</h3>
          <button className="al-modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="al-modal-body">
          <p className="al-modal-desc">
            Delete all audit log entries older than the selected period.
            This action <strong>cannot be undone</strong>.
          </p>

          <div className="al-clear-inputs">
            <div className="al-clear-field">
              <label>Amount</label>
              <input
                type="number" min="1" max="999"
                value={amount}
                onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
                className="al-clear-number"
              />
            </div>
            <div className="al-clear-field">
              <label>Unit</label>
              <div className="al-unit-group">
                {UNIT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    className={`al-unit-btn${unit === o.value ? ' active' : ''}`}
                    onClick={() => setUnit(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="al-clear-summary">
            Will delete logs older than <strong>{amount} {unit}</strong>
            {totalDays !== amount && <> ({totalDays} days)</>}.
          </div>
        </div>

        <div className="al-modal-actions">
          <button className="al-btn-cancel" onClick={onClose} disabled={clearing}>Cancel</button>
          <button className="al-btn-confirm-delete" onClick={handleConfirm} disabled={clearing}>
            {clearing ? 'Deleting…' : <><FaTrash size={12} /> Delete Logs</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditLog() {
  const [logs,    setLogs]    = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [tab,     setTab]     = useState('logs');   // 'logs' | 'stats'
  const [showClearModal, setShowClearModal] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole,   setFilterRole]   = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page };
      if (filterStatus) params.status = filterStatus;
      if (filterRole)   params.role   = filterRole;
      const res = await api.getAuditLogs(params);
      setLogs(res.data);
      setTotal(res.total);
      setPages(res.totalPages);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, filterStatus, filterRole]);

  const loadStats = useCallback(async () => {
    setLoading(true); setError('');
    try { setStats(await api.getAuditStats()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { tab === 'logs' ? loadLogs() : loadStats(); }, [tab, loadLogs, loadStats]);

  const handleClear = () => setShowClearModal(true);

  const resetFilters = () => { setFilterStatus(''); setFilterRole(''); setPage(1); };

  return (
    <div className="al-container">
      {/* Header */}
      <div className="al-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <h1>Audit Logs</h1>
            <span className="al-admin-badge"><FaShieldAlt size={11} /> Admin Only</span>
          </div>
          <p className="al-subtitle">{total.toLocaleString()} total log entries</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="al-btn-secondary" onClick={() => tab === 'logs' ? loadLogs() : loadStats()} title="Refresh">
            <FaSync />
          </button>
          <button className="al-btn-danger" onClick={handleClear} title="Clear old logs">
            <FaTrash /> Clear Old
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="al-tabs">
        <button className={tab === 'logs'  ? 'active' : ''} onClick={() => setTab('logs')}>
          <MdTimeline /> Log Entries
        </button>
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>
          <FaShieldAlt /> Statistics
        </button>
      </div>

      {error && (
        <div className="al-error">⚠ {error}</div>
      )}

      {/* ── STATS TAB ── */}
      {tab === 'stats' && stats && (
        <div className="al-stats-view">
          <div className="al-stat-row">
            <StatCard label="Total Requests" value={stats.counts.total}        icon={MdTimeline}           color="#3b82f6" />
            <StatCard label="Allowed"        value={stats.counts.allowed}      icon={FaCheckCircle}        color="#16a34a" />
            <StatCard label="Denied"         value={stats.counts.denied}       icon={FaBan}                color="#ef4444" />
            <StatCard label="Errors"         value={stats.counts.errors}       icon={FaExclamationTriangle}color="#f59e0b" />
            <StatCard label="Denied (1h)"    value={stats.counts.denied_last_hour} icon={FaBan}            color="#dc2626" />
          </div>

          <div className="al-stats-grid">
            <div className="al-stats-card">
              <h3>Requests by Role</h3>
              {stats.byRole.map(r => (
                <div key={r.role} className="al-bar-row">
                  <span className="al-bar-label">{r.role || 'anonymous'}</span>
                  <div className="al-bar-track">
                    <div className="al-bar-fill" style={{ width: `${Math.min((r.count / stats.counts.total) * 100, 100)}%` }} />
                  </div>
                  <span className="al-bar-count">{r.count}</span>
                </div>
              ))}
            </div>

            <div className="al-stats-card">
              <h3>Top Endpoints</h3>
              <table className="al-mini-table">
                <thead><tr><th>Method</th><th>Endpoint</th><th>Hits</th></tr></thead>
                <tbody>
                  {stats.topEndpoints.map((e, i) => (
                    <tr key={i}>
                      <td><MethodBadge method={e.method} /></td>
                      <td><code>{e.endpoint}</code></td>
                      <td><strong>{e.hits}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="al-stats-card al-stats-card--wide">
              <h3>Recent Denied Requests</h3>
              {stats.recentDenied.length === 0
                ? <p className="al-empty">No denied requests — all clear ✓</p>
                : (
                  <table className="al-mini-table">
                    <thead><tr><th>User</th><th>Role</th><th>Method</th><th>Endpoint</th><th>Code</th><th>IP</th><th>Time</th></tr></thead>
                    <tbody>
                      {stats.recentDenied.map(r => (
                        <tr key={r.id}>
                          <td>{r.user_name || <em>anon</em>}</td>
                          <td>{r.role || '—'}</td>
                          <td><MethodBadge method={r.method} /></td>
                          <td><code>{r.endpoint}</code></td>
                          <td><span className="al-code al-code--red">{r.http_code}</span></td>
                          <td>{r.ip}</td>
                          <td>{new Date(r.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {tab === 'logs' && (
        <>
          {/* Filters */}
          <div className="al-filter-bar">
            <FaFilter className="al-filter-icon" />
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="allowed">Allowed</option>
              <option value="denied">Denied</option>
              <option value="error">Error</option>
            </select>
            <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
            {(filterStatus || filterRole) && (
              <button className="al-clear-btn" onClick={resetFilters}><FaTimes /> Clear</button>
            )}
            <span className="al-count">{total.toLocaleString()} entries</span>
          </div>

          {/* Table */}
          {loading
            ? <div className="al-loading">Loading logs…</div>
            : (
              <div className="al-table-wrap">
                <table className="al-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Role</th>
                      <th>Method</th>
                      <th>Endpoint</th>
                      <th>Status</th>
                      <th>Code</th>
                      <th>IP</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 && (
                      <tr><td colSpan={9} className="al-empty">No log entries found.</td></tr>
                    )}
                    {logs.map(log => (
                      <tr key={log.id} className={`al-row al-row--${log.status}`}>
                        <td className="al-id">{log.id}</td>
                        <td>{log.user_name || <em className="al-anon">anonymous</em>}</td>
                        <td>{log.role || '—'}</td>
                        <td><MethodBadge method={log.method} /></td>
                        <td><code className="al-endpoint">{log.endpoint}</code></td>
                        <td><StatusBadge status={log.status} /></td>
                        <td>
                          <span className={`al-code ${log.http_code >= 400 ? 'al-code--red' : 'al-code--green'}`}>
                            {log.http_code}
                          </span>
                        </td>
                        <td className="al-ip">{log.ip}</td>
                        <td className="al-time">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="al-pagination">
              <button disabled={page <= 1}     onClick={() => setPage(p => p - 1)}><FaChevronLeft /></button>
              <span>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}><FaChevronRight /></button>
            </div>
          )}
        </>
      )}

      {/* Clear Logs Modal */}
      {showClearModal && (
        <ClearLogsModal
          onClose={() => setShowClearModal(false)}
          onCleared={(msg) => { alert(msg); loadLogs(); }}
        />
      )}
    </div>
  );
}
