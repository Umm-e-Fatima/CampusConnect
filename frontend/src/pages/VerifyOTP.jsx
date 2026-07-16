import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';

const OTP_LENGTH = 6;

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [digits, setDigits]   = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) {
      // No email in state means this page was opened directly
      setError('No email found. Please register or log in again.');
    }
  }, [email]);

  const focusInput = (index) => {
    if (inputsRef.current[index]) inputsRef.current[index].focus();
  };

  const handleChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email) {
      setError('No email found. Please register or log in again.');
      return;
    }
    if (!isComplete) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      navigate('/login', { state: { verified: true } });
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('No email found. Please register or log in again.');
      return;
    }
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      setInfo('A new code has been sent to your email.');
      setDigits(Array(OTP_LENGTH).fill(''));
      focusInput(0);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .otp-page { min-height: 100vh; display: flex; flex-direction: column; background: #FBF3E5; font-family: 'Nunito', sans-serif; color: #3A3630; }
        .otp-nav { display: flex; align-items: center; padding: 14px 40px; flex-shrink: 0; }
        .otp-brand { display: flex; align-items: center; gap: 10px; }
        .otp-brand-mark { width: 30px; height: 30px; border-radius: 8px; background: #1D6F68; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 12px; }
        .otp-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; color: #134F4A; }
        .otp-brand-tag { font-size: 11px; color: #8A8172; margin-left: 2px; }
        .otp-hero { flex: 1; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 20px; padding-left: 56px; min-height: 0; }
        .otp-left { max-width: 440px; }
        .otp-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 34px; color: #134F4A; line-height: 1.15; margin-bottom: 10px; letter-spacing: -0.01em; }
        .otp-sub { font-size: 13px; color: #8A8172; line-height: 1.65; margin-bottom: 22px; max-width: 380px; }
        .otp-sub b { color: #3A3630; }
        .otp-error { background: #ffeaea; color: #c0392b; border: 1px solid rgba(192,57,43,0.2); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 14px; }
        .otp-info { background: #e9f7f0; color: #1D6F68; border: 1px solid rgba(29,111,104,0.2); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 14px; }
        .otp-row { display: flex; gap: 10px; margin-bottom: 22px; }
        .otp-box { width: 48px; height: 56px; background: #FFFDF8; border: 2px solid #E9DCC3; border-radius: 12px; text-align: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 20px; color: #134F4A; outline: none; transition: border-color 0.15s; }
        .otp-box:focus { border-color: #E2903C; }
        .otp-box.filled { border-color: #E2903C; }
        .otp-btn { background: #E2903C; color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13.5px; padding: 12px 32px; border: none; border-radius: 999px; cursor: pointer; box-shadow: 0 8px 20px rgba(226,144,60,.35); transition: background 0.15s; }
        .otp-btn:hover { background: #C97324; }
        .otp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .otp-resend { margin-top: 18px; font-size: 12.5px; color: #8A8172; }
        .otp-resend button { background: none; border: none; padding: 0; color: #C97324; font-weight: 700; text-decoration: none; cursor: pointer; font-size: 12.5px; font-family: 'Nunito', sans-serif; }
        .otp-resend button:disabled { opacity: 0.6; cursor: not-allowed; }
        .otp-back { margin-top: 12px; font-size: 12.5px; }
        .otp-back a { color: #1D6F68; text-decoration: underline; text-underline-offset: 3px; }
        .otp-right { position: relative; height: 100%; min-height: 480px; overflow: hidden; }
        .otp-right svg { display: block; width: 100%; height: 100%; }
      `}</style>

      <div className="otp-page">

        {/* Navbar */}
        <nav className="otp-nav">
          <div className="otp-brand">
            <div className="otp-brand-mark">CC</div>
            <div className="otp-brand-name">CampusConnect</div>
            <span className="otp-brand-tag">· learn together, grow together</span>
          </div>
        </nav>

        {/* Hero */}
        <div className="otp-hero">

          {/* Left */}
          <div className="otp-left">
            <h1 className="otp-h1">Check your inbox.</h1>
            <p className="otp-sub">
              Enter the 6-digit code sent to <b>{email || 'your university email'}</b> to confirm it's really you.
            </p>

            {error && <div className="otp-error">{error}</div>}
            {info && <div className="otp-info">{info}</div>}

            <form onSubmit={handleSubmit}>
              <div className="otp-row" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    className={`otp-box${d ? ' filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="otp-btn"
                disabled={loading || !isComplete}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            <div className="otp-resend">
              Didn't get a code?{' '}
              <button type="button" onClick={handleResend} disabled={resending}>
                {resending ? 'Sending...' : 'Resend'}
              </button>
            </div>
            <div className="otp-back">
              <Link to="/login">← Back to login</Link>
            </div>
          </div>

          {/* Right — wave image */}
          <div className="otp-right">
            <svg viewBox="0 0 600 860" preserveAspectRatio="xMidYMid slice">
              <defs>
                <clipPath id="otpWave">
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
                clipPath="url(#otpWave)"
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

export default VerifyOTP;