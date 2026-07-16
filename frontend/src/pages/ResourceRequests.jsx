import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ResourceRequests = () => {
  const [activeTab, setActiveTab]           = useState('seller');
  const [sellerRequests, setSellerRequests] = useState([]);
  const [buyerRequests, setBuyerRequests]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [confirmData, setConfirmData]       = useState({ request_id: '', pin: '' });
  const [confirmMsg, setConfirmMsg]         = useState('');
  const [downloadInfo, setDownloadInfo]     = useState(null);
  const [isOnline, setIsOnline]             = useState(navigator.onLine);

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

  const fetchSellerRequests = async () => {
    try {
      const res = await api.get('/resource-requests/seller/pending');
      setSellerRequests(res.data);
    } catch (_) {}
  };

  const fetchBuyerRequests = async () => {
    try {
      const res = await api.get('/resource-requests/buyer/my-requests');
      setBuyerRequests(res.data);
    } catch (_) {}
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchSellerRequests(), fetchBuyerRequests()]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleConfirmPin = async () => {
    setConfirmMsg('');
    try {
      await api.post('/resource-requests/confirm-pin', confirmData);
      setConfirmMsg('Payment confirmed. Buyer can now download within 24 hours.');
      setConfirmData({ request_id: '', pin: '' });
      fetchSellerRequests();
    } catch (err) {
      setConfirmMsg(err.response?.data?.error || 'PIN confirmation failed');
    }
  };

  const handleDownload = async (requestId) => {
    setDownloadInfo(null);
    setError('');
    try {
      const res = await api.post(`/resource-requests/${requestId}/download`);
      setDownloadInfo(res.data);
      window.open(res.data.download_url, '_blank');
      fetchBuyerRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate download link');
    }
  };

  const getStatus = (r) => {
    if (!r.seller_confirmed)
      return { label: 'Awaiting confirmation', cls: 'gold' };
    if (new Date() > new Date(r.download_expires_at))
      return { label: 'Expired', cls: 'gray' };
    if (r.download_count >= 3)
      return { label: 'Download limit reached', cls: 'gray' };
    return { label: 'Ready to download', cls: 'green' };
  };

  const canDownload = (r) =>
    r.seller_confirmed &&
    new Date() <= new Date(r.download_expires_at) &&
    r.download_count < 3;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@400;600;700&display=swap');
        :root {
          --cream: #FBF3E5; --card: #FFFDF8; --line: #E9DCC3;
          --teal: #1D6F68; --teal-d: #134F4A; --orange: #E2903C; --orange-d: #C97324;
          --ink: #3A3630; --inks: #8A8172; --rose-d: #96475D;
        }
        * { box-sizing: border-box; }
        .rr-page { margin: 0; background: var(--cream); color: var(--ink); font-family: 'Nunito', sans-serif; min-height: 100vh; }
        .rr-wrap { max-width: 1040px; margin: 0 auto; padding: 0 32px 64px; }
        .rr-nav { display: flex; align-items: center; justify-content: space-between; padding: 22px 0; margin-bottom: 26px; }
        .rr-brand { display: flex; align-items: center; gap: 10px; }
        .rr-brand-mark { width: 36px; height: 36px; border-radius: 11px; background: var(--teal); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; }
        .rr-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 17px; color: var(--teal-d); }
        .rr-nav-right { display: flex; align-items: center; gap: 16px; }
        .rr-status { display: flex; align-items: center; gap: 6px; font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: var(--teal-d); background: #E7F0EA; padding: 6px 12px; border-radius: 20px; }
        .rr-status.offline { color: var(--rose-d); background: #F5E6EA; }
        .rr-status-dot { width: 6px; height: 6px; background: var(--teal); border-radius: 50%; }
        .rr-status.offline .rr-status-dot { background: var(--rose-d); }
        .rr-user-name { font-size: 13px; color: var(--inks); }
        .rr-logout-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; background: none; border: 1px solid var(--line); color: var(--ink); padding: 8px 16px; border-radius: 999px; cursor: pointer; transition: background 0.15s; }
        .rr-logout-btn:hover { background: var(--card); }

        .rr-page-head-left { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .rr-back-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; color: var(--inks); background: none; border: 1px solid var(--line); padding: 8px 14px; border-radius: 999px; cursor: pointer; transition: background 0.15s; }
        .rr-back-btn:hover { background: var(--card); }
        .rr-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 22px; color: var(--teal-d); margin: 0; }

        .rr-tabs { display: flex; gap: 8px; margin-bottom: 22px; }
        .rr-tab { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; padding: 9px 18px; border-radius: 999px; border: 1px solid var(--line); color: var(--inks); cursor: pointer; background: var(--card); }
        .rr-tab.active { background: var(--teal); color: #fff; border-color: var(--teal); }

        .rr-error { background: #F5E6EA; color: var(--rose-d); border: 1px solid rgba(150,71,93,0.2); border-radius: 10px; padding: 10px 14px; font-size: 12.5px; margin-bottom: 16px; }
        .rr-loading { color: var(--inks); text-align: center; padding: 48px 0; font-size: 13px; }

        .rr-card { background: var(--card); border: 1px solid var(--line); border-radius: 22px 8px 22px 8px; padding: 24px 26px; }
        .rr-confirm-card { margin-bottom: 26px; max-width: 520px; }
        .rr-section-title { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 15px; color: var(--teal-d); margin: 0 0 6px; }
        .rr-section-sub { font-size: 13px; color: var(--inks); margin: 0 0 20px; line-height: 1.6; }
        .rr-field-label { display: block; font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 600; color: var(--ink); margin: 0 0 7px; }
        .rr-card input { width: 100%; background: var(--cream); border: 1px solid var(--line); border-radius: 14px; padding: 12px 16px; color: var(--ink); font-size: 13px; margin-bottom: 16px; font-family: 'Nunito', sans-serif; }
        .rr-card input:focus { outline: none; border-color: var(--teal); }
        .rr-pin-input { text-align: center; letter-spacing: 8px; font-size: 20px; font-weight: 700; color: var(--teal-d); border-style: dashed; }
        .rr-btn-primary { width: 100%; background: var(--orange); color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13.5px; padding: 13px; border: none; border-radius: 999px; cursor: pointer; box-shadow: 0 6px 14px rgba(226,144,60,.3); transition: background 0.15s; }
        .rr-btn-primary:hover { background: var(--orange-d); }

        .rr-alert { border-radius: 10px; padding: 10px 14px; font-size: 12.5px; margin-bottom: 16px; }
        .rr-alert.success { background: #E1EEE9; color: var(--teal-d); }
        .rr-alert.error { background: #F5E6EA; color: var(--rose-d); }

        .rr-empty { text-align: center; padding: 44px 24px; color: var(--inks); background: var(--card); border: 1px solid var(--line); border-radius: 22px 8px 22px 8px; }
        .rr-empty h3 { font-family: 'Poppins', sans-serif; color: var(--teal-d); font-size: 14.5px; margin-bottom: 6px; }
        .rr-empty p { font-size: 13px; }

        .rr-list { display: flex; flex-direction: column; gap: 12px; }
        .rr-req-card { background: var(--card); border: 1px solid var(--line); border-radius: 20px 8px 20px 8px; padding: 18px 22px; }
        .rr-req-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
        .rr-req-title { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14.5px; color: var(--ink); margin: 0 0 3px; }
        .rr-req-meta { font-size: 12px; color: var(--inks); }
        .rr-badge { font-family: 'Poppins', sans-serif; font-size: 10.5px; font-weight: 700; padding: 4px 11px; border-radius: 999px; flex-shrink: 0; white-space: nowrap; }
        .rr-badge.gold { background: #FBEAD5; color: var(--orange-d); }
        .rr-badge.green { background: #E1EFE6; color: #4C8A63; }
        .rr-badge.gray { background: #F1E7D4; color: var(--inks); }

        .rr-requester-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 10px 12px; background: var(--cream); border-radius: 12px; }
        .rr-avatar { width: 32px; height: 32px; border-radius: 50%; background: #E1EEE9; color: var(--teal-d); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; font-family: 'Poppins', sans-serif; }
        .rr-requester-name { font-size: 13px; font-weight: 600; color: var(--ink); }
        .rr-requester-email { font-size: 11px; color: var(--inks); }

        .rr-req-id-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .rr-req-id-label { font-size: 11px; color: var(--inks); }
        .rr-req-id-code { font-size: 11px; background: var(--cream); padding: 2px 7px; border-radius: 6px; color: var(--ink); font-family: monospace; word-break: break-all; border: 1px solid var(--line); }

        .rr-buyer-pin-box { background: var(--teal); border-radius: 16px; padding: 16px 20px; text-align: center; margin-bottom: 12px; }
        .rr-buyer-pin-label { font-size: 12px; color: rgba(255,255,255,.8); margin-bottom: 6px; }
        .rr-buyer-pin-code { font-size: 34px; font-weight: 700; color: #fff; letter-spacing: 12px; margin-bottom: 8px; font-family: 'Poppins', sans-serif; }
        .rr-buyer-pin-box .rr-req-id-row { justify-content: center; }
        .rr-buyer-pin-box .rr-req-id-label { color: rgba(255,255,255,.7); }
        .rr-buyer-pin-box .rr-req-id-code { background: rgba(255,255,255,.15); color: #fff; border-color: transparent; }

        .rr-download-info-row { margin-top: 8px; padding: 8px 12px; background: var(--cream); border-radius: 10px; }
        .rr-download-info-row p { font-size: 12px; color: var(--inks); margin: 0; }

        .rr-download-card { margin-bottom: 20px; border: 1px solid var(--teal); }
        .rr-download-title { font-size: 14px; font-weight: 700; color: var(--teal-d); margin-bottom: 6px; font-family: 'Poppins', sans-serif; }
        .rr-download-sub { font-size: 13px; color: var(--inks); margin-bottom: 12px; }
        .rr-download-link { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; background: var(--teal); color: #fff; border-radius: 999px; font-size: 13px; font-weight: 600; text-decoration: none; font-family: 'Poppins', sans-serif; }
        .rr-download-link:hover { background: var(--teal-d); }
        .rr-download-msg { font-size: 12px; color: var(--inks); margin-top: 8px; }

        .rr-btn-download { font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 700; background: var(--orange); color: #fff; padding: 9px 16px; border-radius: 999px; border: none; cursor: pointer; box-shadow: 0 5px 12px rgba(226,144,60,.28); margin-top: 12px; }
        .rr-btn-download:hover { background: var(--orange-d); }
      `}</style>

      <div className="rr-page">
        <div className="rr-wrap">

          {/* Navbar */}
          <nav className="rr-nav">
            <div className="rr-brand">
              <div className="rr-brand-mark">CC</div>
              <div className="rr-brand-name">CampusConnect</div>
            </div>
            <div className="rr-nav-right">
              <div className={`rr-status${isOnline ? '' : ' offline'}`}>
                <span className="rr-status-dot"></span>
                {isOnline ? 'offline ready' : 'offline mode'}
              </div>
              <div className="rr-user-name">{user?.full_name}</div>
              <button className="rr-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>

          <div className="rr-page-head-left">
            <button className="rr-back-btn" onClick={() => navigate('/home')}>Back</button>
            <h1 className="rr-h1">Resource Requests</h1>
          </div>

          {/* Tabs */}
          <div className="rr-tabs">
            <div className={`rr-tab${activeTab === 'seller' ? ' active' : ''}`} onClick={() => setActiveTab('seller')}>
              Seller Dashboard
            </div>
            <div className={`rr-tab${activeTab === 'buyer' ? ' active' : ''}`} onClick={() => setActiveTab('buyer')}>
              My Purchases
            </div>
          </div>

          {error && <div className="rr-error">{error}</div>}
          {loading && <div className="rr-loading">Loading...</div>}

          {/* Seller Tab */}
          {!loading && activeTab === 'seller' && (
            <>
              <div className="rr-card rr-confirm-card">
                <h2 className="rr-section-title">Confirm buyer payment</h2>
                <p className="rr-section-sub">
                  Once the buyer pays you outside the app (JazzCash, bank transfer),
                  enter the request ID and PIN they show you to grant download access.
                </p>

                {confirmMsg && (
                  <div className={`rr-alert ${confirmMsg.includes('confirmed') ? 'success' : 'error'}`}>
                    {confirmMsg}
                  </div>
                )}

                <label className="rr-field-label">Request ID</label>
                <input
                  placeholder="Paste the request ID from buyer"
                  value={confirmData.request_id}
                  onChange={(e) => setConfirmData({ ...confirmData, request_id: e.target.value })}
                />

                <label className="rr-field-label">PIN</label>
                <input
                  className="rr-pin-input"
                  type="text"
                  placeholder="4-digit PIN"
                  maxLength={4}
                  value={confirmData.pin}
                  onChange={(e) => setConfirmData({ ...confirmData, pin: e.target.value })}
                />

                <button className="rr-btn-primary" onClick={handleConfirmPin}>
                  Confirm Payment Received
                </button>
              </div>

              <h2 className="rr-section-title" style={{ marginBottom: '14px' }}>
                Pending requests ({sellerRequests.length})
              </h2>

              {sellerRequests.length === 0 && (
                <div className="rr-empty">
                  <h3>No pending requests</h3>
                  <p>When students request your paid resources they will appear here</p>
                </div>
              )}

              <div className="rr-list">
                {sellerRequests.map((r) => (
                  <div key={r.id} className="rr-req-card">
                    <div className="rr-req-top">
                      <div>
                        <h3 className="rr-req-title">{r.resource_title}</h3>
                        <p className="rr-req-meta">
                          {r.course_code && `${r.course_code} · `}
                          {r.listing_type.charAt(0).toUpperCase() + r.listing_type.slice(1)}
                          {r.borrow_days && ` · ${r.borrow_days} days`}
                          {` · Rs. ${r.listing_type === 'borrow'
                            ? (r.price * r.borrow_days).toFixed(2)
                            : parseFloat(r.price).toFixed(2)}`}
                        </p>
                      </div>
                      <span className={`rr-badge ${r.seller_confirmed ? 'green' : 'gold'}`}>
                        {r.seller_confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>

                    <div className="rr-requester-row">
                      <div className="rr-avatar">{r.requester_name?.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="rr-requester-name">{r.requester_name}</p>
                        <p className="rr-requester-email">{r.requester_email}</p>
                      </div>
                    </div>

                    <div className="rr-req-id-row">
                      <span className="rr-req-id-label">Request ID:</span>
                      <code className="rr-req-id-code">{r.id}</code>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Buyer Tab */}
          {!loading && activeTab === 'buyer' && (
            <>
              {downloadInfo && (
                <div className="rr-card rr-download-card">
                  <p className="rr-download-title">Download link generated</p>
                  <p className="rr-download-sub">
                    Link expires in 10 minutes
                    {downloadInfo.attempts_remaining !== undefined &&
                      ` · ${downloadInfo.attempts_remaining} attempt(s) remaining`}
                  </p>
                  <a
                    href={downloadInfo.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rr-download-link"
                  >
                    Click here if download did not start
                  </a>
                  <p className="rr-download-msg">{downloadInfo.message}</p>
                </div>
              )}

              {buyerRequests.length === 0 && (
                <div className="rr-empty">
                  <h3>No purchases yet</h3>
                  <p>Resources you request will appear here with their download status</p>
                </div>
              )}

              <div className="rr-list">
                {buyerRequests.map((r) => {
                  const status = getStatus(r);
                  return (
                    <div key={r.id} className="rr-req-card">
                      <div className="rr-req-top">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 className="rr-req-title">{r.resource_title}</h3>
                          <p className="rr-req-meta">
                            {r.course_code && `${r.course_code} · `}
                            Seller: {r.seller_name}
                            {r.borrow_days && ` · ${r.borrow_days} days`}
                          </p>
                        </div>
                        <span className={`rr-badge ${status.cls}`}>{status.label}</span>
                      </div>

                      {!r.seller_confirmed && r.pin_code && (
                        <div className="rr-buyer-pin-box">
                          <p className="rr-buyer-pin-label">Show this PIN to the seller:</p>
                          <p className="rr-buyer-pin-code">{r.pin_code}</p>
                          <div className="rr-req-id-row">
                            <span className="rr-req-id-label">Request ID: </span>
                            <code className="rr-req-id-code">{r.id}</code>
                          </div>
                        </div>
                      )}

                      {r.seller_confirmed && (
                        <div className="rr-download-info-row">
                          <p>
                            Downloads used: {r.download_count}/3
                            {r.download_expires_at &&
                              ` · Window expires: ${new Date(r.download_expires_at).toLocaleString()}`}
                          </p>
                        </div>
                      )}

                      {canDownload(r) && (
                        <button className="rr-btn-download" onClick={() => handleDownload(r.id)}>
                          Download ({3 - r.download_count} attempt{3 - r.download_count !== 1 ? 's' : ''} left)
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default ResourceRequests;