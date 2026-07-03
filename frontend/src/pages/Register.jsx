import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Button, Field, Input, Select, Alert } from '../components/UI';

const validatePassword = (password) => {
  const rules = [
    { label: 'At least 8 characters',         met: password.length >= 8 },
    { label: 'At least one uppercase letter',  met: /[A-Z]/.test(password) },
    { label: 'At least one number',            met: /[0-9]/.test(password) },
    { label: 'At least one special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  return rules;
};

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const rules = validatePassword(password);
  const metCount = rules.filter(r => r.met).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][metCount];
  const strengthColor = ['', '#e53e3e', '#f0a500', '#2b6cb0', '#2d6a4f'][metCount];
  const barWidth = `${(metCount / 4) * 100}%`;

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Strength bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{
          flex: 1,
          height: '4px',
          backgroundColor: '#eef1f6',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: barWidth,
            backgroundColor: strengthColor,
            borderRadius: '2px',
            transition: 'width 0.3s, background-color 0.3s',
          }} />
        </div>
        <span style={{ fontSize: '12px', fontWeight: '600', color: strengthColor, minWidth: '40px' }}>
          {strengthLabel}
        </span>
      </div>
      {/* Rules checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {rules.map(rule => (
          <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: rule.met ? '#2d6a4f' : '#cbd5e0',
            }}>
              {rule.met ? '✓' : '○'}
            </span>
            <span style={{ fontSize: '12px', color: rule.met ? '#2d6a4f' : 'var(--text-muted)' }}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Register = () => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    gender: '',
    department: '',
    semester: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const rules = validatePassword(form.password);
    if (rules.some(r => !r.met)) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        ...form,
        semester: form.semester ? parseInt(form.semester) : null,
      });
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
          <h2 style={styles.cardTitle}>Create account</h2>
          <p style={styles.cardSubtitle}>
            Join your campus community on CampusConnect
          </p>

          {error && (
            <Alert type="error" style={{ marginBottom: '16px' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>

            <Field label="Full Name" htmlFor="full_name">
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Your full name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </Field>

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
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <PasswordStrength password={form.password} />
            </Field>

            <Field label="Gender" htmlFor="gender">
              <Select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Select>
            </Field>

            <div style={styles.row}>
              <Field label="Department" htmlFor="department" style={{ flex: 1, marginRight: '12px' }}>
                <Input
                  id="department"
                  name="department"
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={form.department}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Semester" htmlFor="semester" style={{ width: '120px' }}>
                <Select
                  id="semester"
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

          </form>
        </div>

        <p style={styles.loginText}>
          Already have an account?{' '}
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
  row: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  loginText: {
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

export default Register;