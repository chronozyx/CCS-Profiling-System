import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import {
  FaEye, FaEyeSlash, FaLock, FaEnvelope, FaShieldAlt,
  FaUserGraduate, FaChalkboardTeacher, FaUserCog, FaIdCard,
} from "react-icons/fa";
import "./Login.css";
import { BASE } from "../api/index.js";

const ROLES = [
  { id: "admin",   label: "Admin",   icon: FaUserCog,           color: "#ef4444",
    idField: "email",    idPlaceholder: "admin@ccs.edu",    idLabel: "Email Address",
    pwPattern: null,     pwPlaceholder: "Enter password",   pwNote: null },
  { id: "faculty", label: "Faculty", icon: FaChalkboardTeacher, color: "#3b82f6",
    idField: "login_id", idPlaceholder: "e.g. 1234567",     idLabel: "Login ID",
    pwPattern: "\\d{7}", pwPlaceholder: "7-digit password", pwNote: "Must be exactly 7 digits" },
  { id: "student", label: "Student", icon: FaUserGraduate,      color: "#10b981",
    idField: "login_id", idPlaceholder: "e.g. 1111111",     idLabel: "Login ID",
    pwPattern: "\\d{7}", pwPlaceholder: "7-digit password", pwNote: "Must be exactly 7 digits" },
];

export default function Login() {
  const { login } = useAuth();
  const [role,       setRole]       = useState("admin");
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [toast,    setToast]    = useState("");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const selectedRole = ROLES.find(r => r.id === role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate 7-digit rule for faculty/student before hitting the server
    if (selectedRole.pwPattern && !/^\d{7}$/.test(password)) {
      setError("Password must be exactly 7 digits.");
      return;
    }
    if (selectedRole.idField === "login_id" && !/^\d{7}$/.test(identifier)) {
      setError("Login ID must be exactly 7 digits.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }
      // Warn if the user logged in under a different role than selected
      if (data.user.role !== role) {
        setError(`This account is registered as "${data.user.role}", not "${role}".`);
        return;
      }
      setToast(`Welcome back, ${data.user.name}!`);
      setTimeout(() => login(data.token, data.user), 600);
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button
        className="login-theme-btn"
        onClick={() => setDarkMode(d => !d)}
        title="Toggle theme"
      >
        {darkMode ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
      </button>

      {toast && <div className="login-toast">{toast}</div>}

      <div className="login-card">
        <div className="login-logo-wrap">
          <div className="login-logo-ring">
            <img src="/ccs.png" alt="CCS" className="login-logo-img" />
          </div>
          <div className="login-shield">
            <FaShieldAlt size={14} />
          </div>
        </div>

        <h1 className="login-title">CCS Profiling System</h1>
        <p className="login-subtitle">Sign in to your account</p>

        {/* Role selector */}
        <div className="login-role-group">
          {ROLES.map(r => {
            const Icon = r.icon;
            const active = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                className={`login-role-btn ${active ? "active" : ""}`}
                style={{ "--role-color": r.color }}
                onClick={() => { setRole(r.id); setError(""); setPassword(""); setIdentifier(""); }}
              >
                <Icon size={15} />
                {r.label}
              </button>
            );
          })}
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="identifier">{selectedRole.idLabel}</label>
            <div className="login-input-wrap">
              {selectedRole.idField === "login_id"
                ? <FaIdCard className="login-input-icon" />
                : <FaEnvelope className="login-input-icon" />}
              <input
                id="identifier"
                type={selectedRole.idField === "login_id" ? "tel" : "email"}
                inputMode={selectedRole.idField === "login_id" ? "numeric" : "email"}
                placeholder={selectedRole.idPlaceholder}
                value={identifier}
                onChange={e => {
                  const val = selectedRole.idField === "login_id"
                    ? e.target.value.replace(/\D/g, '').slice(0, 7)
                    : e.target.value;
                  setIdentifier(val);
                  setError("");
                }}
                maxLength={selectedRole.idField === "login_id" ? 7 : 191}
                required
                autoComplete={selectedRole.idField === "login_id" ? "username" : "email"}
              />
            </div>
            {selectedRole.idField === "login_id" && (
              <span className="login-pw-note">
                {identifier.length}/7 digits
                {identifier.length === 7 && <span className="login-pw-ok"> ✓</span>}
              </span>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <FaLock className="login-input-icon" />
              <input
                id="password"
                type={showPass ? "text" : "password"}
                inputMode={selectedRole.pwPattern ? "numeric" : "text"}
                placeholder={selectedRole.pwPlaceholder}
                value={password}
                onChange={e => {
                  // For faculty/student only allow digits, max 7
                  const val = selectedRole.pwPattern
                    ? e.target.value.replace(/\D/g, '').slice(0, 7)
                    : e.target.value;
                  setPassword(val);
                  setError("");
                }}
                maxLength={selectedRole.pwPattern ? 7 : 128}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {selectedRole.pwNote && (
              <span className="login-pw-note">
                {password.length}/7 digits
                {password.length === 7 && <span className="login-pw-ok"> ✓</span>}
              </span>
            )}
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            style={{ "--role-color": selectedRole.color }}
          >
            {loading
              ? <span className="login-spinner" />
              : <><selectedRole.icon size={15} /> Sign in as {selectedRole.label}</>}
          </button>
        </form>

        <p className="login-hint">
          <FaShieldAlt size={11} /> Authorized personnel only
        </p>
      </div>
    </div>
  );
}
