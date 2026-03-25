// db.config.js
const { Pool } = require("pg");
require("dotenv").config();

console.log('[db.config] Connecting with:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD ? '***set***' : '***NOT SET***',
});

const pool = new Pool({
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
});

// Log any pool-level connection errors
pool.on('error', (err) => {
  console.error('[db.config] Unexpected pool error:', err.message);
});

// Test the connection on startup
pool.query('SELECT 1').then(() => {
  console.log('[db.config] ✅ Database connected successfully');
}).catch((err) => {
  console.error('[db.config] ❌ Database connection failed:', err.message);
});

module.exports = pool;
