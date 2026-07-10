import React from 'react';

// ── Button 
export const Button = ({
  children, variant = 'primary', size = 'md',
  fullWidth = false, onClick, type = 'button',
  disabled = false, style = {},
}) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '6px', fontFamily: 'Inter, sans-serif', fontWeight: '500',
    borderRadius: 'var(--radius-sm)', border: 'none', outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : 'auto',
    transition: 'background 0.15s',
  };
  const sizes = {
    sm:  { height: '32px', padding: '0 12px', fontSize: '12px' },
    md:  { height: '40px', padding: '0 18px', fontSize: '13px' },
    lg:  { height: '48px', padding: '0 24px', fontSize: '14px' },
  };
  const variants = {
    primary: { background: 'var(--primary)',      color: '#fff' },
    accent:  { background: 'var(--accent)',        color: 'var(--text-primary)' },
    outline: { background: 'var(--surface)',       color: 'var(--primary)',      border: '1px solid var(--primary)' },
    ghost:   { background: 'transparent',          color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    danger:  { background: 'var(--surface)',       color: 'var(--error)',         border: '1px solid var(--error)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

// ── Card 
export const Card = ({ children, style = {}, onClick, hoverable = false }) => (
  <div onClick={onClick} style={{
    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', padding: '20px',
    boxShadow: 'var(--shadow-sm)',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }}>
    {children}
  </div>
);

// ── Badge 
export const Badge = ({ children, tone = 'navy', style = {} }) => {
  const tones = {
    navy:   { background: 'var(--primary-light)', color: 'var(--primary)' },
    gold:   { background: 'rgba(240,165,0,0.12)',  color: '#92620a' },
    green:  { background: 'var(--success-bg)',     color: 'var(--success)' },
    blue:   { background: '#DBEAFE',               color: '#1d4ed8' },
    red:    { background: 'var(--error-bg)',        color: 'var(--error)' },
    gray:   { background: 'var(--surface-muted)',  color: 'var(--text-secondary)' },
    pink:   { background: '#FCE7F3',               color: '#9d174d' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 9px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '500',
      ...tones[tone], ...style,
    }}>
      {children}
    </span>
  );
};

// ── Input 
export const Input = ({ style = {}, ...props }) => (
  <input style={{
    width: '100%', height: '42px', padding: '0 13px',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif', ...style,
  }}
    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
    onBlur={e => e.target.style.borderColor = 'var(--border)'}
    {...props}
  />
);

// ── Select 
export const Select = ({ children, style = {}, ...props }) => (
  <select style={{
    width: '100%', height: '42px', padding: '0 36px 0 13px',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif', cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
    ...style,
  }}
    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
    onBlur={e => e.target.style.borderColor = 'var(--border)'}
    {...props}
  >
    {children}
  </select>
);

// ── Textarea 
export const Textarea = ({ style = {}, ...props }) => (
  <textarea style={{
    width: '100%', minHeight: '90px', padding: '10px 13px',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif', resize: 'vertical', ...style,
  }}
    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
    onBlur={e => e.target.style.borderColor = 'var(--border)'}
    {...props}
  />
);

// ── Field 
export const Field = ({ label, hint, children, style = {} }) => (
  <div style={{ marginBottom: '14px', ...style }}>
    <label style={{
      display: 'block', fontSize: '13px', fontWeight: '500',
      color: 'var(--text-primary)', marginBottom: '5px',
    }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{hint}</p>}
  </div>
);

// ── Alert 
export const Alert = ({ children, type = 'error', style = {} }) => {
  const types = {
    error:   { background: 'var(--error-bg)',    color: 'var(--error)',   border: '1px solid rgba(220,38,38,0.15)' },
    success: { background: 'var(--success-bg)',  color: '#15803d',        border: '1px solid rgba(22,163,74,0.2)' },
    info:    { background: 'var(--info-bg)',      color: 'var(--primary)', border: '1px solid rgba(30,58,138,0.15)' },
  };
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
      fontSize: '13px', lineHeight: '1.5', ...types[type], ...style,
    }}>
      {children}
    </div>
  );
};

// ── Modal 
export const Modal = ({ children, onClose, title, maxWidth = '480px' }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(15,23,42,0.45)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    padding: '20px', zIndex: 1000,
  }}>
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
      padding: '24px', width: '100%', maxWidth,
      maxHeight: '90vh', overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(15,23,42,0.18)',
      border: '1px solid var(--border)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--primary)' }}>
          {title}
        </h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        )}
      </div>
      {children}
    </div>
  </div>
);

