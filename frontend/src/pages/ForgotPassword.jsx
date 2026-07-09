import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Button, Field, Input, Alert, Logo } from '../components/UI';

const ForgotPassword = () => {
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <Logo size="md" />
          <p style={styles.tagline}>Learn Together, Grow Together</p>

          <div style={styles.card}>
            <div style={styles.successIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.02-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <h2 style={styles.cardTitle}>Check your email</h2>
            <p style={styles.cardSubtitle}>
              If <strong style={{ color: 'var(--primary)' }}>{email}</strong> is
              registered, a reset code has been sent. Check your inbox and enter
              the code on the next screen.
            </p>

            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => navigate('/reset-password', { state: { email } })}
              style={{ marginBottom: '12px' }}
            >
              Enter Reset Code
            </Button>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login" style={styles.link}>Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Logo size="md" />
        <p style={styles.tagline}>Learn Together, Grow Together</p>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Forgot password?</h2>
          <p style={styles.cardSubtitle}>
            Enter your university email and we will send you a reset code
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
                type="email"
                placeholder="you@university.edu.pk"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading}
              style={{ marginTop: '4px' }}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
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
  successIcon: {
    width: '52px',
    height: '52px',
    background: 'var(--success-bg)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '6px',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '22px',
    lineHeight: '1.6',
    textAlign: 'center',
  },
  link: {
    fontSize: '13px',
    color: 'var(--primary)',
    fontWeight: '500',
    textDecoration: 'none',
  },
};

export default ForgotPassword;