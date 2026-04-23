# CCS Profiling System — Setup Guide

## Prerequisites

Install these first if not already on the machine:

| Tool | Download |
|------|----------|
| Node.js v18+ | https://nodejs.org |
| XAMPP (MySQL + Apache) | https://www.apachefriends.org |
| Git | https://git-scm.com |

---

## Step 1 — Clone the repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

---

## Step 2 — Start MySQL via XAMPP

1. Open **XAMPP Control Panel**
2. Click **Start** next to **MySQL**
3. Make sure it shows green / running

---

## Step 3 — Create the database

Open **phpMyAdmin** (`http://localhost/phpmyadmin`) or use the MySQL CLI:

```sql
CREATE DATABASE ccs_db;
```

Then import the schema:

- In phpMyAdmin → select `ccs_db` → **Import** → choose `backend/src/config/schema.sql` → click **Go**

Or via CLI:

```bash
mysql -u root -p ccs_db < backend/src/config/schema.sql
```

---

## Step 4 — Configure backend environment

Create a `.env` file inside the `backend/` folder:

```bash
# backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ccs_db
JWT_SECRET=ccs_super_secret_2026
PORT=5000
```

> If your MySQL has a password, put it in `DB_PASSWORD`.

---

## Step 5 — Install backend dependencies

```bash
cd backend
npm install
```

---

## Step 6 — Seed the database

```bash
# Seed sample data (10 students, 5 faculty, schedules, etc.)
npm run seed

# Optional: add 1000 students, 50 faculty, 50 subjects, 25 research papers
node --experimental-vm-modules src/config/bulk_seed.js
```

---

## Step 7 — Start the backend

```bash
npm run dev
```

You should see:
```
✅ MySQL connected
🚀 Server running at http://localhost:5000
```

---

## Step 8 — Install frontend dependencies

Open a **new terminal**:

```bash
cd frontend
npm install
```

---

## Step 9 — Configure frontend environment

The `frontend/.env` file should already exist with:

```
VITE_API_URL=http://localhost:5000/api
```

If it doesn't, create it with that content.

---

## Step 10 — Start the frontend

```bash
npm run dev
```

Open your browser at: **http://localhost:5173**

---

## Default Login Credentials

| Role | Login ID / Email | Password |
|------|-----------------|----------|
| Admin | admin@ccs.edu | admin123 |
| Faculty | 1234567 | 1234567 |
| Student | 1111111 | 1111111 |

---

## Quick Reference — Running the system

Every time you want to run the system:

1. Start **XAMPP → MySQL**
2. In terminal 1 → `cd backend && npm run dev`
3. In terminal 2 → `cd frontend && npm run dev`
4. Open **http://localhost:5173**

---

## Troubleshooting

**"MySQL connection failed"**
- Make sure XAMPP MySQL is running
- Check `DB_PASSWORD` in `backend/.env` matches your MySQL root password

**"Cannot connect to server"**
- Make sure the backend is running on port 5000
- Check `frontend/.env` has `VITE_API_URL=http://localhost:5000/api`

**Blank page / 404 on refresh**
- This is normal in dev mode — React Router handles routing client-side
- Use `npm run dev` not `npm run preview` for local development

**Port already in use**
- Change `PORT=5001` in `backend/.env` and update `frontend/.env` to match
