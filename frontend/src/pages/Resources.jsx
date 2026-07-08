import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Navbar, PageWrapper, PageContent, PageHeader,
  Button, Card, Badge, Field, Input, Select,
  Textarea, Alert, Modal, EmptyState, Tabs, Switch,
} from '../components/UI';
import UploadResourceForm from '../components/UploadResourceForm';

const Resources = () => {
  const [resources, setResources]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [filterCode, setFilterCode]       = useState('');
  const [filterType, setFilterType]       = useState('');
  const [suggestions, setSuggestions]     = useState([]);
  const [showUpload, setShowUpload]       = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [requestForm, setRequestForm]     = useState(null);
  const [borrowDays, setBorrowDays]       = useState('');
  const [requestMsg, setRequestMsg]       = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    navigate('/login');
  };

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
    } catch (err) {
      setError('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, [filterCode, filterType]);

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
      setRequestMsg(
        `Request created. PIN: ${res.data.pin} | Request ID: ${res.data.request_id} | ${res.data.total_price}`
      );
    } catch (err) {
      setRequestMsg(err.response?.data?.error || 'Request failed');
    }
  };

  const listingBadge = (r) => {
    if (r.listing_type === 'gift')   return <Badge tone="green">Gift</Badge>;
    if (r.listing_type === 'borrow') return <Badge tone="blue">Borrow · Rs. {r.price}/day</Badge>;
    return <Badge tone="gold">Buy · Rs. {r.price}</Badge>;
  };

  const typeBadge = (type) => {
    if (type === 'past_paper') return <Badge tone="navy">Past Paper</Badge>;
    if (type === 'notes')      return <Badge tone="navy">Notes</Badge>;
    return <Badge tone="gray">Other</Badge>;
  };

  return (
    <PageWrapper>
      <Navbar userName={user?.full_name} onLogout={handleLogout} />

      <PageContent>
        <PageHeader
          title="Resource Hub"
          onBack={() => navigate('/home')}
          action={
            <Button
              variant="accent"
              size="md"
              onClick={() => setShowUpload(true)}
            >
              + Upload Resource
            </Button>
          }
        />

        {/* Filters */}
        <div style={styles.filterRow}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Input
              placeholder="Filter by course code e.g. CS-301"
              value={filterCode}
              onChange={e => setFilterCode(e.target.value)}
              list="res-course-suggestions"
              style={{ paddingLeft: '38px' }}
            />
            <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="var(--text-muted)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <datalist id="res-course-suggestions">
              {suggestions.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <Select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">All Types</option>
            <option value="notes">Notes</option>
            <option value="past_paper">Past Papers</option>
            <option value="other">Other</option>
          </Select>

          {filterCode && (
            <Button variant="ghost" size="md" onClick={() => setFilterCode('')}>
              Clear
            </Button>
          )}
        </div>

        {error && <Alert type="error" style={{ marginBottom: '16px' }}>{error}</Alert>}

        {loading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0' }}>
            Loading resources...
          </p>
        )}

        {!loading && resources.length === 0 && (
          <EmptyState
            title="No resources found"
            description="Be the first to upload notes or past papers for this course"
            action={
              <Button variant="primary" onClick={() => setShowUpload(true)}>
                Upload Resource
              </Button>
            }
          />
        )}

        {/* Resource list */}
        <div style={styles.list}>
          {resources.map(r => (
            <Card key={r.id} style={styles.resourceCard}>
              <div style={styles.cardLeft}>
                <div style={styles.badgeRow}>
                  {typeBadge(r.resource_type)}
                  {listingBadge(r)}
                  {r.course_code && (
                    <span style={styles.courseCode}>{r.course_code}</span>
                  )}
                </div>
                <h3 style={styles.resourceTitle}>{r.title}</h3>
                <p style={styles.resourceMeta}>
                  Uploaded by {r.uploader_name}
                  {r.semester ? ` · Semester ${r.semester}` : ''}
                  {` · ${r.download_count} downloads`}
                </p>
              </div>

              <div style={styles.cardActions}>
                {r.listing_type === 'gift' ? (
                  <a
                    href={r.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.downloadLink}
                  >
                    Download
                  </a>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequest(r)}
                  >
                    Request Access
                  </Button>
                )}

                {r.uploaded_by === user?.id && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteConfirmId(r.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

      </PageContent>

      {/* Upload Modal */}
      {showUpload && (
        <UploadResourceForm
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); fetchResources(); }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <Modal title="Remove Resource" onClose={() => setDeleteConfirmId(null)}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
            Are you sure you want to remove this resource? It will no longer be visible to other students.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="danger" fullWidth onClick={handleDelete}>
              Yes, Remove
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}

      {/* Request Access Modal */}
      {requestForm && (
        <Modal
          title="Request Access"
          onClose={() => setRequestForm(null)}
        >
          <div style={styles.requestInfo}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {requestForm.title}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {requestForm.course_code} ·{' '}
              {requestForm.listing_type === 'borrow'
                ? `Rs. ${requestForm.price}/day`
                : `Rs. ${requestForm.price} one-time`}
            </p>
          </div>

          {requestForm.listing_type === 'borrow' && (
            <Field
              label="How many days? (max 15)"
              hint={borrowDays && requestForm.price
                ? `Total: Rs. ${(requestForm.price * borrowDays).toFixed(2)}`
                : ''}
            >
              <Input
                type="number"
                min="1"
                max="15"
                placeholder="e.g. 3"
                value={borrowDays}
                onChange={e => setBorrowDays(e.target.value)}
              />
            </Field>
          )}

          <div style={styles.paymentNote}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Pay the seller directly via JazzCash or bank transfer, then show them your PIN to confirm.
            </p>
          </div>

          {requestMsg && (
            <Alert
              type={requestMsg.includes('failed') || requestMsg.includes('error') ? 'error' : 'success'}
              style={{ marginBottom: '16px' }}
            >
              {requestMsg}
            </Alert>
          )}

          {!requestMsg ? (
            <Button variant="primary" fullWidth onClick={submitRequest}>
              Confirm Request
            </Button>
          ) : !requestMsg.includes('failed') && (
            <Button
              variant="primary"
              fullWidth
              onClick={() => { setRequestForm(null); navigate('/resource-requests'); }}
            >
              View My Requests
            </Button>
          )}
        </Modal>
      )}

    </PageWrapper>
  );
};

const styles = {
  filterRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  resourceCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  cardLeft: {
    flex: 1,
    minWidth: 0,
  },
  badgeRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: '8px',
  },
  courseCode: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  resourceTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  resourceMeta: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  downloadLink: {
    display: 'inline-flex',
    alignItems: 'center',
    height: '32px',
    padding: '0 12px',
    background: 'var(--primary)',
    color: '#fff',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '500',
    textDecoration: 'none',
  },
  requestInfo: {
    padding: '14px',
    background: 'var(--surface-muted)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '16px',
  },
  paymentNote: {
    padding: '12px 14px',
    background: 'var(--primary-light)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '16px',
    marginTop: '8px',
  },
};

export default Resources;