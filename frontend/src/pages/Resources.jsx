import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import UploadResourceForm from '../components/UploadResourceForm';

const PAGE_SIZE = 6;

const Resources = () => {
  const [resources, setResources]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [filterCode, setFilterCode]   = useState('');
  const [filterType, setFilterType]   = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showUpload, setShowUpload]   = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [requestForm, setRequestForm] = useState(null);
  const [borrowDays, setBorrowDays]   = useState('');
  const [requestMsg, setRequestMsg]   = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [viewMode, setViewMode]       = useState('drawer'); // 'drawer' | 'list'
  const [page, setPage]               = useState(1);
  const [isOnline, setIsOnline]       = useState(navigator.onLine);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    navigate('/login');
  };

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

  useEffect(() => {
    api.get('/resources/distinct-courses')
      .then(res => setSuggestions(res.data))
      .catch(() => {});
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCode.trim()) params.course_code = filterCode.trim().toUpperCase();
      if (filterType) params.type = filterType;
      const res = await api.get('/resources', { params });
      setResources(res.data);
      setPage(1);
    } catch (err) {
      setError('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, [filterCode, filterType]); // eslint-disable-line

  const handleDelete = async () => {
    try {
      await api.delete(`/resources/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete resource');
      setDeleteConfirmId(null);
    }
  };

  const handleRequest = (resource) => {
    setRequestForm(resource);
    setRequestMsg('');
    setPaymentInfo(null);
    setBorrowDays('');
  };

  const submitRequest = async () => {
    try {
      const body = { delivery_mode: 'online' };
      if (requestForm.listing_type === 'borrow') {
        if (!borrowDays || borrowDays < 1 || borrowDays > 15) {
          setRequestMsg('Enter borrow duration between 1 and 15 days');
          return;
        }
        body.borrow_days = parseInt(borrowDays);
      }
      const res = await api.post(`/resource-requests/${requestForm.id}`, body);
      setPaymentInfo(res.data.payment_info || null);
      setRequestMsg(
        `Request created. PIN: ${res.data.pin} | Request ID: ${res.data.request_id} | ${res.data.total_price}`
      );
    } catch (err) {
      setRequestMsg(err.response?.data?.error || 'Request failed');
    }
  };

  const typeLabel = (t) => {
    if (t === 'past_paper') return 'Past Paper';
    if (t === 'notes') return 'Notes';
    return 'Other';
  };

  const listingTag = (r) => {
    if (r.listing_type === 'gift') return { text: 'Gift — Free', free: true };
    if (r.listing_type === 'borrow') return { text: `Borrow · Rs.${r.price}/day`, free: false };
    return { text: `Buy · Rs.${r.price}`, free: false };
  };

  const totalPages = Math.max(1, Math.ceil(resources.length / PAGE_SIZE));
  const pagedResources = resources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@400;600;700&display=swap');
        :root {
          --cream: #FBF3E5; --card: #FFFDF8; --line: #E9DCC3;
          --teal: #1D6F68; --teal-d: #134F4A; --orange: #E2903C; --orange-d: #C97324;
          --ink: #3A3630; --inks: #8A8172; --rose: #B85C74; --rose-d: #96475D;
        }
        * { box-sizing: border-box; }
        .rs-page { margin: 0; background: var(--cream); color: var(--ink); font-family: 'Nunito', sans-serif; min-height: 100vh; }
        .rs-wrap { max-width: 1080px; margin: 0 auto; padding: 0 32px 64px; }
        .rs-nav { display: flex; align-items: center; justify-content: space-between; padding: 22px 0; margin-bottom: 26px; }
        .rs-brand { display: flex; align-items: center; gap: 10px; }
        .rs-brand-mark { width: 36px; height: 36px; border-radius: 11px; background: var(--teal); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; }
        .rs-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 17px; color: var(--teal-d); }
        .rs-nav-right { display: flex; align-items: center; gap: 16px; }
        .rs-status { display: flex; align-items: center; gap: 6px; font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: var(--teal-d); background: #E7F0EA; padding: 6px 12px; border-radius: 20px; }
        .rs-status.offline { color: var(--rose-d); background: #F5E6EA; }
        .rs-status-dot { width: 6px; height: 6px; background: var(--teal); border-radius: 50%; }
        .rs-status.offline .rs-status-dot { background: var(--rose); }
        .rs-user-name { font-size: 13px; color: var(--inks); }
        .rs-logout-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; background: none; border: 1px solid var(--line); color: var(--ink); padding: 8px 16px; border-radius: 999px; cursor: pointer; transition: background 0.15s; }
        .rs-logout-btn:hover { background: var(--card); }

        .rs-page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
        .rs-page-head-left { display: flex; align-items: center; gap: 14px; }
        .rs-back-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; color: var(--inks); background: none; border: 1px solid var(--line); padding: 8px 14px; border-radius: 999px; cursor: pointer; transition: background 0.15s; }
        .rs-back-btn:hover { background: var(--card); }
        .rs-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 22px; color: var(--teal-d); margin: 0; }
        .rs-btn-primary { background: var(--orange); color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13px; padding: 11px 20px; border-radius: 999px; border: none; cursor: pointer; box-shadow: 0 6px 14px rgba(226,144,60,.3); transition: background 0.15s; }
        .rs-btn-primary:hover { background: var(--orange-d); }

        .rs-filter-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .rs-filter-row input, .rs-filter-row select { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 11px 16px; color: var(--ink); font-size: 13px; font-family: 'Nunito', sans-serif; }
        .rs-filter-row input:focus, .rs-filter-row select:focus { outline: none; border-color: var(--teal); }
        .rs-filter-row input { flex-grow: 1; min-width: 200px; }
        .rs-clear-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; color: var(--inks); background: none; border: 1px solid var(--line); padding: 11px 16px; border-radius: 14px; cursor: pointer; }

        .rs-controls-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
        .rs-footer-note { font-size: 12px; color: var(--inks); }
        .rs-footer-note b { color: var(--ink); }
        .rs-view-toggle { display: flex; gap: 6px; background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 3px; }
        .rs-view-toggle button { font-family: 'Poppins', sans-serif; font-size: 11.5px; font-weight: 600; border: none; background: none; color: var(--inks); padding: 7px 14px; border-radius: 999px; cursor: pointer; }
        .rs-view-toggle button.active { background: var(--teal); color: #fff; }

        .rs-error { background: #F5E6EA; color: var(--rose-d); border: 1px solid rgba(150,71,93,0.2); border-radius: 10px; padding: 10px 14px; font-size: 12.5px; margin-bottom: 16px; }

        .rs-empty { text-align: center; padding: 48px 24px; color: var(--inks); }
        .rs-empty h3 { font-family: 'Poppins', sans-serif; color: var(--teal-d); font-size: 15px; margin-bottom: 6px; }
        .rs-empty p { font-size: 13px; margin-bottom: 16px; }

        /* Drawer view */
        .rs-drawer { border-radius: 14px 14px 6px 6px; position: relative; background: linear-gradient(180deg,#A9764C,#8C6A3F); box-shadow: 0 16px 30px rgba(60,30,10,.2); padding: 34px 30px 20px; }
        .rs-drawer-rail { position: absolute; left: 26px; right: 26px; top: 48px; height: 3px; background: linear-gradient(90deg,#D8C9A8,#B8A57E,#D8C9A8); border-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
        .rs-cards-row { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 16px; align-items: flex-start; flex-wrap: wrap; justify-content: center; }
        .rs-idx-card { flex-shrink: 0; width: 168px; min-height: 200px; background: var(--card); border-radius: 3px; padding: 20px 14px 14px; position: relative; box-shadow: 0 10px 18px rgba(50,25,8,.22); display: flex; flex-direction: column; justify-content: space-between; }
        .rs-idx-card .rs-rod-hole { position: absolute; top: -9px; left: 50%; transform: translateX(-50%); width: 16px; height: 16px; border-radius: 50%; background: #8C6A3F; box-shadow: inset 0 2px 3px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.15); }
        .rs-idx-card .rs-course-tab { font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 700; color: #fff; background: var(--teal); padding: 3px 9px; border-radius: 5px; width: fit-content; letter-spacing: .02em; }
        .rs-idx-card.rs-type-paper .rs-course-tab { background: var(--rose-d); }
        .rs-idx-card h4 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; color: var(--ink); margin: 10px 0 4px; line-height: 1.25; }
        .rs-idx-card .rs-meta { font-size: 10.5px; color: var(--inks); line-height: 1.5; margin-bottom: 10px; }
        .rs-idx-card .rs-tag { font-family: 'Poppins', sans-serif; font-size: 9.5px; font-weight: 700; color: var(--orange-d); background: #FBEAD5; padding: 3px 8px; border-radius: 999px; width: fit-content; margin-bottom: 10px; }
        .rs-idx-card .rs-tag.free { color: var(--teal-d); background: #E1EEE9; }
        .rs-req-btn { font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 700; background: var(--orange); color: #fff; border: none; padding: 8px 0; border-radius: 999px; cursor: pointer; text-align: center; box-shadow: 0 5px 10px rgba(226,144,60,.28); text-decoration: none; display: block; }
        .rs-req-btn:hover { background: var(--orange-d); }
        .rs-remove-link { font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 700; color: var(--rose-d); background: none; border: none; cursor: pointer; padding: 6px 0 0; text-align: center; }

        .rs-drawer-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding: 0 4px; flex-wrap: wrap; gap: 10px; }
        .rs-pager { display: flex; align-items: center; gap: 10px; }
        .rs-pager button { font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 600; background: var(--card); border: 1px solid var(--line); color: var(--ink); padding: 8px 16px; border-radius: 999px; cursor: pointer; }
        .rs-pager button:disabled { opacity: .4; cursor: default; }
        .rs-pager .rs-page-label { font-family: 'Poppins', sans-serif; font-size: 12px; color: var(--inks); }

        /* List view */
        .rs-list-item { background: var(--card); border: 1px solid var(--line); border-radius: 18px 6px 18px 6px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; gap: 14px; flex-wrap: wrap; }
        .rs-li-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .rs-course-chip { font-family: 'Poppins', sans-serif; font-size: 10.5px; font-weight: 700; color: #fff; background: var(--teal); padding: 6px 10px; border-radius: 6px; flex-shrink: 0; min-width: 58px; text-align: center; }
        .rs-course-chip.paper { background: var(--rose-d); }
        .rs-li-text h4 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14.5px; margin: 0 0 4px; }
        .rs-li-text .rs-meta { font-size: 12px; color: var(--inks); }
        .rs-li-tags { display: flex; gap: 6px; margin-top: 5px; flex-wrap: wrap; }
        .rs-li-tag { font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 999px; }
        .rs-li-tag.orange { background: #FBEAD5; color: var(--orange-d); }
        .rs-li-tag.free { background: #E1EEE9; color: var(--teal-d); }
        .rs-li-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .rs-btn-outline { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 700; background: var(--orange); color: #fff; padding: 10px 20px; border-radius: 999px; border: none; cursor: pointer; box-shadow: 0 5px 12px rgba(226,144,60,.28); text-decoration: none; display: inline-block; }
        .rs-btn-outline:hover { background: var(--orange-d); }

        /* Modals (shared by delete + request) */
        .rs-overlay { position: fixed; inset: 0; background: rgba(58,54,48,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .rs-modal { width: 440px; max-width: 100%; background: var(--card); border: 1px solid var(--line); border-radius: 32px 12px 32px 12px; padding: 30px; box-shadow: 0 24px 50px rgba(40,25,10,.3); }
        .rs-modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .rs-modal-head h2 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 19px; color: var(--teal-d); margin: 0; }
        .rs-close-btn { background: none; border: none; color: var(--inks); font-size: 13px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600; }
        .rs-modal p.rs-body { font-size: 13px; color: var(--inks); line-height: 1.6; margin: 10px 0 22px; }
        .rs-modal-btn-row { display: flex; gap: 10px; }
        .rs-btn-danger { background: var(--rose-d); color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13px; padding: 12px 0; border-radius: 999px; border: none; cursor: pointer; flex: 1; }
        .rs-btn-ghost { background: none; color: var(--ink); font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13px; padding: 12px 0; border-radius: 999px; border: 1px solid var(--line); cursor: pointer; flex: 1; }
        .rs-req-info { padding: 14px; background: var(--cream); border-radius: 12px; margin-bottom: 16px; }
        .rs-req-info .rs-req-title { font-size: 14px; font-weight: 700; color: var(--ink); font-family: 'Poppins', sans-serif; }
        .rs-req-info .rs-req-sub { font-size: 13px; color: var(--inks); margin-top: 2px; }
        .rs-field-label { display: block; font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 600; color: var(--ink); margin: 14px 0 7px; }
        .rs-field-hint { font-size: 11px; color: var(--inks); margin-top: 6px; }
        .rs-modal input { width: 100%; background: var(--cream); border: 1px solid var(--line); border-radius: 14px; padding: 11px 16px; color: var(--ink); font-size: 13px; font-family: 'Nunito', sans-serif; }
        .rs-payment-note { padding: 12px 14px; background: #E7F0EA; border-radius: 12px; margin: 14px 0; }
        .rs-payment-note p { font-size: 12.5px; color: var(--teal-d); line-height: 1.6; margin: 0; }
        .rs-payment-box { padding: 14px 16px; background: var(--teal); border-radius: 14px; margin: 14px 0; }
        .rs-payment-box .rs-payment-label { font-size: 11px; color: rgba(255,255,255,.75); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .04em; font-family: 'Poppins', sans-serif; font-weight: 600; }
        .rs-payment-box .rs-payment-value { font-size: 14.5px; color: #fff; font-weight: 700; font-family: 'Poppins', sans-serif; }
        .rs-alert { border-radius: 10px; padding: 10px 14px; font-size: 12.5px; margin-bottom: 14px; }
        .rs-alert.success { background: #E1EEE9; color: var(--teal-d); }
        .rs-alert.error { background: #F5E6EA; color: var(--rose-d); }
      `}</style>

      <div className="rs-page">
        <div className="rs-wrap">

          {/* Navbar */}
          <nav className="rs-nav">
            <div className="rs-brand">
              <div className="rs-brand-mark">CC</div>
              <div className="rs-brand-name">CampusConnect</div>
            </div>
            <div className="rs-nav-right">
              <div className={`rs-status${isOnline ? '' : ' offline'}`}>
                <span className="rs-status-dot"></span>
                {isOnline ? 'offline ready' : 'offline mode'}
              </div>
              <div className="rs-user-name">{user?.full_name}</div>
              <button className="rs-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>

          {/* Page head */}
          <div className="rs-page-head">
            <div className="rs-page-head-left">
              <button className="rs-back-btn" onClick={() => navigate('/home')}>Back</button>
              <h1 className="rs-h1">Resource Hub</h1>
            </div>
            <button className="rs-btn-primary" onClick={() => setShowUpload(true)}>
              Upload Resource
            </button>
          </div>

          {/* Filters */}
          <div className="rs-filter-row">
            <input
              placeholder="Filter by course code e.g. CS-301"
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              list="rs-course-suggestions"
            />
            <datalist id="rs-course-suggestions">
              {suggestions.map((c) => <option key={c} value={c} />)}
            </datalist>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="notes">Notes</option>
              <option value="past_paper">Past Papers</option>
              <option value="other">Other</option>
            </select>
            {filterCode && (
              <button className="rs-clear-btn" onClick={() => setFilterCode('')}>Clear</button>
            )}
          </div>

          {error && <div className="rs-error">{error}</div>}

          {/* Controls row */}
          <div className="rs-controls-row">
            <div className="rs-footer-note">
              {loading
                ? 'Loading...'
                : viewMode === 'drawer'
                  ? <>Showing <b>{pagedResources.length}</b> of <b>{resources.length}</b> resources</>
                  : <>Showing <b>{resources.length}</b> result{resources.length !== 1 ? 's' : ''}{filterCode ? <> for <b>{filterCode.toUpperCase()}</b></> : ''}</>
              }
            </div>
            <div className="rs-view-toggle">
              <button className={viewMode === 'drawer' ? 'active' : ''} onClick={() => setViewMode('drawer')}>🗃 Drawer view</button>
              <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>☰ List view</button>
            </div>
          </div>

          {!loading && resources.length === 0 && (
            <div className="rs-empty">
              <h3>No resources found</h3>
              <p>Be the first to upload notes or past papers for this course</p>
              <button className="rs-btn-primary" onClick={() => setShowUpload(true)}>Upload Resource</button>
            </div>
          )}

          {/* Drawer view */}
          {!loading && resources.length > 0 && viewMode === 'drawer' && (
            <>
              <div className="rs-drawer">
                <div className="rs-drawer-rail"></div>
                <div className="rs-cards-row">
                  {pagedResources.map((r) => {
                    const tag = listingTag(r);
                    const isPaper = r.resource_type === 'past_paper';
                    return (
                      <div key={r.id} className={`rs-idx-card${isPaper ? ' rs-type-paper' : ''}`}>
                        <div className="rs-rod-hole"></div>
                        <div className="rs-course-tab">{r.course_code}</div>
                        <h4>{r.title}</h4>
                        <div className={`rs-tag${tag.free ? ' free' : ''}`}>{tag.text}</div>
                        <div className="rs-meta">
                          {typeLabel(r.resource_type)}{r.semester ? ` · Semester ${r.semester}` : ''}<br />
                          {r.uploader_name} · {r.download_count} downloads
                        </div>
                        {r.listing_type === 'gift' ? (
                          <a className="rs-req-btn" href={r.file_url} target="_blank" rel="noopener noreferrer">Download</a>
                        ) : (
                          <button className="rs-req-btn" onClick={() => handleRequest(r)}>Request Access</button>
                        )}
                        {r.uploaded_by === user?.id && (
                          <button className="rs-remove-link" onClick={() => setDeleteConfirmId(r.id)}>Remove</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rs-drawer-footer">
                <div className="rs-footer-note">
                  Drawer <b>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, resources.length)}</b> of <b>{resources.length}</b>
                </div>
                <div className="rs-pager">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                  <span className="rs-page-label">Page {page} of {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
              </div>
            </>
          )}

          {/* List view */}
          {!loading && resources.length > 0 && viewMode === 'list' && (
            <div>
              {resources.map((r) => {
                const tag = listingTag(r);
                const isPaper = r.resource_type === 'past_paper';
                return (
                  <div key={r.id} className="rs-list-item">
                    <div className="rs-li-left">
                      <div className={`rs-course-chip${isPaper ? ' paper' : ''}`}>{r.course_code}</div>
                      <div className="rs-li-text">
                        <h4>{r.title}</h4>
                        <div className="rs-meta">
                          {typeLabel(r.resource_type)}{r.semester ? ` · Semester ${r.semester}` : ''} · {r.uploader_name} · {r.download_count} downloads
                        </div>
                        <div className="rs-li-tags">
                          <span className={`rs-li-tag${tag.free ? ' free' : ' orange'}`}>{tag.text}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rs-li-actions">
                      {r.listing_type === 'gift' ? (
                        <a className="rs-btn-outline" href={r.file_url} target="_blank" rel="noopener noreferrer">Download</a>
                      ) : (
                        <button className="rs-btn-outline" onClick={() => handleRequest(r)}>Request Access</button>
                      )}
                      {r.uploaded_by === user?.id && (
                        <button className="rs-remove-link" onClick={() => setDeleteConfirmId(r.id)}>Remove</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadResourceForm
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); fetchResources(); }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="rs-overlay">
          <div className="rs-modal">
            <div className="rs-modal-head">
              <h2>Remove Resource</h2>
              <button className="rs-close-btn" onClick={() => setDeleteConfirmId(null)}>Close</button>
            </div>
            <p className="rs-body">
              Are you sure you want to remove this resource? It will no longer be visible to other students.
            </p>
            <div className="rs-modal-btn-row">
              <button className="rs-btn-danger" onClick={handleDelete}>Yes, Remove</button>
              <button className="rs-btn-ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Request Access Modal */}
      {requestForm && (
        <div className="rs-overlay">
          <div className="rs-modal">
            <div className="rs-modal-head">
              <h2>Request Access</h2>
              <button className="rs-close-btn" onClick={() => setRequestForm(null)}>Close</button>
            </div>

            <div className="rs-req-info">
              <div className="rs-req-title">{requestForm.title}</div>
              <div className="rs-req-sub">
                {requestForm.course_code} ·{' '}
                {requestForm.listing_type === 'borrow'
                  ? `Rs. ${requestForm.price}/day`
                  : `Rs. ${requestForm.price} one-time`}
              </div>
            </div>

            {requestForm.listing_type === 'borrow' && !requestMsg && (
              <>
                <label className="rs-field-label">How many days? (max 15)</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  placeholder="e.g. 3"
                  value={borrowDays}
                  onChange={(e) => setBorrowDays(e.target.value)}
                />
                {borrowDays && requestForm.price && (
                  <div className="rs-field-hint">
                    Total: Rs. {(requestForm.price * borrowDays).toFixed(2)}
                  </div>
                )}
              </>
            )}

            {!requestMsg && (
              <div className="rs-payment-note">
                <p>Pay the seller directly via JazzCash or bank transfer, then show them your PIN to confirm.</p>
              </div>
            )}

            {requestMsg && (
              <div className={`rs-alert ${requestMsg.includes('failed') || requestMsg.includes('error') ? 'error' : 'success'}`}>
                {requestMsg}
              </div>
            )}

            {requestMsg && paymentInfo && (
              <div className="rs-payment-box">
                <div className="rs-payment-label">Pay the seller here</div>
                <div className="rs-payment-value">{paymentInfo}</div>
              </div>
            )}

            {!requestMsg ? (
              <button className="rs-btn-primary" style={{ width: '100%', padding: '14px' }} onClick={submitRequest}>
                Confirm Request
              </button>
            ) : !requestMsg.includes('failed') && (
              <button
                className="rs-btn-primary"
                style={{ width: '100%', padding: '14px' }}
                onClick={() => { setRequestForm(null); navigate('/resource-requests'); }}
              >
                View My Requests
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Resources;