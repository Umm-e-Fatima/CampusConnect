import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const features = [
  {
    key: 'resources',
    path: '/resources',
    num: '01',
    title: 'Resource Hub',
    description: 'Notes & past papers by course code',
    cta: 'Explore',
    variant: 'b1',
  },
  {
    key: 'books',
    path: '/books',
    num: '02',
    title: 'Book Exchange',
    description: 'Borrow, gift or buy with a PIN handoff',
    cta: 'Browse',
    variant: 'b2',
  },
  {
    key: 'qna',
    path: '/qna',
    num: '03',
    title: 'Anonymous Q&A',
    description: 'Ask questions, identity hidden',
    cta: 'Ask',
    variant: 'b3',
  },
  {
    key: 'resource-requests',
    path: '/resource-requests',
    num: '04',
    title: 'My Requests',
    description: 'Track purchases & confirm payments',
    cta: 'View',
    variant: 'b4',
  },
];

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    resources_shared: 0,
    active_listings: 0,
    questions_answered: 0,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    api.get('/stats')
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    navigate('/login');
  };

  const firstName = user?.full_name?.split(' ')[0] || '';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@400;600;700&display=swap');
        :root {
          --cream: #FBF3E5; --card: #FFFDF8; --line: #E9DCC3;
          --teal: #1D6F68; --teal-d: #134F4A; --orange: #E2903C; --orange-d: #C97324;
          --ink: #3A3630; --inks: #8A8172;
          --rose: #B85C74; --rose-d: #96475D; --olive: #6E8353; --olive-d: #556842;
        }
        * { box-sizing: border-box; }
        .hm-page { margin: 0; background: var(--cream); color: var(--ink); font-family: 'Nunito', sans-serif; min-height: 100vh; }
        .hm-wrap { max-width: 1080px; margin: 0 auto; padding: 0 32px 64px; }
        .hm-nav { display: flex; align-items: center; justify-content: space-between; padding: 22px 0; margin-bottom: 8px; }
        .hm-brand { display: flex; align-items: center; gap: 10px; }
        .hm-brand-mark { width: 36px; height: 36px; border-radius: 11px; background: var(--teal); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; }
        .hm-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 17px; color: var(--teal-d); }
        .hm-nav-right { display: flex; align-items: center; gap: 16px; }
        .hm-status { display: flex; align-items: center; gap: 6px; font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: var(--teal-d); background: #E7F0EA; padding: 6px 12px; border-radius: 20px; }
        .hm-status.offline { color: var(--rose-d); background: #F5E6EA; }
        .hm-status-dot { width: 6px; height: 6px; background: var(--teal); border-radius: 50%; }
        .hm-status.offline .hm-status-dot { background: var(--rose); }
        .hm-user-name { font-size: 13px; color: var(--inks); }
        .hm-logout-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; background: none; border: 1px solid var(--line); color: var(--ink); padding: 8px 16px; border-radius: 999px; cursor: pointer; transition: background 0.15s; }
        .hm-logout-btn:hover { background: var(--card); }

        .hm-welcome { padding: 8px 4px 30px; }
        .hm-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 30px; color: var(--teal-d); margin: 0 0 6px; }
        .hm-subhead { color: var(--inks); font-size: 14.5px; margin: 0; }

        .hm-table-surface {
          position: relative; border-radius: 28px; padding: 56px 40px 64px;
          background:
            radial-gradient(ellipse 500px 200px at 20% 20%, rgba(255,255,255,.10), transparent 60%),
            radial-gradient(ellipse 300px 150px at 80% 75%, rgba(0,0,0,.06), transparent 60%),
            repeating-linear-gradient(90deg, rgba(70,45,20,.05) 0px, rgba(70,45,20,.05) 1px, transparent 1px, transparent 34px),
            linear-gradient(180deg, #C7986A 0%, #B8875A 45%, #A9764C 100%);
          box-shadow: inset 0 3px 14px rgba(60,30,10,.25), 0 14px 30px rgba(60,30,10,.14);
        }
        .hm-table-surface::before {
          content: ""; position: absolute; inset: 0; border-radius: 28px;
          background: repeating-linear-gradient(90deg, transparent 0 90px, rgba(255,255,255,.035) 90px 91px, transparent 91px 180px);
          pointer-events: none;
        }
        .hm-books-row { display: flex; justify-content: center; align-items: flex-end; gap: 0; position: relative; flex-wrap: wrap; }
        .hm-book {
          width: 220px; height: 170px; border-radius: 6px 14px 14px 6px;
          position: relative; margin: 0 -14px; padding: 24px 20px;
          display: flex; flex-direction: column; justify-content: space-between;
          box-shadow: 0 16px 22px rgba(50,25,8,.28), 0 2px 0 rgba(255,255,255,.15) inset;
          cursor: pointer; transition: transform .15s ease; color: #fff; border: none; text-align: left; font-family: inherit;
        }
        .hm-book:hover { transform: translateY(-10px) rotate(0deg) !important; }
        .hm-book::before {
          content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 16px;
          background: rgba(0,0,0,.18); border-radius: 6px 0 0 6px;
        }
        .hm-book::after {
          content: ""; position: absolute; right: -4px; top: 6px; bottom: 6px; width: 8px;
          background: repeating-linear-gradient(180deg,#FBF3E5 0 2px, #EFE3CC 2px 4px);
          border-radius: 0 4px 4px 0;
        }
        .hm-book .hm-num { font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 700; opacity: .85; letter-spacing: .05em; }
        .hm-book h3 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 16.5px; margin: 0; line-height: 1.25; }
        .hm-book p { font-family: 'Nunito', sans-serif; font-size: 11.5px; margin: 0; opacity: .9; line-height: 1.5; }
        .hm-book .hm-go { font-family: 'Poppins', sans-serif; font-size: 11.5px; font-weight: 700; color: #fff; opacity: .95; }

        .hm-b1 { background: linear-gradient(160deg,var(--teal),var(--teal-d)); transform: rotate(-4deg) translateY(6px); z-index: 1; }
        .hm-b2 { background: linear-gradient(160deg,var(--orange),var(--orange-d)); transform: rotate(2deg) translateY(-8px); z-index: 2; }
        .hm-b3 { background: linear-gradient(160deg,var(--rose),var(--rose-d)); transform: rotate(-2deg) translateY(2px); z-index: 3; }
        .hm-b4 { background: linear-gradient(160deg,var(--olive),var(--olive-d)); transform: rotate(4deg) translateY(-4px); z-index: 4; }

        .hm-stats { display: flex; justify-content: center; gap: 40px; margin-top: 52px; padding-top: 6px; flex-wrap: wrap; }
        .hm-pocket {
          position: relative; width: 150px; height: 100px;
          background: linear-gradient(160deg,#D9BD8C,#C7A26A);
          border-radius: 4px 4px 10px 10px;
          box-shadow: 0 10px 16px rgba(90,60,20,.18);
        }
        .hm-pocket::before {
          content: ""; position: absolute; top: 0; left: 12px; right: 12px; height: 8px;
          background: linear-gradient(180deg, rgba(0,0,0,.28), transparent);
          border-radius: 0 0 6px 6px;
        }
        .hm-card-insert {
          position: absolute; left: 50%; top: -22px; width: 118px;
          background: var(--card); border: 1px solid var(--line); border-radius: 3px;
          padding: 12px 10px 10px; box-shadow: 0 6px 10px rgba(60,40,10,.16);
          text-align: center;
        }
        .hm-stat:nth-child(1) .hm-card-insert { transform: translateX(-50%) rotate(-3deg); }
        .hm-stat:nth-child(2) .hm-card-insert { transform: translateX(-50%) rotate(2deg); }
        .hm-stat:nth-child(3) .hm-card-insert { transform: translateX(-50%) rotate(-1.5deg); }
        .hm-card-insert .hm-stamp { border-bottom: 1px dashed var(--line); padding-bottom: 5px; margin-bottom: 6px; height: 4px; }
        .hm-card-insert .hm-stat-num { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 22px; color: var(--teal-d); line-height: 1; margin-bottom: 3px; }
        .hm-card-insert .hm-stat-label { font-size: 10px; color: var(--inks); }
        .hm-stat { position: relative; }
      `}</style>

      <div className="hm-page">
        <div className="hm-wrap">

          {/* Navbar */}
          <nav className="hm-nav">
            <div className="hm-brand">
              <div className="hm-brand-mark">CC</div>
              <div className="hm-brand-name">CampusConnect</div>
            </div>
            <div className="hm-nav-right">
              <div className={`hm-status${isOnline ? '' : ' offline'}`}>
                <span className="hm-status-dot"></span>
                {isOnline ? 'offline ready' : 'offline mode'}
              </div>
              <div className="hm-user-name">{user?.full_name}</div>
              <button className="hm-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>

          {/* Welcome */}
          <div className="hm-welcome">
            <h1 className="hm-h1">Welcome back, {firstName}</h1>
            <p className="hm-subhead">Here is what's happening in your campus community today.</p>
          </div>

          {/* Table with books */}
          <div className="hm-table-surface">
            <div className="hm-books-row">
              {features.map((f) => (
                <button
                  key={f.key}
                  className={`hm-book hm-${f.variant}`}
                  onClick={() => navigate(f.path)}
                >
                  <div className="hm-num">{f.num}</div>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.description}</p>
                  </div>
                  <span className="hm-go">{f.cta} →</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="hm-stats">
            <div className="hm-stat">
              <div className="hm-pocket"></div>
              <div className="hm-card-insert">
                <div className="hm-stamp"></div>
                <div className="hm-stat-num">{stats.resources_shared}</div>
                <div className="hm-stat-label">resources shared</div>
              </div>
            </div>
            <div className="hm-stat">
              <div className="hm-pocket"></div>
              <div className="hm-card-insert">
                <div className="hm-stamp"></div>
                <div className="hm-stat-num">{stats.active_listings}</div>
                <div className="hm-stat-label">active listings</div>
              </div>
            </div>
            <div className="hm-stat">
              <div className="hm-pocket"></div>
              <div className="hm-card-insert">
                <div className="hm-stamp"></div>
                <div className="hm-stat-num">{stats.questions_answered}</div>
                <div className="hm-stat-label">questions answered</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Home;