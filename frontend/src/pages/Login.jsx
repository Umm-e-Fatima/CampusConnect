import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Login = () => {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-input:focus { border-color: #1D6F68 !important; outline: none; }
        .login-btn:hover { background: #C97324 !important; }
        .login-page { height: 100vh; overflow: hidden; display: flex; flex-direction: column; background: #FBF3E5; font-family: 'Nunito', sans-serif; color: #3A3630; }
        .login-nav { display: flex; align-items: center; padding: 14px 40px; flex-shrink: 0; }
        .login-brand { display: flex; align-items: center; gap: 10px; }
        .login-brand-mark { width: 30px; height: 30px; border-radius: 8px; background: #1D6F68; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 12px; }
        .login-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; color: #134F4A; }
        .login-brand-tag { font-size: 11px; color: #8A8172; margin-left: 2px; }
        .login-hero { flex: 1; display: grid; grid-template-columns: 1fr 1fr; min-height: 0; overflow: hidden; }
        .login-left { display: flex; flex-direction: column; justify-content: center; padding: 20px 48px 28px 56px; }
        .login-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 34px; color: #134F4A; line-height: 1.15; margin-bottom: 10px; letter-spacing: -0.01em; }
        .login-sub { font-size: 13px; color: #8A8172; line-height: 1.65; margin-bottom: 18px; max-width: 360px; }
        .login-error { background: #ffeaea; color: #c0392b; border: 1px solid rgba(192,57,43,0.2); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 12px; }
        .login-form { max-width: 340px; }
        .login-label { display: block; font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: #3A3630; margin-bottom: 5px; letter-spacing: 0.03em; text-transform: uppercase; }
        .login-input { width: 100%; background: #FFFDF8; border: 1px solid #E9DCC3; border-radius: 10px; padding: 10px 14px; color: #3A3630; font-size: 13px; margin-bottom: 12px; font-family: 'Nunito', sans-serif; transition: border-color 0.15s; }
        .login-btn { background: #E2903C; color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13.5px; padding: 12px 32px; border: none; border-radius: 999px; cursor: pointer; box-shadow: 0 8px 20px rgba(226,144,60,.35); margin-top: 4px; transition: background 0.15s; }
        .login-links { display: flex; align-items: center; gap: 16px; margin-top: 16px; font-size: 12px; }
        .login-links a { color: #1D6F68; text-decoration: underline; text-underline-offset: 3px; }
        .login-links .reg a { color: #C97324; font-weight: 700; text-decoration: none; }
        .login-right { position: relative; overflow: hidden; }
        .login-right svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
      `}</style>

      <div className="login-page">

        {/* Navbar */}
        <nav className="login-nav">
          <div className="login-brand">
            <div className="login-brand-mark">CC</div>
            <div className="login-brand-name">CampusConnect</div>
            <span className="login-brand-tag">· learn together, grow together</span>
          </div>
        </nav>

        {/* Hero */}
        <div className="login-hero">

          {/* Left */}
          <div className="login-left">
            <h1 className="login-h1">Welcome back<br />to your library.</h1>
            <p className="login-sub">
              Sign in to browse notes, trade books, and ask questions
              with students from your own campus,built to work even offline.
            </p>

            {error && <div className="login-error">{error}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="login-label">University Email</label>
              <input
                className="login-input"
                name="email"
                type="email"
                placeholder="you@university.edu.pk"
                value={form.email}
                onChange={handleChange}
                required
              />
              <label className="login-label">Password</label>
              <input
                className="login-input"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="submit"
                className="login-btn"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <div className="login-links">
              <Link to="/forgot-password">Forgot password?</Link>
              <span className="reg">New here? <Link to="/register">Register</Link></span>
            </div>
          </div>

          {/* Right — wave image fills full right half */}
          <div className="login-right">
            <svg
              viewBox="0 0 600 900"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <clipPath id="wave">
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
                clipPath="url(#wave)"
              />
            </svg>
          </div>

        </div>
      </div>
    </>
  );
};

export default Login;