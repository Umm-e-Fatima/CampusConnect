const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('connect', () => console.log('Connected to PostgreSQL'));
pool.on('error', (err) => { console.error('DB error:', err); process.exit(-1); });

module.exports = pool;