import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button, Field, Input, Alert } from '../components/UI';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <span style={styles.logoText}>
            <span style={styles.logoNavy}>Campus</span>
            <span style={styles.logoGold}>Connect</span>
          </span>
        </div>

        <p style={styles.tagline}>Learn Together, Grow Together</p>

        {/* Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Welcome back</h2>
          <p style={styles.cardSubtitle}>Sign in to your CampusConnect account</p>

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
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </Field>

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/forgot-password" style={styles.link}>
              Forgot password?
            </Link>
          </div>
        </div>

        <p style={styles.registerText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.linkBold}>
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: 'var(--background)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  container: {
    width: '100%',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  logoIcon: {
    width: '44px',
    height: '44px',
    backgroundColor: 'var(--primary)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '26px',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontWeight: '800',
    letterSpacing: '-0.5px',
  },
  logoNavy: {
    color: 'var(--primary)',
  },
  logoGold: {
    color: 'var(--accent)',
  },
  tagline: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '28px',
  },
  card: {
    width: '100%',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '32px',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    marginBottom: '4px',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
  },
  link: {
    fontSize: '14px',
    color: 'var(--primary)',
    fontWeight: '600',
    textDecoration: 'none',
  },
  registerText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  linkBold: {
    color: 'var(--primary)',
    fontWeight: '700',
    textDecoration: 'none',
  },
};

export default Login;