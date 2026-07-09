import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Navbar, PageWrapper, PageContent, PageHeader,
  Button, Card, Badge, Field, Input,
  Alert, EmptyState, Tabs,
} from '../components/UI';

const ResourceRequests = () => {
  const [activeTab, setActiveTab]         = useState('seller');
  const [sellerRequests, setSellerRequests] = useState([]);
  const [buyerRequests, setBuyerRequests]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [confirmData, setConfirmData]     = useState({ request_id: '', pin: '' });
  const [confirmMsg, setConfirmMsg]       = useState('');
  const [downloadInfo, setDownloadInfo]   = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    navigate('/login');
  };

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
      return { label: 'Awaiting confirmation', tone: 'gold' };
    if (new Date() > new Date(r.download_expires_at))
      return { label: 'Expired', tone: 'gray' };
    if (r.download_count >= 3)
      return { label: 'Download limit reached', tone: 'gray' };
    return { label: 'Ready to download', tone: 'green' };
  };

  const canDownload = (r) =>
    r.seller_confirmed &&
    new Date() <= new Date(r.download_expires_at) &&
    r.download_count < 3;

  return (
    <PageWrapper>
      <Navbar userName={user?.full_name} onLogout={handleLogout} />

      <PageContent>
        <PageHeader
          title="Resource Requests"
          onBack={() => navigate('/home')}
        />

        <Tabs
          tabs={[
            { label: 'Seller Dashboard', value: 'seller' },
            { label: 'My Purchases',     value: 'buyer'  },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {error && <Alert type="error" style={{ marginBottom: '16px' }}>{error}</Alert>}
        {loading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0' }}>
            Loading...
          </p>
        )}

        {/* ── Seller Tab  */}
        {!loading && activeTab === 'seller' && (
          <>
            {/* PIN Confirm box */}
            <Card style={{ marginBottom: '24px', maxWidth: '520px' }}>
              <h2 style={styles.sectionTitle}>Confirm buyer payment</h2>
              <p style={styles.sectionSubtitle}>
                Once the buyer pays you outside the app (JazzCash, bank transfer),
                enter the request ID and PIN they show you to grant download access.
              </p>

              {confirmMsg && (
                <Alert
                  type={confirmMsg.includes('confirmed') ? 'success' : 'error'}
                  style={{ marginBottom: '16px' }}
                >
                  {confirmMsg}
                </Alert>
              )}

              <Field label="Request ID">
                <Input
                  placeholder="Paste the request ID from buyer"
                  value={confirmData.request_id}
                  onChange={e => setConfirmData({ ...confirmData, request_id: e.target.value })}
                />
              </Field>

              <Field label="PIN">
                <input
                  type="text"
                  placeholder="4-digit PIN"
                  maxLength={4}
                  value={confirmData.pin}
                  onChange={e => setConfirmData({ ...confirmData, pin: e.target.value })}
                  style={styles.pinInput}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </Field>

              <Button variant="primary" fullWidth onClick={handleConfirmPin}>
                Confirm Payment Received
              </Button>
            </Card>

            {/* Pending requests list */}
            <h2 style={{ ...styles.sectionTitle, marginBottom: '12px' }}>
              Pending requests ({sellerRequests.length})
            </h2>

            {sellerRequests.length === 0 && (
              <EmptyState
                title="No pending requests"
                description="When students request your paid resources they will appear here"
              />
            )}

            <div style={styles.list}>
              {sellerRequests.map(r => (
                <Card key={r.id} style={styles.requestCard}>
                  <div style={styles.requestTop}>
                    <div>
                      <h3 style={styles.requestTitle}>{r.resource_title}</h3>
                      <p style={styles.requestMeta}>
                        {r.course_code && `${r.course_code} · `}
                        {r.listing_type.charAt(0).toUpperCase() + r.listing_type.slice(1)}
                        {r.borrow_days && ` · ${r.borrow_days} days`}
                        {` · Rs. ${r.listing_type === 'borrow'
                          ? (r.price * r.borrow_days).toFixed(2)
                          : parseFloat(r.price).toFixed(2)}`}
                      </p>
                    </div>
                    <Badge tone={r.seller_confirmed ? 'green' : 'gold'}>
                      {r.seller_confirmed ? 'Confirmed' : 'Pending'}
                    </Badge>
                  </div>

                  <div style={styles.requesterRow}>
                    <div style={styles.avatar}>
                      {r.requester_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={styles.requesterName}>{r.requester_name}</p>
                      <p style={styles.requesterEmail}>{r.requester_email}</p>
                    </div>
                  </div>

                  <div style={styles.requestIdRow}>
                    <span style={styles.requestIdLabel}>Request ID:</span>
                    <code style={styles.requestIdCode}>{r.id}</code>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* ── Buyer Tab  */}
        {!loading && activeTab === 'buyer' && (
          <>
            {downloadInfo && (
              <Card style={{ marginBottom: '20px', border: '1px solid var(--success)' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success)', marginBottom: '6px' }}>
                  Download link generated
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Link expires in 10 minutes
                  {downloadInfo.attempts_remaining !== undefined &&
                    ` · ${downloadInfo.attempts_remaining} attempt(s) remaining`}
                </p>
                <a
                  href={downloadInfo.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.downloadLink}
                >
                  Click here if download did not start
                </a>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  {downloadInfo.message}
                </p>
              </Card>
            )}

            {buyerRequests.length === 0 && (
              <EmptyState
                title="No purchases yet"
                description="Resources you request will appear here with their download status"
              />
            )}

            <div style={styles.list}>
              {buyerRequests.map(r => {
                const status = getStatus(r);
                return (
                  <Card key={r.id} style={styles.requestCard}>
                    <div style={styles.requestTop}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={styles.requestTitle}>{r.resource_title}</h3>
                        <p style={styles.requestMeta}>
                          {r.course_code && `${r.course_code} · `}
                          Seller: {r.seller_name}
                          {r.borrow_days && ` · ${r.borrow_days} days`}
                        </p>
                      </div>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>

                    {/* PIN display for buyer */}
                    {!r.seller_confirmed && r.pin_code && (
                      <div style={styles.buyerPinBox}>
                        <p style={styles.buyerPinLabel}>Show this PIN to the seller:</p>
                        <p style={styles.buyerPinCode}>{r.pin_code}</p>
                        <p style={styles.requestIdRow}>
                          <span style={styles.requestIdLabel}>Request ID: </span>
                          <code style={styles.requestIdCode}>{r.id}</code>
                        </p>
                      </div>
                    )}

                    {/* Download info */}
                    {r.seller_confirmed && (
                      <div style={styles.downloadInfoRow}>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Downloads used: {r.download_count}/3
                          {r.download_expires_at &&
                            ` · Window expires: ${new Date(r.download_expires_at).toLocaleString()}`}
                        </p>
                      </div>
                    )}

                    {canDownload(r) && (
                      <div style={{ marginTop: '12px' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDownload(r.id)}
                        >
                          Download ({3 - r.download_count} attempt{3 - r.download_count !== 1 ? 's' : ''} left)
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}

      </PageContent>
    </PageWrapper>
  );
};

const styles = {
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  sectionSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
    lineHeight: '1.6',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  requestCard: {
    padding: '18px 20px',
  },
  requestTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px',
  },
  requestTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '3px',
  },
  requestMeta: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  requesterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    padding: '10px 12px',
    background: 'var(--surface-muted)',
    borderRadius: 'var(--radius-sm)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--primary-light)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0,
  },
  requesterName: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  requesterEmail: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  requestIdRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  requestIdLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  requestIdCode: {
    fontSize: '11px',
    background: 'var(--surface-muted)',
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  buyerPinBox: {
    background: 'var(--primary)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px',
    textAlign: 'center',
    marginBottom: '10px',
  },
  buyerPinLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: '6px',
  },
  buyerPinCode: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '12px',
    marginBottom: '8px',
  },
  downloadInfoRow: {
    marginTop: '8px',
    padding: '8px 12px',
    background: 'var(--surface-muted)',
    borderRadius: 'var(--radius-sm)',
  },
  downloadLink: {
    display: 'inline-flex',
    alignItems: 'center',
    height: '34px',
    padding: '0 14px',
    background: 'var(--success)',
    color: '#fff',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: '500',
    textDecoration: 'none',
  },
  pinInput: {
    width: '100%',
    height: '52px',
    padding: '0 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    fontSize: '24px',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s',
    marginBottom: '4px',
  },
};

export default ResourceRequests;