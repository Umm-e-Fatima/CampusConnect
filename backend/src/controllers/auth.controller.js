const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { generateOTP, isOTPExpired } = require('../utils/otp.utils');
const { sendOTPEmail } = require('../utils/email.utils');

//  REGISTER 
const register = async (req, res) => {
  const { full_name, email, password, gender, department, semester } = req.body;

  if (!full_name || !email || !password)
    return res.status(400).json({ error: 'full_name, email and password are required' });

 try {
  // Check email not already registered
  const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rows.length > 0)
    return res.status(409).json({ error: 'Email already registered' });

  // Accept any .edu.pk email  keeps Roshni open to all Pakistani universities
  const emailDomain = email.split('@')[1];
  if (!emailDomain || !emailDomain.endsWith('.edu.pk'))
    return res.status(400).json({ error: 'Please use a valid .edu.pk university email address' });

  const password_hash = await bcrypt.hash(password, 12);
  const otp_code = generateOTP();
  const otp_expires_at = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_MINUTES || 10) * 60000);

  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, gender, department, semester, otp_code, otp_expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, email, full_name`,
    [full_name, email, password_hash, gender, department, semester, otp_code, otp_expires_at]
  );

  console.log(`>>> OTP for ${email}: ${otp_code}`);

  // Send OTP via email
try {
  await sendOTPEmail(email, otp_code);
} catch (emailErr) {
  console.error('Failed to send OTP email:', emailErr.message);
  // Don't block registration if email fails-log and continue
  // OTP still saved in DB so you can check it manually if needed
  console.log(`>>> FALLBACK OTP for ${email}: ${otp_code}`);
}

res.status(201).json({
  message: 'Registered successfully. Check your university email for the OTP.',
  user_id: result.rows[0].id,
});
} catch (err) {
  console.error(err);
  res.status(500).json({ error: 'Registration failed' });
}
}

//  VERIFY OTP 
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ error: 'email and otp are required' });

  try {
    const result = await pool.query(
      'SELECT id, otp_code, otp_expires_at FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user)
      return res.status(404).json({ error: 'User not found' });
    if (user.otp_code !== otp)
      return res.status(400).json({ error: 'Invalid OTP' });
    if (isOTPExpired(user.otp_expires_at))
      return res.status(400).json({ error: 'OTP has expired. Please register again.' });

    await pool.query(
      'UPDATE users SET is_email_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
      [user.id]
    );

    res.json({ message: 'Email verified. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

//  LOGIN 
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  try {
    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, role, university_id, is_email_verified
       FROM users WHERE email = $1 AND is_active = TRUE`,
      [email]
    );
    const user = result.rows[0];

    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.is_email_verified)
      return res.status(403).json({ error: 'Please verify your email first' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, university_id: user.university_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Save session to DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    const deviceInfo = req.headers['user-agent']?.substring(0, 255);

    await pool.query(
      `INSERT INTO sessions (user_id, token_hash, device_info, ip_address, expires_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [user.id, tokenHash, deviceInfo, req.ip, expiresAt]
    );

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

//  LOGOUT 
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query(
      'UPDATE sessions SET is_active = FALSE WHERE token_hash = $1',
      [tokenHash]
    );
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ error: 'email is required' });

  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );
    // Always return success even if email not found — prevents user enumeration
    if (result.rows.length === 0)
      return res.status(200).json({ message: 'If that email exists, a reset code has been sent.' });

    const otp_code = generateOTP();
    const otp_expires_at = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_MINUTES || 10) * 60000);

    await pool.query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
      [otp_code, otp_expires_at, result.rows[0].id]
    );

    try {
      await sendOTPEmail(email, otp_code);
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr.message);
      console.log(`>>> FALLBACK RESET OTP for ${email}: ${otp_code}`);
    }

    res.json({ message: 'If that email exists, a reset code has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { email, otp, new_password } = req.body;
  if (!email || !otp || !new_password)
    return res.status(400).json({ error: 'email, otp and new_password are required' });

  try {
    const result = await pool.query(
      'SELECT id, otp_code, otp_expires_at FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user)
      return res.status(404).json({ error: 'User not found' });
    if (user.otp_code !== otp)
      return res.status(400).json({ error: 'Invalid reset code' });
    if (isOTPExpired(user.otp_expires_at))
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });

    const password_hash = await bcrypt.hash(new_password, 12);

    await pool.query(
      `UPDATE users
       SET password_hash = $1, otp_code = NULL, otp_expires_at = NULL, updated_at = NOW()
       WHERE id = $2`,
      [password_hash, user.id]
    );

    // Revoke all active sessions so old tokens stop working
    await pool.query(
      'UPDATE sessions SET is_active = FALSE WHERE user_id = $1',
      [user.id]
    );

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = { register, verifyOTP, login, logout, forgotPassword, resetPassword };