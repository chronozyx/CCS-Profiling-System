import { useAuth } from '../context/AuthContext.jsx';
import { MdLock } from 'react-icons/md';

/**
 * ProtectedRoute
 *
 * Props:
 *   module   — the module id being rendered (e.g. 'student', 'faculty')
 *   children — the module component
 *   onRedirect — called when access is denied, so App can navigate away
 *
 * Behavior:
 *   - Not logged in        → null (App already shows Login)
 *   - Role not allowed     → AccessDenied banner + calls onRedirect after 2s
 *   - Role allowed         → renders children
 */
export default function ProtectedRoute({ module, children, onRedirect }) {
  const { user, can, isStudent, isFaculty } = useAuth();

  if (!user) return null;

  if (!can(module)) {
    const fallback = isStudent ? 'student' : isFaculty ? 'faculty' : 'dashboard';
    setTimeout(() => onRedirect?.(fallback), 2000);
    return <AccessDenied isStudent={isStudent} isFaculty={isFaculty} />;
  }

  return children;
}

function AccessDenied({ isStudent, isFaculty }) {
  const dest = isStudent ? 'My Profile' : isFaculty ? 'My Profile' : 'Dashboard';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '60vh', gap: '1rem',
      color: 'var(--text-secondary, #6b7280)',
    }}>
      <div style={{
        background: 'var(--danger-bg, #fef2f2)',
        borderRadius: '50%', padding: '1.25rem',
        color: 'var(--danger, #ef4444)',
      }}>
        <MdLock size={40} />
      </div>
      <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary, #111827)' }}>
        Access Denied
      </h2>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>
        You don't have permission to view this page.
      </p>
      <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>
        Redirecting to {dest}…
      </p>
    </div>
  );
}
