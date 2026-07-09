import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Navbar, PageWrapper, PageContent,
  Card, StatCard, Button,
} from '../components/UI';

const features = [
  {
    key: 'resources',
    path: '/resources',
    title: 'Resource Hub',
    description: 'Browse and share notes, past papers tagged by course code',
    cta: 'Explore resources',
    accent: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    key: 'books',
    path: '/books',
    title: 'Book Exchange',
    description: 'Buy, borrow or gift textbooks with secure campus PIN handoff',
    cta: 'Browse books',
    accent: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    key: 'qna',
    path: '/qna',
    title: 'Anonymous Q&A',
    description: 'Ask questions and get answers anonymously, tagged by course code',
    cta: 'Ask a question',
    accent: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    key: 'resource-requests',
    path: '/resource-requests',
    title: 'My Requests',
    description: 'Track your paid resource purchases and confirm payments as a seller',
    cta: 'View requests',
    accent: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
];

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    navigate('/login');
  };

  return (
    <PageWrapper>
      <Navbar
        userName={user?.full_name}
        onLogout={handleLogout}
        showPWA={true}
      />

      <PageContent>

        {/* Welcome */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={styles.welcome}>
            Welcome back, {user?.full_name?.split(' ')[0]}
          </h1>
          <p style={styles.welcomeSub}>
            Here is what is happening in your campus community today.
          </p>
        </div>

        {/* Feature cards */}
        <div style={styles.grid}>
          {features.map(f => (
            <Card
              key={f.key}
              onClick={() => navigate(f.path)}
              hoverable
              style={{ cursor: 'pointer' }}
            >
              <div style={{
                width: '40px', height: '40px',
                background: f.accent ? 'var(--accent-light)' : 'var(--primary-light)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: '14px',
              }}>
                {f.icon}
              </div>
              <h3 style={styles.cardTitle}>{f.title}</h3>
              <p style={styles.cardDesc}>{f.description}</p>
              <span style={{
                fontSize: '12px', fontWeight: '500',
                color: f.accent ? 'var(--accent)' : 'var(--primary)',
              }}>
                {f.cta} →
              </span>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <StatCard value="142" label="Resources shared" />
          <StatCard value="38"  label="Active listings" />
          <StatCard value="265" label="Questions answered" />
        </div>

      </PageContent>
    </PageWrapper>
  );
};

const styles = {
  welcome: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  welcomeSub: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  cardDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '14px',
    lineHeight: '1.55',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '14px',
  },
};

export default Home;