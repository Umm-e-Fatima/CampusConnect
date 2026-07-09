import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import { Button, Field, Alert, Logo } from '../components/UI';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setSuccess('Email verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <Logo size="md" />
        <p style={styles.tagline}>Learn Together, Grow Together</p>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Verify your email</h2>
          <p style={styles.cardSubtitle}>
            We sent a 6-digit code to{' '}
            <strong style={{ color: 'var(--primary)' }}>
              {email || 'your university email'}
            </strong>
          </p>

          {error && (
            <Alert type="error" style={{ marginBottom: '16px' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert type="success" style={{ marginBottom: '16px' }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Field
              label="Verification Code"
              htmlFor="otp"
              hint="Check your terminal-OTP prints there during development"
            >
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                style={styles.otpInput}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </Field>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={loading || otp.length < 6}
              style={{ marginTop: '4px' }}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/register" style={styles.link}>
              Wrong email? Go back
            </Link>
          </div>
        </div>

        <p style={styles.bottomText}>
          Already verified?{' '}
          <Link to="/login" style={styles.linkBold}>
            Login here
          </Link>
        </p>

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
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '22px',
    lineHeight: '1.6',
  },
  otpInput: {
    width: '100%',
    height: '56px',
    padding: '0 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    fontSize: '28px',
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
  bottomText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  linkBold: {
    color: 'var(--primary)',
    fontWeight: '700',
    textDecoration: 'none',
  },
};

export default VerifyOTP;