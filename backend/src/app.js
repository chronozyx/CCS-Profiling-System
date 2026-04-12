import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { sanitizeRequest } from './middlewares/sanitize.js';
import { auditLog }        from './middlewares/audit.middleware.js';

import authRoutes      from './routes/auth.routes.js';
import studentRoutes   from './routes/student.routes.js';
import facultyRoutes   from './routes/faculty.routes.js';
import eventRoutes     from './routes/event.routes.js';
import researchRoutes  from './routes/research.routes.js';
import roomRoutes      from './routes/room.routes.js';
import scheduleRoutes  from './routes/schedule.routes.js';
import materialRoutes  from './routes/material.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import auditRoutes     from './routes/audit.routes.js';
import userRoutes      from './routes/user.routes.js';

const app = express();

// ── Security headers ───────────────────────────────────────────────────────
app.disable('x-powered-by');                          // don't advertise Express
app.use((_, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// ── CORS — restrict to known origins ──────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:4173')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // allow server-to-server / curl in dev (no origin header)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Body parsing — cap payload size to prevent DoS ────────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// ── Global input sanitization ─────────────────────────────────────────────
app.use(sanitizeRequest);

// ── Audit logging — runs after auth middleware populates req.user ─────────
app.use(auditLog);

// ── Simple in-memory rate limiter (no extra deps) ─────────────────────────
const hits = new Map();
const RATE_WINDOW = 60_000;   // 1 minute
const RATE_LIMIT  = 200;      // requests per window per IP

app.use((req, res, next) => {
  const ip  = req.ip;
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, start: now };

  if (now - rec.start > RATE_WINDOW) {
    rec.count = 1; rec.start = now;
  } else {
    rec.count += 1;
  }
  hits.set(ip, rec);

  if (rec.count > RATE_LIMIT) {
    return res.status(429).json({ message: 'Too many requests — slow down' });
  }
  next();
});

// Tighter limit on auth endpoints (20 req/min per IP)
const authHits = new Map();
const AUTH_LIMIT = 20;
app.use('/api/auth', (req, res, next) => {
  const ip  = req.ip;
  const now = Date.now();
  const rec = authHits.get(ip) || { count: 0, start: now };
  if (now - rec.start > RATE_WINDOW) { rec.count = 1; rec.start = now; }
  else rec.count += 1;
  authHits.set(ip, rec);
  if (rec.count > AUTH_LIMIT)
    return res.status(429).json({ message: 'Too many login attempts — try again later' });
  next();
});

// ── Health check (public) ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/students',  studentRoutes);
app.use('/api/faculty',   facultyRoutes);
app.use('/api/events',    eventRoutes);
app.use('/api/research',  researchRoutes);
app.use('/api/rooms',     roomRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit',    auditRoutes);
app.use('/api/users',    userRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

// ── Global error handler — never leak stack traces to client ──────────────
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  console.error(`[${new Date().toISOString()}] ${status} — ${err.message}`);
  // Only expose message for client errors; hide internals for 5xx
  res.status(status).json({
    message: status < 500 ? err.message : 'Internal server error',
  });
});

export default app;
