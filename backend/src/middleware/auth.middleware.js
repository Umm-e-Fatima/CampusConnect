const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    // 1. Check token exists in header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });

    // 2. Verify token is valid and not tampered
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check session is still active in DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await pool.query(
      'SELECT id FROM sessions WHERE token_hash = $1 AND is_active = TRUE AND expires_at > NOW()',
      [tokenHash]
    );
    if (session.rows.length === 0)
      return res.status(401).json({ error: 'Session expired or revoked' });

    // 4. Update last seen
    await pool.query(
      'UPDATE sessions SET last_used_at = NOW() WHERE token_hash = $1',
      [tokenHash]
    );

    // 5. Attach user info to request
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Only allows female students through
const womenOnly = async (req, res, next) => {
  const result = await pool.query(
    'SELECT gender FROM users WHERE id = $1',
    [req.user.id]
  );
  if (result.rows[0]?.gender !== 'female')
    return res.status(403).json({ error: 'This is restricted to female students' });
  next();
};

module.exports = { authenticate, womenOnly };