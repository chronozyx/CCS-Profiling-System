import pool from '../config/db.js';

const PAGE_SIZE = 50;

export const getAuditLogs = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)   || 1);
    const status = ['allowed', 'denied', 'error'].includes(req.query.status)
      ? req.query.status : null;
    const role   = ['admin', 'faculty', 'student'].includes(req.query.role)
      ? req.query.role : null;
    const userId = req.query.user_id ? parseInt(req.query.user_id) : null;

    let sql = `
      SELECT a.id, a.user_id, u.name AS user_name, a.role,
             a.method, a.endpoint, a.status, a.http_code,
             a.ip, a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status)  { sql += ' AND a.status = ?';  params.push(status); }
    if (role)    { sql += ' AND a.role = ?';    params.push(role); }
    if (userId)  { sql += ' AND a.user_id = ?'; params.push(userId); }

    // Count total for pagination
    const countSql = sql.replace(
      /SELECT[\s\S]+?FROM audit_logs/,
      'SELECT COUNT(*) AS total FROM audit_logs'
    );
    const [[{ total }]] = await pool.query(countSql, params);

    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(PAGE_SIZE, (page - 1) * PAGE_SIZE);

    const [rows] = await pool.query(sql, params);

    res.json({
      data:       rows,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error('[audit] getAuditLogs:', err.message);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

export const getAuditStats = async (_req, res) => {
  try {
    const [[counts]] = await pool.query(`
      SELECT
        COUNT(*)                                          AS total,
        SUM(status = 'allowed')                          AS allowed,
        SUM(status = 'denied')                           AS denied,
        SUM(status = 'error')                            AS errors,
        SUM(status = 'denied' AND created_at >= NOW() - INTERVAL 1 HOUR) AS denied_last_hour
      FROM audit_logs
    `);

    const [byRole] = await pool.query(`
      SELECT role, COUNT(*) AS count
      FROM audit_logs
      WHERE role IS NOT NULL
      GROUP BY role
    `);

    const [topEndpoints] = await pool.query(`
      SELECT endpoint, method, COUNT(*) AS hits
      FROM audit_logs
      GROUP BY endpoint, method
      ORDER BY hits DESC
      LIMIT 10
    `);

    const [recentDenied] = await pool.query(`
      SELECT a.id, a.user_id, u.name AS user_name, a.role,
             a.method, a.endpoint, a.http_code, a.ip, a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status = 'denied'
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    res.json({ counts, byRole, topEndpoints, recentDenied });
  } catch (err) {
    console.error('[audit] getAuditStats:', err.message);
    res.status(500).json({ message: 'Failed to fetch audit stats' });
  }
};

export const clearOldLogs = async (req, res) => {
  try {
    // Keep last 90 days by default; admin can pass ?days=N
    const days = Math.min(Math.max(parseInt(req.query.days) || 90, 7), 365);
    const [result] = await pool.query(
      'DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL ? DAY', [days]
    );
    res.json({ deleted: result.affectedRows, message: `Cleared logs older than ${days} days` });
  } catch (err) {
    console.error('[audit] clearOldLogs:', err.message);
    res.status(500).json({ message: 'Failed to clear logs' });
  }
};
