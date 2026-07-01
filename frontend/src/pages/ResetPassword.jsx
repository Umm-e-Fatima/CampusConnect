import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8)         errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password))     errors.push('At least one uppercase letter');
  if (!/[0-9]/.test(password))     errors.push('At least one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    errors.push('At least one special character');
  return errors;
};

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: location.state?.email || '',
    otp: '',
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (e.target.name === 'new_password') {
      setPasswordErrors(validatePassword(e.target.value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwErrors = validatePassword(form.new_password);
    if (pwErrors.length > 0) {
      setError('Please fix password requirements below');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: form.email,
        otp: form.otp,
        new_password: form.new_password,
      });
      navigate('/login', { state: { message: 'Password reset successfully. Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>روشنی</h1>
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.subtitle}>Enter the code sent to your email and choose a new password</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>

          <div style={styles.field}>
            <label style={styles.label}>University Email</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              placeholder="yourname@cs.lgu.edu.pk"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Reset Code</label>
            <input
              style={styles.otpInput}
              type="text"
              name="otp"
              placeholder="6-digit code"
              value={form.otp}
              onChange={handleChange}
              maxLength={6}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>New Password</label>
            <input
              style={styles.input}
              type="password"
              name="new_password"
              placeholder="Enter new password"
              value={form.new_password}
              onChange={handleChange}
              required
            />
            {/* Password requirement checklist */}
            {form.new_password.length > 0 && (
              <div style={styles.requirementBox}>
                {[
                  { label: 'At least 8 characters',        met: form.new_password.length >= 8 },
                  { label: 'At least one uppercase letter', met: /[A-Z]/.test(form.new_password) },
                  { label: 'At least one number',           met: /[0-9]/.test(form.new_password) },
                  { label: 'At least one special character',met: /[!@#$%^&*(),.?":{}|<>]/.test(form.new_password) },
                ].map(req => (
                  <p key={req.label} style={req.met ? styles.reqMet : styles.reqUnmet}>
                    {req.met ? '✓' : '✗'} {req.label}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              style={styles.input}
              type="password"
              name="confirm_password"
              placeholder="Repeat new password"
              value={form.confirm_password}
              onChange={handleChange}
              required
            />
            {form.confirm_password.length > 0 && (
              <p style={form.new_password === form.confirm_password ? styles.reqMet : styles.reqUnmet}>
                {form.new_password === form.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button
            style={loading ? { ...styles.button, opacity: 0.7 } : styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

        </form>

        <p style={styles.link}>
          <Link to="/login" style={styles.linkText}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    padding: '20px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
  },
  logo: {
    fontSize: '48px',
    marginBottom: '4px',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#2d6a4f',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '28px',
    lineHeight: '1.6',
  },
  error: {
    backgroundColor: '#ffe5e5',
    color: '#c0392b',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  field: {
    marginBottom: '16px',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  otpInput: {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    border: '2px solid #2d6a4f',
    fontSize: '24px',
    textAlign: 'center',
    letterSpacing: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  requirementBox: {
    marginTop: '8px',
    padding: '10px 14px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  reqMet: {
    fontSize: '12px',
    color: '#2d6a4f',
    margin: '3px 0',
  },
  reqUnmet: {
    fontSize: '12px',
    color: '#c0392b',
    margin: '3px 0',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  link: {
    fontSize: '14px',
    color: '#666',
  },
  linkText: {
    color: '#2d6a4f',
    fontWeight: '600',
    textDecoration: 'none',
  },
};

export default ResetPassword;