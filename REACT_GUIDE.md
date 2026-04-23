# CCS Profiling System — React Concepts Presentation Script
### School Presentation Guide | File-by-File | Code-by-Code | Line-by-Line

---

## How to Use This Script

Each part maps to a topic in your rubric. For every concept, we point to the **exact file**, the **exact lines**, and explain what they do and why. Open the files side-by-side while presenting.

---

---

# PART 1 — Client-Side Routing
> **Concept:** Navigation that switches pages without a full browser reload.
> **File:** `frontend/src/App.jsx`

---

### What is Client-Side Routing?

In a traditional website, clicking a link sends a request to the server and the whole page reloads.
In React with **React Router**, the browser never leaves the page — JavaScript swaps the content instead.
The URL changes, the back button works, but there is **zero reload**.

---

### Step 1 — The Router is set up in `frontend/src/main.jsx`

```jsx
import { BrowserRouter } from 'react-router-dom';

<BrowserRouter>
  <App />
</BrowserRouter>
```

`BrowserRouter` wraps the entire app. It watches the URL and tells React Router which component to show.
Everything inside it can use routing features.

---

### Step 2 — Routes are declared in `frontend/src/App.jsx`

```jsx
// Line 1-3 — imports from react-router-dom
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
```

- `Routes` — the container that holds all route definitions
- `Route` — maps one URL path to one component
- `NavLink` — a link that automatically gets an "active" CSS class when its path matches the current URL
- `useNavigate` — a hook that lets you navigate programmatically (e.g. after a form submit)
- `Navigate` — a component that immediately redirects to another path

---

### Step 3 — The actual route table (inside `AppShell`)

```jsx
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

  {/* 404 fallback */}
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

**Line by line:**

| Line | What it does |
|------|-------------|
| `path="/"` | When the user visits the root URL, redirect them based on their role — no page reload |
| `path="/dashboard"` | Maps the URL `/dashboard` to the `<Dashboard>` component |
| `path="/users"` | Maps `/users` to the `<Users>` component |
| `path="/students"` | Maps `/students` to `<StudentProfile>` — the list page |
| `path="*"` | Catch-all — any unknown URL redirects back to `/` |
| `replace` | Replaces the current history entry instead of pushing a new one (no "back" loop) |

**Expected output:** Clicking "Dashboard" in the sidebar changes the URL to `/dashboard` and renders `<Dashboard>` — no reload. Clicking "Users" changes it to `/users` and renders `<Users>` — no reload.

---

### Step 4 — The sidebar uses `NavLink`, not `<a>`

```jsx
<NavLink
  key={path}
  to={path}
  className={({ isActive }) =>
    `sb-item${isActive ? ' sb-item--active' : ''}`
  }
>
  <span className="sb-item-icon"><Icon size={20} /></span>
  {!collapsed && <span className="sb-item-label">{label}</span>}
</NavLink>
```

**Line by line:**

- `to={path}` — the destination URL (e.g. `/dashboard`)
- `className={({ isActive }) => ...}` — React Router passes `isActive: true` when the current URL matches `to`. We use it to add the `sb-item--active` CSS class, which highlights the active nav item
- No `<a href>`, no page reload — React Router intercepts the click

---

---

# PART 2 — Dynamic Routing
> **Concept:** One route pattern handles many different pages based on a URL parameter.
> **Files:** `frontend/src/App.jsx`, `frontend/src/modules/StudentProfile/StudentDetail.jsx`

---

### What is Dynamic Routing?

Instead of creating a separate route for every student (`/students/1`, `/students/2`, `/students/3`…), we define **one route with a parameter**:

```
/students/:id
```

The `:id` is a placeholder. When the URL is `/students/42`, React Router captures `42` as the `id` parameter and passes it to the component.

---

### Step 1 — The dynamic route is declared in `App.jsx`

```jsx
<Route path="/students/:id"  element={<ProtectedRoute module="student"><StudentDetail /></ProtectedRoute>} />
<Route path="/faculty/:id"   element={<ProtectedRoute module="faculty"><FacultyDetail /></ProtectedRoute>} />
```

- `:id` is the dynamic segment — it matches any value
- `/students/1`, `/students/99`, `/students/2026001` all match this one route
- The matched value is available inside `StudentDetail` via the `useParams` hook

---

### Step 2 — Clicking a student navigates to their URL

In `frontend/src/modules/StudentProfile/StudentProfile.jsx`:

```jsx
const openDetail = s => navigate(`/students/${s.id}`);
```

- `navigate` comes from `useNavigate()` — React Router's programmatic navigation hook
- When a student card is clicked, this pushes `/students/5` (or whatever the ID is) to the browser history
- React Router matches it to `path="/students/:id"` and renders `<StudentDetail>`

---

### Step 3 — `StudentDetail.jsx` reads the ID from the URL

```jsx
// Line: import useParams
import { useParams, useNavigate } from 'react-router-dom';

