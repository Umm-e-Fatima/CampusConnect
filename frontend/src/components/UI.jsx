import React from 'react';

// ─── BUTTON 
export const Button = ({
  children,
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  onClick,
  type = 'button',
  disabled = false,
  style = {},
}) => {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background-color 0.15s, border-color 0.15s',
    border: 'none',
    outline: 'none',
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : 'auto',
  };

  const sizes = {
    default: { height: '44px', padding: '0 20px', fontSize: '14px' },
    sm: { height: '36px', padding: '0 14px', fontSize: '13px' },
    icon: { height: '44px', width: '44px', padding: '0' },
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: '#ffffff',
    },
    gold: {
      backgroundColor: 'var(--accent)',
      color: 'var(--text-primary)',
    },
    outline: {
      backgroundColor: 'var(--surface)',
      color: 'var(--primary)',
      border: '1px solid var(--primary)',
    },
    danger: {
      backgroundColor: 'var(--surface)',
      color: 'var(--error)',
      border: '1px solid var(--error)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
};

// ─── CARD 
export const Card = ({ children, style = {}, onClick }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── BADGE 
export const Badge = ({ children, tone = 'gray', style = {} }) => {
  const tones = {
    navy:  { backgroundColor: 'rgba(26,43,74,0.1)',   color: 'var(--primary)' },
    gold:  { backgroundColor: 'rgba(240,165,0,0.15)', color: '#8a6100' },
    green: { backgroundColor: 'var(--success-bg)',    color: 'var(--success)' },
    blue:  { backgroundColor: 'var(--info-bg)',       color: 'var(--info)' },
    red:   { backgroundColor: 'var(--error-bg)',      color: 'var(--error)' },
    gray:  { backgroundColor: '#eef1f6',              color: 'var(--text-secondary)' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      ...tones[tone],
      ...style,
    }}>
      {children}
    </span>
  );
};

// ─── INPUT 
export const Input = ({ style = {}, ...props }) => (
  <input
    style={{
      width: '100%',
      height: '44px',
      padding: '0 14px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--input-border)',
      backgroundColor: 'var(--surface)',
      color: 'var(--text-primary)',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: 'Inter, sans-serif',
      transition: 'border-color 0.15s',
      ...style,
    }}
    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
    onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
    {...props}
  />
);

// ─── SELECT 
export const Select = ({ children, style = {}, ...props }) => (
  <select
    style={{
      width: '100%',
      height: '44px',
      padding: '0 14px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--input-border)',
      backgroundColor: 'var(--surface)',
      color: 'var(--text-primary)',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: 'Inter, sans-serif',
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      paddingRight: '40px',
      ...style,
    }}
    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
    onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
    {...props}
  >
    {children}
  </select>
);

// ─── TEXTAREA 
export const Textarea = ({ style = {}, ...props }) => (
  <textarea
    style={{
      width: '100%',
      minHeight: '96px',
      padding: '10px 14px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--input-border)',
      backgroundColor: 'var(--surface)',
      color: 'var(--text-primary)',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: 'Inter, sans-serif',
      resize: 'vertical',
      ...style,
    }}
    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
    onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
    {...props}
  />
);

// ─── FIELD 
export const Field = ({ label, hint, children, style = {} }) => (
  <div style={{ marginBottom: '16px', ...style }}>
    <label style={{
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: 'var(--text-primary)',
      marginBottom: '6px',
    }}>
      {label}
    </label>
    {children}
    {hint && (
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
        {hint}
      </p>
    )}
  </div>
);

// ─── ALERT 
export const Alert = ({ children, type = 'error', style = {} }) => {
  const types = {
    error:   { backgroundColor: 'var(--error-bg)',   color: 'var(--error)',   border: '1px solid rgba(229,62,62,0.2)' },
    success: { backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(45,106,79,0.2)' },
    info:    { backgroundColor: 'var(--info-bg)',    color: 'var(--info)',    border: '1px solid rgba(43,108,176,0.2)' },
  };

  return (
    <div style={{
      padding: '10px 14px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '14px',
      lineHeight: '1.5',
      ...types[type],
      ...style,
    }}>
      {children}
    </div>
  );
};

// ─── MODAL 
export const Modal = ({ children, onClose, title, maxWidth = '480px' }) => (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  }}>
    <div style={{
      backgroundColor: 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      width: '100%',
      maxWidth,
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>
          {title}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: '#eef1f6',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: '13px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Close
          </button>
        )}
      </div>
      {children}
    </div>
  </div>
);

// ─── NAVBAR 
export const Navbar = ({ userName, onLogout }) => (
  <nav style={{
    backgroundColor: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: 'var(--shadow-sm)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        backgroundColor: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: '800',
        fontSize: '14px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        CC
      </div>
      <span style={{
        fontSize: '16px',
        fontWeight: '700',
        color: 'var(--primary)',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        CampusConnect
      </span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        {userName}
      </span>
      <Button variant="outline" size="sm" onClick={onLogout}>
        Logout
      </Button>
    </div>
  </nav>
);

// ─── PAGE WRAPPER 
export const PageWrapper = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: 'var(--background)',
  }}>
    {children}
  </div>
);

// ─── PAGE CONTENT 
export const PageContent = ({ children }) => (
  <div style={{
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '32px 24px',
  }}>
    {children}
  </div>
);

// ─── PAGE HEADER ─
export const PageHeader = ({ title, action, backTo, onBack }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '28px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            fontSize: '13px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Back
        </button>
      )}
      <h1 style={{
        fontSize: '22px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        {title}
      </h1>
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── SWITCH 
export const Switch = ({ checked, onChange, label, id }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        height: '24px',
        width: '44px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: checked ? 'var(--primary)' : '#cbd5e0',
        transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        display: 'inline-block',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transform: checked ? 'translateX(22px)' : 'translateX(2px)',
        transition: 'transform 0.2s',
        marginTop: '2px',
      }} />
    </button>
    {label && (
      <label
        htmlFor={id}
        style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}
      >
        {label}
      </label>
    )}
  </div>
);

// ─── EMPTY STATE ─
export const EmptyState = ({ title, description, action }) => (
  <div style={{
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  }}>
    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
      {title}
    </h3>
    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: action ? '20px' : '0' }}>
      {description}
    </p>
    {action && action}
  </div>
);

// ─── TABS 
export const Tabs = ({ tabs, active, onChange }) => (
  <div style={{
    display: 'flex',
    gap: '4px',
    backgroundColor: '#eef1f6',
    padding: '4px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '24px',
    width: 'fit-content',
  }}>
    {tabs.map(tab => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        style={{
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.15s',
          backgroundColor: active === tab.value ? 'var(--surface)' : 'transparent',
          color: active === tab.value ? 'var(--primary)' : 'var(--text-secondary)',
          boxShadow: active === tab.value ? 'var(--shadow-sm)' : 'none',
          fontWeight: active === tab.value ? '600' : '500',
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
);