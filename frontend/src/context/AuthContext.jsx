import { createContext, useContext, useState, useEffect, useCallback } from 'react';
const API_URL = import.meta.env.VITE_API_URL;
const AuthContext = createContext(null);

const TOKEN_KEY = 'ccs_token';
const USER_KEY  = 'ccs_user';

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  /* Verify token on mount (auto-login) */
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) { setLoading(false); return; }

    fetch(`${API_URL}/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${stored}`,
        'Content-Type': 'application/json'
      },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => { setUser(u); setToken(stored); })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null); setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((tok, userData) => {
    localStorage.setItem(TOKEN_KEY, tok);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(tok);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const role      = user?.role ?? null;
  const isAdmin   = role === 'admin';
  const isFaculty = role === 'faculty';
  const isStudent = role === 'student';

  const can = (module) => {
    if (!user) return false;
    if (isAdmin) return true;
    const studentBlocked = ['dashboard', 'faculty', 'scheduling', 'events', 'research', 'instructional', 'rooms', 'audit', 'users'];
    const facultyBlocked = ['dashboard', 'student', 'events', 'research', 'audit', 'users'];
    if (isStudent && studentBlocked.includes(module)) return false;
    if (isFaculty && facultyBlocked.includes(module)) return false;
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, role, isAdmin, isFaculty, isStudent, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Convenience hook — returns role booleans + can() without needing full auth object
export const useRole = () => {
  const { role, isAdmin, isFaculty, isStudent, can } = useContext(AuthContext);
  return { role, isAdmin, isFaculty, isStudent, can };
};
