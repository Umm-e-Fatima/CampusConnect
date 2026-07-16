import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';

const OTP_LENGTH = 6;

const PASSWORD_RULES = [
  { key: 'length',    label: 'At least 8 characters',   test: (v) => v.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter',     test: (v) => /[A-Z]/.test(v) },
  { key: 'lowercase', label: 'One lowercase letter',     test: (v) => /[a-z]/.test(v) },
  { key: 'number',    label: 'One number',               test: (v) => /[0-9]/.test(v) },
  { key: 'special',   label: 'One special character',    test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  const focusInput = (index) => {
    if (inputsRef.current[index]) inputsRef.current[index].focus();
  };

  const handleOtpChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < OTP_LENGTH - 1) focusInput(index + 1);
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const otp = digits.join('');
  const isOtpComplete = otp.length === OTP_LENGTH;

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(newPassword),
  }));
  const isPasswordValid = passwordChecks.every((r) => r.passed);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const canSubmit = isOtpComplete && isPasswordValid && passwordsMatch && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('No email found. Please restart the password reset process.');
      return;
    }
    if (!isOtpComplete) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        new_password: newPassword,
      });
      navigate('/login', { state: { passwordReset: true } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .rp-input:focus, .rp-otp-box:focus { border-color: #1D6F68 !important; outline: none; }
        .rp-btn:hover { background: #C97324 !important; }
        .rp-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .rp-page { min-height: 100vh; display: flex; flex-direction: column; background: #FBF3E5; font-family: 'Nunito', sans-serif; color: #3A3630; }
        .rp-nav { display: flex; align-items: center; padding: 26px 48px; flex-shrink: 0; }
        .rp-brand { display: flex; align-items: center; gap: 10px; }
        .rp-brand-mark { width: 32px; height: 32px; border-radius: 9px; background: #1D6F68; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 13px; }
        .rp-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 15px; color: #134F4A; }
        .rp-brand-tag { font-family: 'Nunito', sans-serif; font-size: 11.5px; color: #8A8172; margin-left: 2px; }
        .rp-hero { flex-grow: 1; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 20px; padding-left: 64px; min-height: 0; }
        .rp-left { max-width: 460px; }
        .rp-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 36px; color: #134F4A; line-height: 1.15; margin: 0 0 10px; letter-spacing: -0.01em; }
        .rp-sub { font-size: 14px; color: #8A8172; line-height: 1.65; margin: 0 0 20px; max-width: 400px; }
        .rp-sub b { color: #3A3630; }
        .rp-error { background: #ffeaea; color: #c0392b; border: 1px solid rgba(192,57,43,0.2); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 14px; max-width: 400px; }
        .rp-form { max-width: 400px; }
        .rp-label { display: block; font-family: 'Poppins', sans-serif; font-size: 11.5px; font-weight: 600; color: #3A3630; margin-bottom: 6px; letter-spacing: 0.02em; }
        .rp-otp-row { display: flex; gap: 8px; margin-bottom: 18px; }
        .rp-otp-box { width: 44px; height: 52px; background: #FFFDF8; border: 2px solid #E9DCC3; border-radius: 12px; text-align: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 18px; color: #134F4A; outline: none; transition: border-color 0.15s; }
        .rp-otp-box.filled { border-color: #E2903C; }
        .rp-input { width: 100%; background: #FFFDF8; border: 1px solid #E9DCC3; border-radius: 12px; padding: 12px 16px; color: #3A3630; font-size: 13.5px; margin-bottom: 4px; font-family: 'Nunito', sans-serif; transition: border-color 0.15s; }
        .rp-hint { font-size: 11px; color: #8A8172; margin: 0 0 14px; }
        .rp-mismatch { font-size: 11px; color: #c0392b; margin: 0 0 14px; }
        .rp-checklist { list-style: none; margin: 0 0 14px 0; padding: 10px 12px; background: #FFFDF8; border: 1px solid #E9DCC3; border-radius: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; }
        .rp-check-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #8A8172; transition: color 0.15s; }
        .rp-check-item.passed { color: #1D6F68; font-weight: 600; }
        .rp-check-icon { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid #D8CBB0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .rp-check-item.passed .rp-check-icon { background: #1D6F68; border-color: #1D6F68; }
        .rp-check-icon svg { width: 8px; height: 8px; display: block; opacity: 0; transition: opacity 0.15s; }
        .rp-check-item.passed .rp-check-icon svg { opacity: 1; }
        .rp-btn { background: #E2903C; color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 14px; padding: 14px 34px; border: none; border-radius: 999px; cursor: pointer; box-shadow: 0 10px 22px rgba(226,144,60,.35); margin-top: 4px; transition: background 0.15s; }
        .rp-back-line { margin-top: 20px; font-size: 12.5px; }
        .rp-back-line a { color: #1D6F68; text-decoration: underline; text-underline-offset: 3px; }
        .rp-right { position: relative; height: 100%; min-height: 480px; overflow: hidden; }
        .rp-right svg.rp-wave-svg { display: block; width: 100%; height: 100%; }
      `}</style>

      <div className="rp-page">

        {/* Navbar */}
        <nav className="rp-nav">
          <div className="rp-brand">
            <div className="rp-brand-mark">CC</div>
            <div className="rp-brand-name">CampusConnect</div>
            <span className="rp-brand-tag">· learn together, grow together</span>
          </div>
        </nav>

        {/* Hero */}
        <div className="rp-hero">

          {/* Left */}
          <div className="rp-left">
            <h1 className="rp-h1">A fresh chapter.</h1>
            <p className="rp-sub">
              Enter the code sent to <b>{email || 'your university email'}</b> and choose a new password to get back to your shelf.
            </p>

            {error && <div className="rp-error">{error}</div>}

            <form className="rp-form" onSubmit={handleSubmit}>
              <label className="rp-label">Reset Code</label>
              <div className="rp-otp-row" onPaste={handleOtpPaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    className={`rp-otp-box${d ? ' filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>

              <label className="rp-label">New Password</label>
              <input
                className="rp-input"
                type="password"
                placeholder="Create a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                required
              />
              {(passwordFocused || newPassword.length > 0) && (
                <ul className="rp-checklist">
                  {passwordChecks.map((rule) => (
                    <li
                      key={rule.key}
                      className={`rp-check-item${rule.passed ? ' passed' : ''}`}
                    >
                      <span className="rp-check-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}

              <label className="rp-label">Confirm Password</label>
              <input
                className="rp-input"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <div className="rp-mismatch">Passwords do not match</div>
              )}
              {passwordsMatch && <div style={{ marginBottom: '14px' }} />}

              <button
                type="submit"
                className="rp-btn"
                disabled={!canSubmit}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="rp-back-line">
              <Link to="/login">← Back to login</Link>
            </div>
          </div>

          {/* Right — wave image */}
          <div className="rp-right">
            <svg className="rp-wave-svg" viewBox="0 0 600 860" preserveAspectRatio="xMidYMid slice">
              <defs>
                <clipPath id="rpWave">
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
                clipPath="url(#rpWave)"
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

export default ResetPassword;