export default function StudentDetail() {
  const { id } = useParams();   // ← reads :id from the URL
```

- `useParams()` returns an object with all dynamic segments
- `{ id }` destructures the `:id` value — if the URL is `/students/42`, then `id === "42"`

---

### Step 4 — The ID is used to fetch data

```jsx
useEffect(() => {
  let cancelled = false;
  setLoading(true); setError('');

  Promise.all([
    api.getStudentById(id),              // fetch this specific student
    api.getStudentEnrollments(id).catch(() => []),  // fetch their enrollments
  ])
    .then(([data, enr]) => {
      if (cancelled) return;
      setStudent(toUI(data));
      setEnrollments(enr);
    })
    .catch(err => {
      if (!cancelled) setError(err.message);
    })
    .finally(() => { if (!cancelled) setLoading(false); });

  return () => { cancelled = true; };  // cleanup — prevents state update on unmounted component
}, [id]);  // ← re-runs whenever :id changes in the URL
```

**Line by line:**

| Line | What it does |
|------|-------------|
| `useEffect(..., [id])` | Runs the fetch every time the `id` from the URL changes |
| `api.getStudentById(id)` | Calls `GET /api/students/42` — fetches only that student |
| `let cancelled = false` | Guards against setting state after the component unmounts |
| `return () => { cancelled = true }` | Cleanup function — runs when component unmounts or `id` changes |

**Expected output:** Clicking student "Juan Dela Cruz" navigates to `/students/1`. The URL changes, `useParams` reads `1`, the API is called, and Juan's full profile renders — all without a page reload.

---

---

# PART 3 — Props vs State
> **Concept:** State is data owned by a component. Props are data passed down to child components.
> **Files:** `frontend/src/modules/Users/Users.jsx`

---

### What is State?

State is data that a component **owns and can change**. When state changes, React re-renders the component.

### What are Props?

Props are data **passed from a parent to a child**. The child cannot change them — it just reads and displays them.

---

### State in `Users.jsx` — the parent component owns the data

```jsx
export default function Users() {
  const [users,        setUsers]        = useState([]);   // the full user list
  const [loading,      setLoading]      = useState(true); // loading spinner flag
  const [error,        setError]        = useState('');   // error message
  const [search,       setSearch]       = useState('');   // search input value
  const [filterRole,   setFilterRole]   = useState('');   // active role filter
  const [editTarget,   setEditTarget]   = useState(null); // which user is being edited
  const [form,         setForm]         = useState({ ...EMPTY }); // edit form data
  const [saving,       setSaving]       = useState(false);// save in progress flag
  const [deleteTarget, setDeleteTarget] = useState(null); // which user to delete
```

**Line by line:**

- `useState([])` — starts as an empty array, will be filled with users from the API
- `useState(true)` — starts as `true` (loading), becomes `false` when data arrives
- `useState('')` — starts as empty string, updated as the user types in the search box
- Every `set___` function triggers a re-render when called

---

### Props — parent passes data to child components

```jsx
{editTarget && (
  <EditModal
    form={form}           // ← prop: the current form data
    setForm={setForm}     // ← prop: function to update form data
    onSubmit={handleSubmit} // ← prop: what to do on form submit
    onClose={() => setEditTarget(null)} // ← prop: what to do on close
    saving={saving}       // ← prop: whether save is in progress
  />
)}
```

The `EditModal` component receives all of this as **props**. It does not own this data — `Users` does.

---

### Inside `EditModal` — receiving and using props

```jsx
function EditModal({ form, setForm, onSubmit, onClose, saving }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
```

- `{ form, setForm, onSubmit, onClose, saving }` — destructured from props
- `EditModal` reads `form` to display current values
- It calls `setForm` (which lives in the parent) to update values
- It calls `onSubmit` and `onClose` (also from the parent) when buttons are clicked

**The flow:**
```
Users (parent)
  └── owns: users[], form, saving, editTarget
  └── passes as props to:
        EditModal  → receives form, setForm, onSubmit, onClose, saving
        DeleteModal → receives user, onClose, onConfirm
        RoleBadge  → receives role
        PasswordCell → receives value
```

**Expected output:** The parent `Users` holds all data in state. Child components like `EditModal`, `RoleBadge`, and `PasswordCell` receive data via props and render it — they never fetch data themselves.

---

### Another example — `RoleBadge` is a pure props-only child

```jsx
function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.student;
  const Icon = m.icon;
  return (
    <span className="usr-role-badge" style={{ '--c': m.color, '--bg': m.bg }}>
      <Icon size={10} /> {m.label}
    </span>
  );
}
```

- Takes one prop: `role`
- Has **no state** — it just renders based on what it receives
- Used in the table: `<RoleBadge role={u.role} />`

---

---

# PART 4 — Global State Management
> **Concept:** State shared across all pages — logged-in user, role, theme.
> **Files:** `frontend/src/context/AuthContext.jsx`, `frontend/src/App.jsx`

---

### What is Global State?

Some data needs to be available **everywhere** — not just in one component. Examples:
- Who is logged in?
- What is their role (admin / faculty / student)?
- What theme is active?

React's **Context API** solves this. One provider wraps the whole app, and any component can read from it.

---

### Step 1 — Creating the context in `AuthContext.jsx`

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
```

- `createContext(null)` — creates a "channel" that any component can subscribe to
- `null` is the default value before the provider sets it

---

### Step 2 — The Provider holds all global state

```jsx
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
```

**Line by line:**

- `useState(() => JSON.parse(...))` — lazy initializer: reads from `localStorage` on first render so the user stays logged in after a page refresh
- `user` — the logged-in user object (`{ id, name, email, role }`)
- `token` — the JWT used to authenticate API requests
- `loading` — `true` while verifying the token on startup

---

### Step 3 — Derived values and the `can()` permission function

```jsx
  const role      = user?.role ?? null;
  const isAdmin   = role === 'admin';
  const isFaculty = role === 'faculty';
  const isStudent = role === 'student';

  const can = (module) => {
    if (!user) return false;
    if (isAdmin) return true;
    const studentBlocked = ['dashboard', 'faculty', 'scheduling', 'events', 'research', 'instructional', 'rooms', 'audit', 'users'];
    const facultyBlocked = ['dashboard', 'student', 'scheduling', 'events', 'research', 'instructional', 'rooms', 'audit', 'users'];
    if (isStudent && studentBlocked.includes(module)) return false;
    if (isFaculty && facultyBlocked.includes(module)) return false;
    return true;
  };
```

**Line by line:**

- `user?.role ?? null` — optional chaining: safely reads `role` even if `user` is `null`
- `isAdmin`, `isFaculty`, `isStudent` — boolean shortcuts derived from `role`
- `can(module)` — returns `true` if the current user is allowed to access that module
  - Admin can access everything
  - Students are blocked from dashboard, faculty, scheduling, etc.
  - Faculty are blocked from student management, audit, etc.

---

### Step 4 — The Provider wraps the whole app

In `frontend/src/main.jsx`:

```jsx
<AuthProvider>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</AuthProvider>
```

Every component inside `<AuthProvider>` can now read the global auth state.

---

### Step 5 — Any component reads global state with `useAuth()`

```jsx
export const useAuth = () => useContext(AuthContext);
```

Usage in `App.jsx`:

```jsx
function AppShell() {
  const { user, logout, role, can } = useAuth();
```

Usage in the sidebar to show the logged-in user's name:

```jsx
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
```

- `user.name` — the logged-in user's name, available on every page because it comes from global context
- `role` — used to display "Administrator", "Faculty", or "Student" label

**Expected output:** The logged-in user's name and role appear in the sidebar on every single page — Dashboard, Students, Users, everywhere — because they all read from the same global `AuthContext`.

---

### Theme is also global state (in `AppShell`)

```jsx
const [darkMode, setDarkMode] = useState(false);

useEffect(() => {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') { setDarkMode(true); document.documentElement.classList.add('dark'); }
}, []);

const toggleTheme = () => {
  const next = !darkMode;
  setDarkMode(next);
  document.documentElement.classList.toggle('dark', next);
  localStorage.setItem('theme', next ? 'dark' : 'light');
};
```

- `darkMode` state controls the theme
- `document.documentElement.classList.toggle('dark', next)` — adds/removes the `dark` class on `<html>`, which CSS variables pick up to switch the entire color scheme
- `localStorage.setItem` — persists the preference across page refreshes

---

---

# PART 5 — Data Flow
> **Concept:** One-way data flow (parent → child) and controlled inputs.
> **Files:** `frontend/src/modules/Users/Users.jsx`

---

### One-Way Data Flow

In React, data flows in **one direction only**: from parent to child via props.
Children never push data back up directly — they call **callback functions** that the parent provided.

```
AuthContext (global)
    ↓ user, role, can()
AppShell
    ↓ (renders based on role)
Users (parent)
    ↓ form, saving, onSubmit, onClose
    EditModal (child)
    DeleteModal (child)
    RoleBadge (child)
    PasswordCell (child)
```

Data only flows **down** the arrows. Children communicate back up by calling functions passed as props.

---

### Controlled Input — the search box

A **controlled input** is one where React state is the single source of truth for the input's value.

```jsx
// State declaration — owns the search value
const [search, setSearch] = useState('');

// The controlled input
<input
  className="usr-search"
  placeholder="Search name or email…"
  value={search}                          // ← value comes FROM state
  onChange={e => setSearch(e.target.value)} // ← state is updated ON every keystroke
/>
{search && <button onClick={() => setSearch('')}><FaTimes /></button>}
```

**Line by line:**

| Line | What it does |
|------|-------------|
| `value={search}` | The input always displays whatever is in `search` state — React controls it |
| `onChange={e => setSearch(e.target.value)}` | Every keystroke updates state, which re-renders the input with the new value |
| `{search && <button ...>}` | The clear button only appears when `search` is not empty |

This is called "controlled" because the input has no memory of its own — React state is the only source of truth.

---

### The search value flows down to the API call

```jsx
const load = useCallback(async () => {
  setLoading(true); setError('');
  try {
    const params = {};
    if (filterRole) params.role = filterRole;
    if (search)     params.search = search;   // ← search state used here
    setUsers(await api.getUsers(params));
  } catch (e) { setError(e.message); }
  finally { setLoading(false); }
}, [filterRole, search]);  // ← re-runs when search changes

useEffect(() => { load(); }, [load]);
```

- `useCallback` memoizes `load` — it only recreates when `filterRole` or `search` changes
- `useEffect` calls `load()` whenever `load` changes (i.e. whenever `search` or `filterRole` changes)
- This creates a reactive chain: **type in search box → state updates → load() re-runs → API called → users list updates**

---

### Callback props — child communicates back to parent

```jsx
// In Users (parent) — defines what happens when edit modal closes
const openEdit = u => {
  setForm({ ...u, password: '', login_id: u.login_id || '' });
  setEditTarget(u);
};

// Passes the close handler as a prop
<EditModal
  onClose={() => setEditTarget(null)}  // ← callback prop
  onSubmit={handleSubmit}              // ← callback prop
/>
```

Inside `EditModal` (child):

```jsx
function EditModal({ form, setForm, onSubmit, onClose, saving }) {
  return (
    <div className="usr-overlay" onClick={onClose}>  {/* calls parent's onClose */}
      ...
      <form onSubmit={onSubmit}>  {/* calls parent's handleSubmit */}
```

The child never modifies parent state directly — it calls the functions the parent gave it.

---

---

# PART 6 — Search Filter, Role-Based Routing, Access Control
> **Concept:** Filter UI, role-based navigation, and route protection.
> **Files:** `frontend/src/modules/Users/Users.jsx`, `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/context/AuthContext.jsx`

---

## 6A — Search Filter in Users Page

The search filter is a controlled input (covered in Part 5) that feeds into the API call.

```jsx
// Role filter buttons
<div className="usr-role-filters">
  {['', 'admin', 'faculty', 'student'].map(r => (
    <button
      key={r}
      className={`usr-filter-btn ${filterRole === r ? 'active' : ''}`}
      onClick={() => setFilterRole(r)}
    >
      {r ? ROLE_META[r].label : 'All'}
    </button>
  ))}
</div>
```

**Line by line:**

- `['', 'admin', 'faculty', 'student'].map(r => ...)` — renders 4 buttons: All, Admin, Faculty, Student
- `filterRole === r ? 'active' : ''` — highlights the currently selected filter
- `onClick={() => setFilterRole(r)}` — updates state, which triggers `load()` via `useCallback`/`useEffect`

The grouped display filters by role:

```jsx
const grouped = ['admin', 'faculty', 'student'].reduce((acc, r) => {
  acc[r] = users.filter(u => u.role === r);
  return acc;
}, {});
```

- `reduce` builds an object: `{ admin: [...], faculty: [...], student: [...] }`
- Each group is rendered in its own table section

---

## 6B — Role-Based Routing (Admin vs User view)

The navigation menu itself is role-filtered. In `App.jsx`:

```jsx
const NAV_GROUPS = [
  {
    label: 'Main Menu',
    items: [
      { path: '/dashboard', name: 'Dashboard', roles: ['admin'] },
      { path: '/students',  name: 'Students',  nameStudent: 'My Profile', roles: ['admin','student'] },
      { path: '/faculty',   name: 'Faculty',   nameFaculty: 'My Profile', roles: ['admin','faculty'] },
      { path: '/users',     name: 'Users',     roles: ['admin'] },
    ],
  },
  ...
];
```

- `roles: ['admin']` — only admins see this nav item
- `roles: ['admin','student']` — admins and students see this item
- `nameStudent: 'My Profile'` — students see it labeled "My Profile" instead of "Students"

Then in the sidebar render:

```jsx
const visibleItems = group.items.filter(item => item.roles.includes(role));
```

- `role` comes from `useAuth()` (global state)
- Items whose `roles` array does not include the current role are filtered out entirely — they don't even appear in the DOM

---

## 6C — Prevent Access to Protected Routes (ProtectedRoute)

**File:** `frontend/src/components/ProtectedRoute.jsx`

```jsx
export default function ProtectedRoute({ module, children }) {
  const { user, can, isStudent, isFaculty } = useAuth();

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/" replace />;

  // Role not allowed → show Access Denied, then redirect
  if (!can(module)) {
    const fallback = isStudent ? '/students' : isFaculty ? '/faculty' : '/dashboard';
    return <AccessDenied fallback={fallback} isStudent={isStudent} isFaculty={isFaculty} />;
  }

  // Allowed → render the page
  return children;
}
```

**Line by line:**

| Line | What it does |
|------|-------------|
| `if (!user)` | If nobody is logged in, redirect to `/` (login page) immediately |
| `if (!can(module))` | Calls the `can()` function from `AuthContext` — checks if this role can access this module |
| `<Navigate to="/" replace />` | React Router redirect — no page reload, just URL change |
| `<AccessDenied />` | Shows a "You don't have permission" message for 2 seconds, then redirects |
| `return children` | If all checks pass, render the actual page component |

---

### The `can()` function — the permission engine

Back in `AuthContext.jsx`:

```jsx
const can = (module) => {
  if (!user) return false;           // not logged in → deny everything
  if (isAdmin) return true;          // admin → allow everything

  const studentBlocked = ['dashboard', 'faculty', 'scheduling', 'events',
                           'research', 'instructional', 'rooms', 'audit', 'users'];
  const facultyBlocked = ['dashboard', 'student', 'scheduling', 'events',
                           'research', 'instructional', 'rooms', 'audit', 'users'];

  if (isStudent && studentBlocked.includes(module)) return false;
  if (isFaculty && facultyBlocked.includes(module)) return false;
  return true;
};
```

- `'users'` is in both `studentBlocked` and `facultyBlocked` — only admins can access `/users`
- `'audit'` is in both — only admins can access `/audit`
- If a student manually types `/users` in the browser, `ProtectedRoute` calls `can('users')`, gets `false`, and shows the Access Denied screen

---

### The `AccessDenied` component — timed redirect

```jsx
function AccessDenied({ fallback, isStudent, isFaculty }) {
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRedirect(true), 2000);  // wait 2 seconds
    return () => clearTimeout(t);                          // cleanup on unmount
  }, []);

  if (redirect) return <Navigate to={fallback} replace />;

  return (
    <div>
      <MdLock size={40} />
      <h2>Access Denied</h2>
      <p>You don't have permission to view this page.</p>
      <p>Redirecting to {dest}…</p>
    </div>
  );
}
```

- `setTimeout(..., 2000)` — waits 2 seconds before setting `redirect` to `true`
- When `redirect` becomes `true`, React re-renders and returns `<Navigate>` which redirects
- `clearTimeout` in the cleanup prevents the timer from firing if the component unmounts early

---

---

# Summary Table

| Part | Concept | File | Key Lines |
|------|---------|------|-----------|
| 1 | Client-Side Routing | `App.jsx` | `<Routes>`, `<Route path=...>`, `<NavLink>` |
| 2 | Dynamic Routing | `App.jsx`, `StudentDetail.jsx` | `path="/students/:id"`, `useParams()`, `navigate()` |
| 3 | Props vs State | `Users.jsx` | `useState([])`, `<EditModal form={form} onClose={...}>` |
| 4 | Global State | `AuthContext.jsx`, `App.jsx` | `createContext`, `AuthProvider`, `useAuth()`, `user.name` |
| 5 | Data Flow | `Users.jsx` | `value={search}`, `onChange`, `useCallback`, `useEffect` |
| 6 | Search + Role-Based Access | `Users.jsx`, `ProtectedRoute.jsx`, `AuthContext.jsx` | `can()`, `roles.includes(role)`, `<Navigate>` |

---

*CCS Profiling System — 4IT-D*
