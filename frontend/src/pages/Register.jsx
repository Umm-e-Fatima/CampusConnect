import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

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
    setLoading(true);

    try {
      await api.post('/auth/register', {
        ...form,
        semester: parseInt(form.semester),
      });
      // Redirect to OTP verification, pass email via state
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h1 style={styles.logo}>روشنی</h1>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Use your university email to register</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>

          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              type="text"
              name="full_name"
              placeholder="Your full name"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>University Email</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              placeholder="yourname@uog.edu.pk"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              placeholder="Min 8 chars, uppercase, number, special character"
              value={form.password}
              onChange={handleChange}
              required
            />
            {form.password.length > 0 && (
              <div style={styles.requirementBox}>
                {[
                  { label: 'At least 8 characters',         met: form.password.length >= 8 },
                  { label: 'At least one uppercase letter',  met: /[A-Z]/.test(form.password) },
                  { label: 'At least one number',            met: /[0-9]/.test(form.password) },
                  { label: 'At least one special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(form.password) },
                ].map(req => (
                  <p key={req.label} style={req.met ? styles.reqMet : styles.reqUnmet}>
                    {req.met ? '✓' : '✗'} {req.label}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Gender</label>
            <select
              style={styles.input}
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1, marginRight: '10px' }}>
              <label style={styles.label}>Department</label>
              <input
                style={styles.input}
                type="text"
                name="department"
                placeholder="e.g. Computer Science"
                value={form.department}
                onChange={handleChange}
              />
            </div>

            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Semester</label>
              <select
                style={styles.input}
                name="semester"
                value={form.semester}
                onChange={handleChange}
              >
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            style={loading ? { ...styles.button, opacity: 0.7 } : styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>

        </form>

        <p style={styles.link}>
          Already have an account?{' '}
          <Link to="/login" style={styles.linkText}>Login here</Link>
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
    maxWidth: '480px',
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
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '28px',
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
  row: {
    display: 'flex',
    flexDirection: 'row',
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
    marginTop: '8px',
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
};

export default Register;