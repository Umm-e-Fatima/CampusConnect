import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button, Field, Input, Alert, Logo } from '../components/UI';
import { subscribeToPush } from '../serviceWorkerRegistration';

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
      // Register push notifications in background
      subscribeToPush(res.data.token);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.Please try again.');
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
          <h2 style={styles.cardTitle}>Welcome back</h2>
          <p style={styles.cardSubtitle}>
            Sign in to your CampusConnect account
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
              size="lg"
              disabled={loading}
              style={{ marginTop: '4px' }}
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

        <p style={styles.bottomText}>
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

export default Login;