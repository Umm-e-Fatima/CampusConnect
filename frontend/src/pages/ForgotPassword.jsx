import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.logo}>روشنی</h1>
          <h2 style={styles.title}>Check Your Email</h2>
          <p style={styles.subtitle}>
            If <strong>{email}</strong> is registered, a reset code has been sent.
            Check your inbox and enter the code on the next screen.
          </p>
          <button
            style={styles.button}
            onClick={() => navigate('/reset-password', { state: { email } })}
          >
            Enter Reset Code
          </button>
          <p style={styles.link}>
            <Link to="/login" style={styles.linkText}>Back to Login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>روشنی</h1>
        <h2 style={styles.title}>Forgot Password</h2>
        <p style={styles.subtitle}>
          Enter your university email and we will send you a reset code
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>University Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="yourname@cs.lgu.edu.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            style={loading ? { ...styles.button, opacity: 0.7 } : styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
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

export default ForgotPassword;