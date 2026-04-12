import 'dotenv/config';
import app from './app.js';
import pool from './config/db.js';

const PORT = process.env.PORT || 5000;

// Test DB connection then start
pool.getConnection()
  .then(conn => {
    conn.release();
    console.log('✅ MySQL connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📋 API base: http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Make sure MySQL is running and ccs_db exists.');
    process.exit(1);
  });
