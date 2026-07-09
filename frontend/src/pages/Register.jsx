import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Button, Field, Input, Select, Alert, Logo } from '../components/UI';

const passwordRules = (password) => [
  { label: 'At least 8 characters',         met: password.length >= 8 },
  { label: 'At least one uppercase letter',  met: /[A-Z]/.test(password) },
  { label: 'At least one number',            met: /[0-9]/.test(password) },
  { label: 'At least one special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
];

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const rules = passwordRules(password);
  const met = rules.filter(r => r.met).length;
  const colors = ['', '#DC2626', '#f0a500', '#2563eb', '#16A34A'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{
          flex: 1, height: '3px',
          background: 'var(--border)', borderRadius: '2px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${(met / 4) * 100}%`,
            background: colors[met], borderRadius: '2px',
            transition: 'width 0.3s, background 0.3s',
          }} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: '600', color: colors[met], minWidth: '36px' }}>
          {labels[met]}
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
  );
};

const Register = () => {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    gender: '', department: '', semester: '',
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
    const rules = passwordRules(form.password);
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

        <Logo size="md" />
        <p style={styles.tagline}>Learn Together, Grow Together</p>

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

            <div style={{ display: 'flex', gap: '12px' }}>
              <Field
                label="Department"
                htmlFor="department"
                style={{ flex: 1 }}
              >
                <Input
                  id="department"
                  name="department"
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={form.department}
                  onChange={handleChange}
                />
              </Field>

              <Field
                label="Semester"
                htmlFor="semester"
                style={{ width: '110px' }}
              >
                <Select
                  id="semester"
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                >
                  <option value="">-</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={loading}
              style={{ marginTop: '4px' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

          </form>
        </div>

        <p style={styles.bottomText}>
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
    background: 'var(--background)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  container: {
    width: '100%',
    maxWidth: '440px',
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

export default Register;