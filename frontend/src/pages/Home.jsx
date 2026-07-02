import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Even if API call fails, clear local state
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.logo}>روشنی Roshni</h1>
          <p style={styles.welcome}>Welcome, {user?.full_name}</p>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Feature Cards */}
      <div style={styles.grid}>

        <div style={styles.card} onClick={() => navigate('/resources')}>
          <h2 style={styles.cardTitle}>Resource Hub</h2>
          <p style={styles.cardText}>
            Browse and share notes and past papers tagged by course code
          </p>
          <span style={styles.cardLink}>Browse Resources</span>
        </div>

        <div style={styles.card} onClick={() => navigate('/books')}>
          <h2 style={styles.cardTitle}>Book Exchange</h2>
          <p style={styles.cardText}>
            Buy, borrow or gift books with secure PIN-based campus handoff
          </p>
          <span style={styles.cardLink}>Browse Books</span>
        </div>

        <div style={styles.card} onClick={() => navigate('/qna')}>
          <h2 style={styles.cardTitle}>Anonymous Q&A</h2>
          <p style={styles.cardText}>
            Ask and answer questions anonymously, tagged by course code
          </p>
          <span style={styles.cardLink}>Browse Questions</span>
        </div>

        <div style={styles.card} onClick={() => navigate('/resource-requests')}>
          <h2 style={styles.cardTitle}>My Requests</h2>
          <p style={styles.cardText}>
            Track your paid resource purchases and confirm payments as a seller
          </p>
          <span style={styles.cardLink}>View Requests</span>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: '16px 24px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    marginBottom: '32px',
  },
  logo: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#2d6a4f',
    marginBottom: '4px',
  },
  welcome: {
    fontSize: '14px',
    color: '#888',
  },
  logoutBtn: {
    padding: '8px 20px',
    backgroundColor: '#fff',
    color: '#c0392b',
    border: '1px solid #c0392b',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '32px 24px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2d6a4f',
    marginBottom: '12px',
  },
  cardText: {
    fontSize: '14px',
    color: '#888',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  cardLink: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d6a4f',
    borderBottom: '2px solid #2d6a4f',
    paddingBottom: '2px',
  },
};

export default Home;