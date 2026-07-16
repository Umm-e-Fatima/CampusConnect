import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .fp-input:focus { border-color: #1D6F68 !important; outline: none; }
        .fp-btn:hover { background: #C97324 !important; }
        .fp-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .fp-page { min-height: 100vh; display: flex; flex-direction: column; background: #FBF3E5; font-family: 'Nunito', sans-serif; color: #3A3630; }
        .fp-nav { display: flex; align-items: center; padding: 26px 48px; flex-shrink: 0; }
        .fp-brand { display: flex; align-items: center; gap: 10px; }
        .fp-brand-mark { width: 32px; height: 32px; border-radius: 9px; background: #1D6F68; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 13px; }
        .fp-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 15px; color: #134F4A; }
        .fp-brand-tag { font-family: 'Nunito', sans-serif; font-size: 11.5px; color: #8A8172; margin-left: 2px; }
        .fp-hero { flex-grow: 1; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 20px; padding-left: 64px; min-height: 0; }
        .fp-left { max-width: 440px; }
        .fp-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 40px; color: #134F4A; line-height: 1.15; margin: 0 0 14px; letter-spacing: -0.01em; }
        .fp-sub { font-size: 14.5px; color: #8A8172; line-height: 1.7; margin: 0 0 28px; max-width: 380px; }
        .fp-error { background: #ffeaea; color: #c0392b; border: 1px solid rgba(192,57,43,0.2); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 16px; max-width: 360px; }
        .fp-form { max-width: 360px; }
        .fp-label { display: block; font-family: 'Poppins', sans-serif; font-size: 11.5px; font-weight: 600; color: #3A3630; margin-bottom: 6px; letter-spacing: 0.02em; }
        .fp-input { width: 100%; background: #FFFDF8; border: 1px solid #E9DCC3; border-radius: 12px; padding: 12px 16px; color: #3A3630; font-size: 13.5px; margin-bottom: 16px; font-family: 'Nunito', sans-serif; transition: border-color 0.15s; }
        .fp-btn { background: #E2903C; color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 14px; padding: 14px 34px; border: none; border-radius: 999px; cursor: pointer; box-shadow: 0 10px 22px rgba(226,144,60,.35); margin-top: 4px; transition: background 0.15s; }
        .fp-back-line { margin-top: 22px; font-size: 12.5px; }
        .fp-back-line a { color: #1D6F68; text-decoration: underline; text-underline-offset: 3px; }
        .fp-right { position: relative; height: 100%; min-height: 480px; overflow: hidden; }
        .fp-right svg { display: block; width: 100%; height: 100%; }
      `}</style>

      <div className="fp-page">

        {/* Navbar */}
        <nav className="fp-nav">
          <div className="fp-brand">
            <div className="fp-brand-mark">CC</div>
            <div className="fp-brand-name">CampusConnect</div>
            <span className="fp-brand-tag">· learn together, grow together</span>
          </div>
        </nav>

        {/* Hero */}
        <div className="fp-hero">

          {/* Left */}
          <div className="fp-left">
            <h1 className="fp-h1">Lost your page?</h1>
            <p className="fp-sub">
              Enter your university email and we'll send a code to help you back in.
            </p>

            {error && <div className="fp-error">{error}</div>}

            <form className="fp-form" onSubmit={handleSubmit}>
              <label className="fp-label">University Email</label>
              <input
                className="fp-input"
                type="email"
                placeholder="you@university.edu.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="fp-btn"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>

            <div className="fp-back-line">
              <Link to="/login">← Back to login</Link>
            </div>
          </div>

          {/* Right — wave image */}
          <div className="fp-right">
            <svg viewBox="0 0 600 860" preserveAspectRatio="xMidYMid slice">
              <defs>
                <clipPath id="fpWave">
                  <path d="
                    M600,0 L600,860
                    C480,860 340,860 340,800
                    C340,740 440,740 440,680
                    C440,620 300,620 300,560
                    C300,500 400,500 400,440
                    C400,380 260,380 260,320
                    C260,260 380,260 380,200
                    C380,140 260,140 260,80
                    C260,20 460,20 600,0 Z
                  " />
                </clipPath>
              </defs>
              <image
                href="/library.jpg"
                x="0" y="0"
                width="600" height="860"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#fpWave)"
              />
              <circle cx="300" cy="560" r="30" fill="#FBF3E5" />
              <circle cx="380" cy="260" r="26" fill="#FBF3E5" />
            </svg>
          </div>

        </div>
      </div>
    </>
  );
};

export default ForgotPassword;