import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import { Button, Field, Input, Alert, Logo } from '../components/UI';

const passwordRules = (password) => [
  { label: 'At least 8 characters',         met: password.length >= 8 },
  { label: 'At least one uppercase letter',  met: /[A-Z]/.test(password) },
  { label: 'At least one number',            met: /[0-9]/.test(password) },
  { label: 'At least one special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
];

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email:            location.state?.email || '',
    otp:              '',
    new_password:     '',
    confirm_password: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const rules = passwordRules(form.new_password);
    if (rules.some(r => !r.met)) {
      setError('Please meet all password requirements');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email:        form.email,
        otp:          form.otp,
        new_password: form.new_password,
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const rules = passwordRules(form.new_password);
  const metCount = rules.filter(r => r.met).length;
  const strengthColors = ['', '#DC2626', '#f0a500', '#2563eb', '#16A34A'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Logo size="md" />
        <p style={styles.tagline}>Learn Together, Grow Together</p>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Reset password</h2>
          <p style={styles.cardSubtitle}>
            Enter the code sent to your email and choose a new password
          </p>

          {error && (
            <Alert type="error" style={{ marginBottom: '16px' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>

            <Field label="University Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@university.edu.pk"
                value={form.email}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Reset Code" htmlFor="otp">
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={form.otp}
                onChange={handleChange}
                maxLength={6}
                required
                style={styles.otpInput}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </Field>

            <Field label="New Password" htmlFor="new_password">
              <Input
                id="new_password"
                name="new_password"
                type="password"
                placeholder="Create a strong password"
                value={form.new_password}
                onChange={handleChange}
                required
              />
              {form.new_password.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{
                      flex: 1, height: '3px',
                      background: 'var(--border)',
                      borderRadius: '2px', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(metCount / 4) * 100}%`,
                        background: strengthColors[metCount],
                        transition: 'width 0.3s, background 0.3s',
                        borderRadius: '2px',
                      }} />
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: '600',
                      color: strengthColors[metCount], minWidth: '36px',
                    }}>
                      {strengthLabels[metCount]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {rules.map(r => (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: r.met ? '#16A34A' : 'var(--text-muted)', fontWeight: '600' }}>
                          {r.met ? '✓' : '○'}
                        </span>
                        <span style={{ fontSize: '11px', color: r.met ? '#16A34A' : 'var(--text-muted)' }}>
                          {r.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Field>

            <Field label="Confirm New Password" htmlFor="confirm_password">
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                placeholder="Repeat new password"
                value={form.confirm_password}
                onChange={handleChange}
                required
              />
              {form.confirm_password.length > 0 && (
                <p style={{
                  fontSize: '11px', marginTop: '4px', fontWeight: '600',
                  color: form.new_password === form.confirm_password
                    ? '#16A34A' : '#DC2626',
                }}>
                  {form.new_password === form.confirm_password
                    ? '✓ Passwords match'
                    : '✗ Passwords do not match'}
                </p>
              )}
            </Field>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading}
              style={{ marginTop: '4px' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>

          </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/login" style={styles.link}>Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--background)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  container: {
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tagline: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
    marginBottom: '28px',
  },
  card: {
    width: '100%',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '28px',
    boxShadow: 'var(--shadow-sm)',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '22px',
    lineHeight: '1.6',
  },
  otpInput: {
    width: '100%',
    height: '52px',
    padding: '0 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    fontSize: '24px',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: '10px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s',
  },
  link: {
    fontSize: '13px',
    color: 'var(--primary)',
    fontWeight: '500',
    textDecoration: 'none',
  },
};

export default ResetPassword;