import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ResourceRequests = () => {
  const [activeTab, setActiveTab] = useState('seller');
  const [sellerRequests, setSellerRequests] = useState([]);
  const [buyerRequests, setBuyerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmData, setConfirmData] = useState({ request_id: '', pin: '' });
  const [confirmMsg, setConfirmMsg] = useState('');
  const [downloadInfo, setDownloadInfo] = useState(null);
  const navigate = useNavigate();

  const fetchSellerRequests = async () => {
    try {
      const res = await api.get('/resource-requests/seller/pending');
      setSellerRequests(res.data);
    } catch (err) {
      setError('Failed to fetch seller requests');
    }
  };

  const fetchBuyerRequests = async () => {
    try {
      const res = await api.get('/resource-requests/buyer/my-requests');
      setBuyerRequests(res.data);
    } catch (err) {
      setError('Failed to fetch your requests');
    }
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
      // Open the download URL in a new tab automatically
      window.open(res.data.download_url, '_blank');
      fetchBuyerRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate download link');
    }
  };

  const getStatusBadge = (request) => {
    if (!request.seller_confirmed)
      return { label: 'Awaiting Payment Confirmation', color: '#f57f17', bg: '#fff8e1' };
    if (new Date() > new Date(request.download_expires_at))
      return { label: 'Expired', color: '#c0392b', bg: '#ffe5e5' };
    if (request.download_count >= 3)
      return { label: 'Download Limit Reached', color: '#888', bg: '#f5f5f5' };
    return { label: 'Ready to Download', color: '#2d6a4f', bg: '#e8f5e9' };
  };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/home')}>
          Back
        </button>
        <h1 style={styles.title}>Resource Requests</h1>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={activeTab === 'seller' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('seller')}
        >
          Seller Dashboard
        </button>
        <button
          style={activeTab === 'buyer' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('buyer')}
        >
          My Purchases
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {loading && <p style={styles.message}>Loading...</p>}

      {/* ── SELLER TAB ── */}
      {!loading && activeTab === 'seller' && (
        <>
          {/* PIN Confirmation Box */}
          <div style={styles.confirmBox}>
            <h2 style={styles.confirmTitle}>Confirm Buyer Payment</h2>
            <p style={styles.confirmSubtitle}>
              Once the buyer pays you outside the app (JazzCash, bank transfer etc.),
              enter the request ID and PIN they show you to grant them download access.
            </p>

            {confirmMsg && (
              <div style={
                confirmMsg.includes('confirmed') ? styles.success : styles.error
              }>
                {confirmMsg}
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Request ID</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Paste the request ID from buyer"
                value={confirmData.request_id}
                onChange={(e) => setConfirmData({ ...confirmData, request_id: e.target.value })}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>PIN</label>
              <input
                style={styles.pinInput}
                type="text"
                placeholder="4-digit PIN"
                maxLength={4}
                value={confirmData.pin}
                onChange={(e) => setConfirmData({ ...confirmData, pin: e.target.value })}
              />
            </div>

            <button style={styles.confirmBtn} onClick={handleConfirmPin}>
              Confirm Payment Received
            </button>
          </div>

          {/* Pending Requests List */}
          <h2 style={styles.sectionTitle}>
            Pending Requests ({sellerRequests.length})
          </h2>

          {sellerRequests.length === 0 && (
            <div style={styles.empty}>
              <h3 style={styles.emptyTitle}>No pending requests</h3>
              <p style={styles.emptyText}>
                When students request your paid resources, they will appear here
              </p>
            </div>
          )}

          <div style={styles.list}>
            {sellerRequests.map(r => (
              <div key={r.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <h3 style={styles.cardTitle}>{r.resource_title}</h3>
                  <span style={styles.courseTag}>{r.course_code}</span>
                </div>
                <div style={styles.cardMeta}>
                  <p>Requested by: <strong>{r.requester_name}</strong></p>
                  <p>Email: {r.requester_email}</p>
                  <p>
                    Type: {r.listing_type.charAt(0).toUpperCase() + r.listing_type.slice(1)}
                    {r.borrow_days && ` · ${r.borrow_days} days`}
                    {` · Rs. ${r.listing_type === 'borrow'
                      ? (r.price * r.borrow_days).toFixed(2)
                      : parseFloat(r.price).toFixed(2)}`}
                  </p>
                  <p style={styles.requestId}>Request ID: <code>{r.id}</code></p>
                </div>
                <div style={styles.statusRow}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: r.seller_confirmed ? '#e8f5e9' : '#fff8e1',
                    color: r.seller_confirmed ? '#2d6a4f' : '#f57f17',
                  }}>
                    {r.seller_confirmed ? 'Payment Confirmed' : 'Awaiting Your Confirmation'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── BUYER TAB ── */}
      {!loading && activeTab === 'buyer' && (
        <>
          {downloadInfo && (
            <div style={styles.downloadBox}>
              <p style={styles.downloadTitle}>Download link generated</p>
              <p style={styles.downloadMeta}>
                Link expires in 10 minutes · {downloadInfo.attempts_remaining} attempt(s) remaining
              </p>
              <a
                href={downloadInfo.download_url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.downloadLink}
              >
                Click here if download did not start automatically
              </a>
              <p style={styles.downloadNote}>{downloadInfo.message}</p>
            </div>
          )}

          {buyerRequests.length === 0 && (
            <div style={styles.empty}>
              <h3 style={styles.emptyTitle}>No purchases yet</h3>
              <p style={styles.emptyText}>
                Resources you request will appear here with their download status
              </p>
            </div>
          )}

          <div style={styles.list}>
            {buyerRequests.map(r => {
              const status = getStatusBadge(r);
              return (
                <div key={r.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <h3 style={styles.cardTitle}>{r.resource_title}</h3>
                    <span style={styles.courseTag}>{r.course_code}</span>
                  </div>

                  <div style={styles.cardMeta}>
                    <p>Seller: <strong>{r.seller_name}</strong></p>
                    <p>
                      {r.listing_type.charAt(0).toUpperCase() + r.listing_type.slice(1)}
                      {r.borrow_days && ` · ${r.borrow_days} days`}
                    </p>
                    {r.seller_confirmed && (
                      <p>
                        Downloads used: {r.download_count}/3 ·
                        Window expires: {new Date(r.download_expires_at).toLocaleString()}
                      </p>
                    )}
                    {!r.seller_confirmed && (
                      <div style={styles.pinBox}>
                        <p style={styles.pinLabel}>Show this PIN to the seller:</p>
                        <p style={styles.pinCode}>{r.pin_code}</p>
                        <p style={styles.requestId}>
                          Request ID: <code>{r.id}</code>
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={styles.statusRow}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: status.bg,
                      color: status.color,
                    }}>
                      {status.label}
                    </span>

                    {r.seller_confirmed &&
                     new Date() <= new Date(r.download_expires_at) &&
                     r.download_count < 3 && (
                      <button
                        style={styles.downloadBtn}
                        onClick={() => handleDownload(r.id)}
                      >
                        Download ({3 - r.download_count} left)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

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
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  backBtn: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#555',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2d6a4f',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#555',
    fontWeight: '500',
  },
  tabActive: {
    padding: '10px 20px',
    backgroundColor: '#2d6a4f',
    border: '1px solid #2d6a4f',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#fff',
    fontWeight: '600',
  },
  confirmBox: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    marginBottom: '24px',
  },
  confirmTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2d6a4f',
    marginBottom: '8px',
  },
  confirmSubtitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '20px',
    lineHeight: '1.6',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  pinInput: {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    border: '2px solid #2d6a4f',
    fontSize: '24px',
    textAlign: 'center',
    letterSpacing: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  confirmBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '16px',
  },
  error: {
    backgroundColor: '#ffe5e5',
    color: '#c0392b',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2d6a4f',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  message: {
    color: '#888',
    textAlign: 'center',
    padding: '40px',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#aaa',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '20px 24px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  courseTag: {
    padding: '4px 10px',
    backgroundColor: '#e8f5e9',
    color: '#2d6a4f',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.8',
    marginBottom: '12px',
  },
  requestId: {
    fontSize: '12px',
    color: '#aaa',
    marginTop: '4px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  pinBox: {
    backgroundColor: '#2d6a4f',
    color: '#fff',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
    marginTop: '8px',
  },
  pinLabel: {
    fontSize: '13px',
    opacity: 0.85,
    marginBottom: '6px',
  },
  pinCode: {
    fontSize: '36px',
    fontWeight: '700',
    letterSpacing: '10px',
    marginBottom: '8px',
  },
  downloadBox: {
    backgroundColor: '#e8f5e9',
    padding: '20px 24px',
    borderRadius: '12px',
    marginBottom: '24px',
    border: '1px solid #2d6a4f',
  },
  downloadTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#2d6a4f',
    marginBottom: '6px',
  },
  downloadMeta: {
    fontSize: '13px',
    color: '#555',
    marginBottom: '12px',
  },
  downloadLink: {
    display: 'inline-block',
    padding: '8px 20px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    marginBottom: '10px',
  },
  downloadNote: {
    fontSize: '12px',
    color: '#888',
    marginTop: '8px',
  },
  downloadBtn: {
    padding: '8px 20px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default ResourceRequests;