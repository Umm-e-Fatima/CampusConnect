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
        .fp-page { height: 100vh; overflow: hidden; display: flex; flex-direction: column; background: #FBF3E5; font-family: 'Nunito', sans-serif; color: #3A3630; }
        .fp-nav { display: flex; align-items: center; padding: 14px 40px; flex-shrink: 0; }
        .fp-brand { display: flex; align-items: center; gap: 10px; }
        .fp-brand-mark { width: 30px; height: 30px; border-radius: 8px; background: #1D6F68; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 12px; }
        .fp-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; color: #134F4A; }
        .fp-brand-tag { font-size: 11px; color: #8A8172; margin-left: 2px; }
        .fp-hero { flex: 1; display: grid; grid-template-columns: 1fr 1fr; min-height: 0; overflow: hidden; }
        .fp-left { display: flex; flex-direction: column; justify-content: center; padding: 20px 48px 28px 56px; }
        .fp-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 34px; color: #134F4A; line-height: 1.15; margin-bottom: 10px; letter-spacing: -0.01em; }
        .fp-sub { font-size: 13px; color: #8A8172; line-height: 1.65; margin-bottom: 18px; max-width: 360px; }
        .fp-error { background: #ffeaea; color: #c0392b; border: 1px solid rgba(192,57,43,0.2); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 12px; }
        .fp-form { max-width: 340px; }
        .fp-label { display: block; font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: #3A3630; margin-bottom: 5px; letter-spacing: 0.03em; text-transform: uppercase; }
        .fp-input { width: 100%; background: #FFFDF8; border: 1px solid #E9DCC3; border-radius: 10px; padding: 10px 14px; color: #3A3630; font-size: 13px; margin-bottom: 12px; font-family: 'Nunito', sans-serif; transition: border-color 0.15s; }
        .fp-btn { background: #E2903C; color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13.5px; padding: 12px 32px; border: none; border-radius: 999px; cursor: pointer; box-shadow: 0 8px 20px rgba(226,144,60,.35); margin-top: 4px; transition: background 0.15s; }
        .fp-back-line { display: flex; align-items: center; gap: 16px; margin-top: 16px; font-size: 12px; }
        .fp-back-line a { color: #1D6F68; text-decoration: underline; text-underline-offset: 3px; }
        .fp-right { position: relative; overflow: hidden; }
        .fp-right svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
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
              <Link to="/login">Back to login</Link>
            </div>
          </div>

          {/* Right — wave image */}
          <div className="fp-right">
            <svg
              viewBox="0 0 600 900"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <clipPath id="fpWave">
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
                clipPath="url(#fpWave)"
              />
            </svg>
          </div>

        </div>
      </div>
    </>
  );
};

export default ForgotPassword;