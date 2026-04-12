import pool from '../config/db.js';

// Endpoints we never log (health checks, static noise)
const SKIP_PATHS = new Set(['/api/health', '/favicon.ico']);

// Classify HTTP status → audit status
const toStatus = (code) => {
  if (code === 401 || code === 403) return 'denied';
  if (code >= 500)                  return 'error';
  return 'allowed';
};

// Fire-and-forget DB write — never blocks the response
const writeLog = (entry) => {
  pool.query(
    `INSERT INTO audit_logs (user_id, role, method, endpoint, status, http_code, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.user_id,
      entry.role,
      entry.method,
      entry.endpoint,
      entry.status,
      entry.http_code,
      entry.ip,
      entry.user_agent,
    ]
  ).catch(err => console.error('[audit] write failed:', err.message));
};

/**
 * auditLog — Express middleware
 *
 * Hooks into res.json() so it captures the final status code
 * after all other middleware (auth, role checks) have run.
 * Must be registered BEFORE routes in app.js.
 */
export const auditLog = (req, res, next) => {
  if (SKIP_PATHS.has(req.path)) return next();

  // Intercept res.json to capture the status at response time
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const code     = res.statusCode;
    const status   = toStatus(code);
    const user     = req.user;

    // Only log auth-relevant endpoints and anything that was denied/errored
    const isAuthPath = req.path.startsWith('/api/auth');
    if (status !== 'allowed' || isAuthPath || user) {
      writeLog({
        user_id:    user?.id    ?? null,
        role:       user?.role  ?? null,
        method:     req.method,
        endpoint:   req.path.slice(0, 255),
        status,
        http_code:  code,
        ip:         (req.ip || '').slice(0, 45),
        user_agent: (req.headers['user-agent'] || '').slice(0, 300),
      });
    }

    return originalJson(body);
  };

  next();
};