// ── Navbar 
export const Navbar = ({ userName, onLogout, showPWA = true }) => (
  <nav style={{
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    height: '60px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 24px',
    position: 'sticky', top: 0, zIndex: 100,
    boxShadow: 'var(--shadow-sm)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg width="34" height="34" viewBox="0 0 34 34">
        <rect width="34" height="34" rx="8" fill="#1E3A8A" />
        <text
          x="5" y="26"
          fontFamily="Georgia, serif"
          fontWeight="700"
          fontSize="22"
          fill="#f0a500"
        >C</text>
        <text
          x="14" y="28"
          fontFamily="Georgia, serif"
          fontWeight="700"
          fontSize="18"
          fill="white"
          opacity="0.92"
        >C</text>
      </svg>
      <span style={{
        fontSize: '15px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontWeight: '700',
        letterSpacing: '-0.2px',
      }}>
        <span style={{ color: '#1E3A8A' }}>Campus</span>
        <span style={{ color: '#f0a500' }}>Connect</span>
      </span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {showPWA && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '3px 10px', background: 'var(--success-bg)',
          borderRadius: '20px', fontSize: '11px', fontWeight: '500',
          color: 'var(--success)',
        }}>
          <span style={{
            width: '6px', height: '6px', background: 'var(--success)',
            borderRadius: '50%', display: 'inline-block',
          }} />
          PWA: Offline Engine Ready
        </span>
      )}
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {userName}
      </span>
      <Button variant="ghost" size="sm" onClick={onLogout}>
        Logout
      </Button>
    </div>
  </nav>
);

// ── PageWrapper 
export const PageWrapper = ({ children }) => (
  <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
    {children}
  </div>
);

// ── PageContent 
export const PageContent = ({ children }) => (
  <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>
    {children}
  </div>
);

// ── PageHeader 
export const PageHeader = ({ title, action, onBack }) => (
  <div style={{
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: '24px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
      )}
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
        {title}
      </h1>
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ── Tabs 
export const Tabs = ({ tabs, active, onChange }) => (
  <div style={{
    display: 'inline-flex', gap: '3px',
    background: 'var(--surface-muted)', padding: '4px',
    borderRadius: 'var(--radius-md)', marginBottom: '24px',
  }}>
    {tabs.map(tab => (
      <button key={tab.value} onClick={() => onChange(tab.value)} style={{
        padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
        fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        fontWeight: active === tab.value ? '600' : '400',
        background: active === tab.value ? 'var(--surface)' : 'transparent',
        color: active === tab.value ? 'var(--primary)' : 'var(--text-secondary)',
        boxShadow: active === tab.value ? 'var(--shadow-sm)' : 'none',
        transition: 'all 0.15s',
      }}>
        {tab.label}
      </button>
    ))}
  </div>
);

// ── Switch 
export const Switch = ({ checked, onChange, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <button type="button" role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)} style={{
        position: 'relative', width: '40px', height: '22px',
        borderRadius: '11px', border: 'none', cursor: 'pointer',
        background: checked ? 'var(--primary)' : 'var(--border)',
        transition: 'background 0.2s', flexShrink: 0,
      }}>
      <span style={{
        position: 'absolute', top: '2px',
        left: checked ? '20px' : '2px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
    {label && <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{label}</span>}
  </div>
);

// ── EmptyState ─
export const EmptyState = ({ title, description, action }) => (
  <div style={{
    textAlign: 'center', padding: '56px 20px',
    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  }}>
    <h3 style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
      {title}
    </h3>
    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: action ? '20px' : 0 }}>
      {description}
    </p>
    {action}
  </div>
);

// ── StatCard 
export const StatCard = ({ value, label }) => (
  <div style={{
    background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)',
    padding: '16px 20px',
  }}>
    <span style={{ fontSize: '26px', fontWeight: '500', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
      {value}
    </span>
    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
      {label}
    </span>
  </div>
);

// ── Logo 
export const Logo = ({ size = 'md' }) => {
  const sizes = {
    sm: { box: 36, rx: 8,  font1: 24, font2: 19, x1: 8,  y1: 28, x2: 18, y2: 31 },
    md: { box: 56, rx: 12, font1: 38, font2: 30, x1: 11, y1: 44, x2: 26, y2: 47 },
    lg: { box: 68, rx: 14, font1: 46, font2: 37, x1: 14, y1: 54, x2: 32, y2: 57 },
  };
  const s = sizes[size];
  const textSize = { sm: 15, md: 22, lg: 26 }[size];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width={s.box} height={s.box} viewBox={`0 0 ${s.box} ${s.box}`}>
        <rect width={s.box} height={s.box} rx={s.rx} fill="#1E3A8A" />
        <text
          x={s.x1} y={s.y1}
          fontFamily="Georgia, serif"
          fontWeight="700"
          fontSize={s.font1}
          fill="#f0a500"
        >C</text>
        <text
          x={s.x2} y={s.y2}
          fontFamily="Georgia, serif"
          fontWeight="700"
          fontSize={s.font2}
          fill="white"
          opacity="0.92"
        >C</text>
      </svg>
      <span style={{
        fontSize: textSize,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontWeight: '800',
        letterSpacing: '-0.5px',
      }}>
        <span style={{ color: '#1E3A8A' }}>Campus</span>
        <span style={{ color: '#f0a500' }}>Connect</span>
      </span>
    </div>
  );
};