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
        .rp-page { height: 100vh; overflow: hidden; display: flex; flex-direction: column; background: #FBF3E5; font-family: 'Nunito', sans-serif; color: #3A3630; }
        .rp-nav { display: flex; align-items: center; padding: 14px 40px; flex-shrink: 0; }
        .rp-brand { display: flex; align-items: center; gap: 10px; }
        .rp-brand-mark { width: 30px; height: 30px; border-radius: 8px; background: #1D6F68; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 12px; }
        .rp-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; color: #134F4A; }
        .rp-brand-tag { font-size: 11px; color: #8A8172; margin-left: 2px; }
        .rp-hero { flex: 1; display: grid; grid-template-columns: 1fr 1fr; min-height: 0; overflow: hidden; }
        .rp-left { display: flex; flex-direction: column; justify-content: center; padding: 18px 48px 18px 56px; overflow-y: auto; }
        .rp-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 30px; color: #134F4A; line-height: 1.15; margin-bottom: 8px; letter-spacing: -0.01em; }
        .rp-sub { font-size: 13px; color: #8A8172; line-height: 1.6; margin-bottom: 14px; max-width: 380px; }
        .rp-sub b { color: #3A3630; }
        .rp-error { background: #ffeaea; color: #c0392b; border: 1px solid rgba(192,57,43,0.2); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 12px; max-width: 380px; }
        .rp-form { max-width: 380px; }
        .rp-label { display: block; font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: #3A3630; margin-bottom: 5px; letter-spacing: 0.03em; text-transform: uppercase; }
        .rp-otp-row { display: flex; gap: 8px; margin-bottom: 14px; }
        .rp-otp-box { width: 40px; height: 48px; background: #FFFDF8; border: 2px solid #E9DCC3; border-radius: 10px; text-align: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 17px; color: #134F4A; outline: none; transition: border-color 0.15s; }
        .rp-otp-box.filled { border-color: #E2903C; }
        .rp-input { width: 100%; background: #FFFDF8; border: 1px solid #E9DCC3; border-radius: 10px; padding: 10px 14px; color: #3A3630; font-size: 13px; margin-bottom: 4px; font-family: 'Nunito', sans-serif; transition: border-color 0.15s; }
        .rp-hint { font-size: 11px; color: #8A8172; margin: 0 0 10px; }
        .rp-mismatch { font-size: 11px; color: #c0392b; margin: 0 0 10px; }
        .rp-checklist { list-style: none; margin: 6px 0 12px 0; padding: 8px 10px; background: #FFFDF8; border: 1px solid #E9DCC3; border-radius: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; }
        .rp-check-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #8A8172; transition: color 0.15s; }
        .rp-check-item.passed { color: #1D6F68; font-weight: 600; }
        .rp-check-icon { width: 13px; height: 13px; border-radius: 50%; border: 1.5px solid #D8CBB0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .rp-check-item.passed .rp-check-icon { background: #1D6F68; border-color: #1D6F68; }
        .rp-check-icon svg { width: 7px; height: 7px; display: block; opacity: 0; transition: opacity 0.15s; }
        .rp-check-item.passed .rp-check-icon svg { opacity: 1; }
        .rp-btn { background: #E2903C; color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13.5px; padding: 12px 32px; border: none; border-radius: 999px; cursor: pointer; box-shadow: 0 8px 20px rgba(226,144,60,.35); margin-top: 4px; transition: background 0.15s; }
        .rp-back-line { margin-top: 14px; font-size: 12px; }
        .rp-back-line a { color: #1D6F68; text-decoration: underline; text-underline-offset: 3px; }
        .rp-right { position: relative; overflow: hidden; }
        .rp-right svg.rp-wave-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
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
              Enter the code sent to <b>{email || 'your university email'}</b> and choose a new password.
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
              {passwordsMatch && <div style={{ marginBottom: '10px' }} />}

              <button
                type="submit"
                className="rp-btn"
                disabled={!canSubmit}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="rp-back-line">
              <Link to="/login">Back to login</Link>
            </div>
          </div>

          {/* Right — wave image */}
          <div className="rp-right">
            <svg
              className="rp-wave-svg"
              viewBox="0 0 600 900"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <clipPath id="rpWave">
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
                clipPath="url(#rpWave)"
              />
            </svg>
          </div>

        </div>
      </div>
    </>
  );
};

export default ResetPassword;