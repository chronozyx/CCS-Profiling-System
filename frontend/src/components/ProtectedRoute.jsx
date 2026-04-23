import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { MdLock } from 'react-icons/md';

/**
 * ProtectedRoute — React Router version
 *
 * Props:
 *   module   — the module id to check against can() (e.g. 'dashboard', 'audit')
 *   children — the page component to render if allowed
 *
 * Behavior:
 *   - Not logged in    → redirect to /
 *   - Role not allowed → show Access Denied for 2s, then redirect to role home
 *   - Role allowed     → render children
 */
export default function ProtectedRoute({ module, children }) {
  const { user, can, isStudent, isFaculty } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  if (!can(module)) {
    const fallback = isStudent ? '/students' : isFaculty ? '/faculty' : '/dashboard';
    return <AccessDenied fallback={fallback} isStudent={isStudent} isFaculty={isFaculty} />;
  }

  return children;
}

// Shows a message then redirects using React Router Navigate
function AccessDenied({ fallback, isStudent, isFaculty }) {
  const [redirect, setRedirect] = useState(false);
  const dest = isStudent || isFaculty ? 'My Profile' : 'Dashboard';

  useEffect(() => {
    const t = setTimeout(() => setRedirect(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (redirect) return <Navigate to={fallback} replace />;

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
