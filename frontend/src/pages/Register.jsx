import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const PASSWORD_RULES = [
  { key: 'length',    label: 'At least 8 characters',   test: (v) => v.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter',     test: (v) => /[A-Z]/.test(v) },
  { key: 'lowercase', label: 'One lowercase letter',     test: (v) => /[a-z]/.test(v) },
  { key: 'number',    label: 'One number',               test: (v) => /[0-9]/.test(v) },
  { key: 'special',   label: 'One special character',    test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const Register = () => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    gender: '',
    department: '',
    semester: '',
  });
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(form.password),
  }));
  const isPasswordValid = passwordChecks.every((r) => r.passed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password does not meet all requirements.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .reg-input:focus, .reg-select:focus { border-color: #1D6F68 !important; outline: none; }
        .reg-btn:hover { background: #C97324 !important; }
        .reg-btn:disabled { cursor: not-allowed; }
        .reg-page { height: 100vh; overflow: hidden; display: flex; flex-direction: column; background: #FBF3E5; font-family: 'Nunito', sans-serif; color: #3A3630; }
        .reg-nav { display: flex; align-items: center; padding: 14px 40px; flex-shrink: 0; }
        .reg-brand { display: flex; align-items: center; gap: 10px; }
        .reg-brand-mark { width: 30px; height: 30px; border-radius: 8px; background: #1D6F68; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 12px; }
        .reg-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; color: #134F4A; }
        .reg-brand-tag { font-size: 11px; color: #8A8172; margin-left: 2px; }
        .reg-hero { flex: 1; display: grid; grid-template-columns: 1fr 1fr; min-height: 0; overflow: hidden; }
        .reg-left { display: flex; flex-direction: column; justify-content: center; padding: 18px 48px 18px 56px; overflow-y: auto; }
        .reg-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 30px; color: #134F4A; line-height: 1.15; margin-bottom: 6px; letter-spacing: -0.01em; }
        .reg-sub { font-size: 13px; color: #8A8172; line-height: 1.6; margin-bottom: 14px; max-width: 360px; }
        .reg-error { background: #ffeaea; color: #c0392b; border: 1px solid rgba(192,57,43,0.2); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 12px; }
        .reg-form { max-width: 360px; }
        .reg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .reg-label { display: block; font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: #3A3630; margin-bottom: 5px; letter-spacing: 0.03em; text-transform: uppercase; }
        .reg-input, .reg-select { width: 100%; background: #FFFDF8; border: 1px solid #E9DCC3; border-radius: 10px; padding: 10px 14px; color: #3A3630; font-size: 13px; margin-bottom: 12px; font-family: 'Nunito', sans-serif; transition: border-color 0.15s; }
        .reg-select { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238A8172' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>"); background-repeat: no-repeat; background-position: right 12px center; }
        .reg-password-wrap { margin-bottom: 12px; }
        .reg-password-wrap .reg-input { margin-bottom: 0; }
        .reg-checklist { list-style: none; margin: 8px 0 4px 0; padding: 10px 12px; background: #FFFDF8; border: 1px solid #E9DCC3; border-radius: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; }
        .reg-check-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #8A8172; transition: color 0.15s; }
        .reg-check-item.passed { color: #1D6F68; font-weight: 600; }
        .reg-check-icon { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid #D8CBB0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .reg-check-item.passed .reg-check-icon { background: #1D6F68; border-color: #1D6F68; }
        .reg-check-icon svg { width: 8px; height: 8px; display: block; opacity: 0; transition: opacity 0.15s; }
        .reg-check-item.passed .reg-check-icon svg { opacity: 1; }
        .reg-btn { width: 100%; background: #E2903C; color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13.5px; padding: 12px 32px; border: none; border-radius: 999px; cursor: pointer; box-shadow: 0 8px 20px rgba(226,144,60,.35); margin-top: 4px; transition: background 0.15s; }
        .reg-links { display: flex; align-items: center; gap: 6px; margin-top: 14px; font-size: 12px; }
        .reg-links a { color: #C97324; font-weight: 700; text-decoration: none; }
        .reg-right { position: relative; overflow: hidden; }
        .reg-right svg.reg-wave-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
      `}</style>

      <div className="reg-page">

        {/* Navbar */}
        <nav className="reg-nav">
          <div className="reg-brand">
            <div className="reg-brand-mark">CC</div>
            <div className="reg-brand-name">CampusConnect</div>
            <span className="reg-brand-tag">· learn together, grow together</span>
          </div>
        </nav>

        {/* Hero */}
        <div className="reg-hero">

          {/* Left */}
          <div className="reg-left">
            <h1 className="reg-h1">Create your<br />account.</h1>
            <p className="reg-sub">
              Join your campus community-share notes, trade books,
              and ask questions with students from your own university.
            </p>

            {error && <div className="reg-error">{error}</div>}

            <form className="reg-form" onSubmit={handleSubmit}>
              <label className="reg-label">Full Name</label>
              <input
                className="reg-input"
                name="full_name"
                type="text"
                placeholder="Your full name"
                value={form.fullName}
                onChange={handleChange}
                required
              />

              <label className="reg-label">University Email</label>
              <input
                className="reg-input"
                name="email"
                type="email"
                placeholder="you@university.edu.pk"
                value={form.email}
                onChange={handleChange}
                required
              />

              <label className="reg-label">Password</label>
              <div className="reg-password-wrap">
                <input
                  className="reg-input"
                  name="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setPasswordFocused(true)}
                  required
                />
                {(passwordFocused || form.password.length > 0) && (
                  <ul className="reg-checklist">
                    {passwordChecks.map((rule) => (
                      <li
                        key={rule.key}
                        className={`reg-check-item${rule.passed ? ' passed' : ''}`}
                      >
                        <span className="reg-check-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <label className="reg-label">Gender</label>
              <select
                className="reg-select"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>

              <div className="reg-row">
                <div>
                  <label className="reg-label">Department</label>
                  <input
                    className="reg-input"
                    name="department"
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={form.department}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="reg-label">Semester</label>
                  <select
                    className="reg-select"
                    name="semester"
                    value={form.semester}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>-</option>
                    <option value="1">1st</option>
                    <option value="2">2nd</option>
                    <option value="3">3rd</option>
                    <option value="4">4th</option>
                    <option value="5">5th</option>
                    <option value="6">6th</option>
                    <option value="7">7th</option>
                    <option value="8">8th</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="reg-btn"
                disabled={loading || !isPasswordValid}
                style={{ opacity: (loading || !isPasswordValid) ? 0.7 : 1 }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="reg-links">
              <span>Already have an account? <Link to="/login">Login</Link></span>
            </div>
          </div>

          {/* Right — wave image fills full right half */}
          <div className="reg-right">
            <svg
              className="reg-wave-svg"
              viewBox="0 0 600 900"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <clipPath id="regWave">
                  <path d="
                    M0,0 L600,0 L600,900 L0,900
                    C80,900 180,900 180,840
                    C180,780 80,780 80,720
                    C80,660 180,660 180,600
                    C180,540 60,540 60,480
                    C60,420 180,420 180,360
                    C180,300 60,300 60,240
                    C60,180 180,180 180,120
                    C180,60 80,60 0,0 Z
                  " />
                </clipPath>
              </defs>
              <image
                href="/library.jpg"
                x="0" y="0"
                width="600" height="900"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#regWave)"
              />
            </svg>
          </div>

        </div>
      </div>
    </>
  );
};

export default Register;