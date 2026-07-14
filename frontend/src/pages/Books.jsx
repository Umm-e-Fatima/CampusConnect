import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Navbar, PageWrapper, PageContent, PageHeader,
  Button, Card, Badge, Field, Input, Select,
  Alert, Modal, EmptyState, Tabs, Switch,
} from '../components/UI';

const Books = () => {
  const [books, setBooks]               = useState([]);
  const [suggestions, setSuggestions]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [filterCode, setFilterCode]     = useState('');
  const [filterType, setFilterType]     = useState('');
  const [activeTab, setActiveTab]       = useState('browse');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pin, setPin]                   = useState(null);
  const [pinExpiry, setPinExpiry]       = useState(null);
  const [pinInfo, setPinInfo]           = useState(null);
  const [confirmData, setConfirmData]   = useState({ request_id: '', pin: '' });
  const [confirmMsg, setConfirmMsg]     = useState('');
  const [confirmResult, setConfirmResult] = useState(null);
  const [requestingBook, setRequestingBook] = useState(null);
  const [borrowDays, setBorrowDays]     = useState('');
 

  const [createForm, setCreateForm] = useState({
    title: '', author: '', course_code: '', condition: 'good',
    listing_type: 'gift', price: '', borrow_days_limit: '',
    women_only: false, dropoff_location: '', contact_info: '',
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    navigate('/login');
  };

  useEffect(() => {
    api.get('/books/distinct-courses')
      .then(res => setSuggestions(res.data))
      .catch(() => {});
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterType) params.type = filterType;
      if (filterCode.trim()) params.course_code = filterCode.trim().toUpperCase();
      const res = await api.get('/books', { params });
      setBooks(res.data);
    } catch (err) {
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, [filterType, filterCode]);

  const handleRequest = async (book) => {
    setError('');
    if (book.listing_type === 'borrow') {
      setRequestingBook(book);
      setBorrowDays('');
      return;
    }
    try {
      const res = await api.post(`/books/${book.id}/request`, {});
      setPin(res.data.pin);
      setPinExpiry(res.data.expires_at);
      setPinInfo({
        total_price: res.data.total_price,
        dropoff_location: res.data.dropoff_location,
      });
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request book');
    }
  };

  const handleBorrowRequest = async () => {
    if (!borrowDays || borrowDays < 1 || borrowDays > 15) {
      setError('Enter borrow duration between 1 and 15 days');
      return;
    }
    try {
      const res = await api.post(`/books/${requestingBook.id}/request`, {
        borrow_days: parseInt(borrowDays),
      });
      setPin(res.data.pin);
      setPinExpiry(res.data.expires_at);
      setPinInfo({
        due_date: res.data.due_date,
        total_price: res.data.total_price,
        dropoff_location: res.data.dropoff_location,
      });
      setRequestingBook(null);
      setBorrowDays('');
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request book');
    }
  };

  const handleConfirmPin = async () => {
    try {
      const res = await api.post('/books/confirm-pin', confirmData);
      setConfirmMsg('Exchange completed successfully.');
      setConfirmResult(res.data);
      setConfirmData({ request_id: '', pin: '' });
    } catch (err) {
      setConfirmMsg(err.response?.data?.error || 'PIN confirmation failed');
      setConfirmResult(null);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/books', {
        ...createForm,
        course_code: createForm.course_code.trim().toUpperCase() || null,
        price: createForm.listing_type !== 'gift' ? parseFloat(createForm.price) : null,
        borrow_days_limit: createForm.listing_type === 'borrow'
          ? parseInt(createForm.borrow_days_limit) : null,
      });
      setShowCreateForm(false);
      setCreateForm({
        title: '', author: '', course_code: '', condition: 'good',
        listing_type: 'gift', price: '', borrow_days_limit: '',
        women_only: false, dropoff_location: '', contact_info: '',
      });
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing');
    }
  };

  const listingBadge = (b) => {
    if (b.listing_type === 'gift')   return <Badge tone="green">Gift</Badge>;
    if (b.listing_type === 'borrow') return <Badge tone="blue">Borrow · Rs. {b.price}/day</Badge>;
    return <Badge tone="gold">Buy · Rs. {b.price}</Badge>;
  };

  return (
    <PageWrapper>
      <Navbar userName={user?.full_name} onLogout={handleLogout} />

      <PageContent>
        <PageHeader
          title="Book Exchange"
          onBack={() => navigate('/home')}
          action={
            <Button variant="accent" size="md" onClick={() => setShowCreateForm(true)}>
              + List a Book
            </Button>
          }
        />

        <Tabs
          tabs={[
            { label: 'Browse Listings', value: 'browse' },
            { label: 'Confirm PIN',     value: 'confirm' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* ── Browse Tab ─────────────────────────────── */}
        {activeTab === 'browse' && (
          <>
            {/* Filters */}
            <div style={styles.filterRow}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Input
                  placeholder="Filter by course code e.g. CS-301"
                  value={filterCode}
                  onChange={e => setFilterCode(e.target.value)}
                  list="book-filter-suggestions"
                  style={{ paddingLeft: '38px' }}
                />
                <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="var(--text-muted)" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <datalist id="book-filter-suggestions">
                  {suggestions.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <Select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="">All Types</option>
                <option value="gift">Gift</option>
                <option value="borrow">Borrow</option>
                <option value="paid">Buy</option>
              </Select>

              {filterCode && (
                <Button variant="ghost" size="md" onClick={() => setFilterCode('')}>
                  Clear
                </Button>
              )}
            </div>

            {error && (
              <Alert type="error" style={{ marginBottom: '16px' }}>{error}</Alert>
            )}

            {/* PIN display */}
            {pin && (
              <div style={styles.pinBox}>
                <p style={styles.pinLabel}>
                  Your PIN — show this to the seller at the drop-off point
                </p>
                <p style={styles.pinCode}>{pin}</p>
                <p style={styles.pinMeta}>
                  Expires at {new Date(pinExpiry).toLocaleTimeString()}
                  {pinInfo?.due_date && ` · Return by ${new Date(pinInfo.due_date).toLocaleDateString()}`}
                  {pinInfo?.total_price && ` · Total: ${pinInfo.total_price}`}
                </p>
                {pinInfo?.dropoff_location && (
                  <div style={styles.dropoffBadge}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="rgba(255,255,255,0.9)" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Drop-off: {pinInfo.dropoff_location}
                  </div>
                )}
              </div>
            )}

            {loading && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0' }}>
                Loading listings...
              </p>
            )}

            {!loading && books.length === 0 && (
              <EmptyState
                title="No listings available"
                description="Check back later or list your own book"
                action={
                  <Button variant="primary" onClick={() => setShowCreateForm(true)}>
                    List a Book
                  </Button>
                }
              />
            )}

            <div style={styles.list}>
              {books.map(b => (
                <Card key={b.id} style={styles.bookCard}>
                  <div style={styles.cardLeft}>
                    <div style={styles.badgeRow}>
                      {listingBadge(b)}
                      <Badge tone="gray">{b.condition}</Badge>
                      {b.women_only && <Badge tone="pink">Women Only</Badge>}
                      {b.course_code && (
                        <span style={styles.courseCode}>{b.course_code}</span>
                      )}
                    </div>
                    <h3 style={styles.bookTitle}>{b.title}</h3>
                    {b.author && (
                      <p style={styles.bookAuthor}>by {b.author}</p>
                    )}
                    <p style={styles.bookMeta}>Seller: {b.seller_name}</p>
                    {b.dropoff_location && (
                      <p style={styles.dropoffMeta}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                          stroke="var(--text-muted)" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round"
                          style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {b.dropoff_location}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRequest(b)}
                  >
                    Request
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* ── Confirm PIN Tab ─────────────────────────── */}
        {activeTab === 'confirm' && (
          <Card style={{ maxWidth: '480px' }}>
            <h2 style={styles.confirmTitle}>Confirm Book Exchange</h2>
            <p style={styles.confirmSubtitle}>
              Once the buyer pays you outside the app, enter their request ID
              and PIN to confirm the exchange.
            </p>

            {confirmMsg && (
              <Alert
                type={confirmMsg.includes('success') ? 'success' : 'error'}
                style={{ marginBottom: '16px' }}
              >
                {confirmMsg}
              </Alert>
            )}

            {confirmResult && confirmMsg.includes('success') && (
              <div style={styles.contactReveal}>
                <p style={styles.contactRevealTitle}>Exchange confirmed</p>
                {confirmResult.dropoff_location && (
                  <div style={styles.contactRow}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="var(--primary)" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>Drop-off: <strong>{confirmResult.dropoff_location}</strong></span>
                  </div>
                )}
                {confirmResult.contact_info && (
                  <div style={styles.contactRow}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="var(--primary)" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.02-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>Contact: <strong>{confirmResult.contact_info}</strong></span>
                  </div>
                )}
                {!confirmResult.contact_info && !confirmResult.dropoff_location && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Seller did not add contact info. Coordinate at the campus drop-off point.
                  </p>
                )}
              </div>
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
              Confirm Exchange
            </Button>
          </Card>
        )}

      </PageContent>

      {/* ── Create Listing Modal ──────────────────────── */}
      {showCreateForm && (
        <Modal
          title="List a Book"
          onClose={() => setShowCreateForm(false)}
          maxWidth="520px"
        >
          <form onSubmit={handleCreateListing}>

            <Field label="Book Title">
              <Input
                placeholder="e.g. Introduction to Algorithms"
                value={createForm.title}
                onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                required
              />
            </Field>

            <Field label="Author">
              <Input
                placeholder="e.g. Thomas Cormen"
                value={createForm.author}
                onChange={e => setCreateForm({ ...createForm, author: e.target.value })}
              />
            </Field>

            <Field label="Course Code (optional)">
              <Input
                placeholder="e.g. CS-301"
                value={createForm.course_code}
                onChange={e => setCreateForm({ ...createForm, course_code: e.target.value })}
                list="create-book-suggestions"
              />
              <datalist id="create-book-suggestions">
                {suggestions.map(c => <option key={c} value={c} />)}
              </datalist>
            </Field>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Field label="Condition" style={{ flex: 1 }}>
                <Select
                  value={createForm.condition}
                  onChange={e => setCreateForm({ ...createForm, condition: e.target.value })}
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>
              </Field>

              <Field label="Listing Type" style={{ flex: 1 }}>
                <Select
                  value={createForm.listing_type}
                  onChange={e => setCreateForm({ ...createForm, listing_type: e.target.value })}
                >
                  <option value="gift">Gift-Free</option>
                  <option value="borrow">Borrow-Per day</option>
                  <option value="paid">Buy-Fixed price</option>
                </Select>
              </Field>
            </div>

            {createForm.listing_type !== 'gift' && (
              <Field
                label={`Price (PKR)${createForm.listing_type === 'borrow' ? ' per day' : ''}`}
              >
                <Input
                  type="number"
                  placeholder={createForm.listing_type === 'borrow' ? 'e.g. 20' : 'e.g. 200'}
                  value={createForm.price}
                  onChange={e => setCreateForm({ ...createForm, price: e.target.value })}
                  min="1"
                  required
                />
              </Field>
            )}

            {createForm.listing_type === 'borrow' && (
              <Field label="Max Borrow Duration (days)">
                <Input
                  type="number"
                  placeholder="Max 15 days"
                  value={createForm.borrow_days_limit}
                  onChange={e => setCreateForm({ ...createForm, borrow_days_limit: e.target.value })}
                  min="1"
                  max="15"
                  required
                />
              </Field>
            )}

            <Field
              label="Drop-off Location"
              hint="Where should the buyer meet you? e.g. Library Gate 2, CS Block Lobby"
            >
              <Input
                placeholder="e.g. Library Gate 2, CS Block Lobby"
                value={createForm.dropoff_location}
                onChange={e => setCreateForm({ ...createForm, dropoff_location: e.target.value })}
              />
            </Field>

            <Field
              label="Contact Info (shown to buyer only after exchange is confirmed)"
              hint="WhatsApp number, phone number, or any preferred contact method"
            >
              <Input
                placeholder="e.g. 03XX-XXXXXXX or WhatsApp: 03XX-XXXXXXX"
                value={createForm.contact_info}
                onChange={e => setCreateForm({ ...createForm, contact_info: e.target.value })}
              />
            </Field>
            <div style={{ marginBottom: '20px' }}>
              <Switch
                checked={createForm.women_only}
                onChange={v => setCreateForm({ ...createForm, women_only: v })}
                label="Restrict to female students only"
              />
            </div>

            <Button type="submit" variant="primary" fullWidth>
              Create Listing
            </Button>

          </form>
        </Modal>
      )}

      {/* ── Borrow Days Modal ────────────────────────── */}
      {requestingBook && (
        <Modal
          title="How many days?"
          onClose={() => setRequestingBook(null)}
          maxWidth="400px"
        >
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            <strong>{requestingBook.title}</strong> · Rs. {requestingBook.price}/day
          </p>

          <Field
            label="Borrow duration (1–15 days)"
            hint={borrowDays && requestingBook.price
              ? `Total: Rs. ${(requestingBook.price * borrowDays).toFixed(2)}`
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

          {error && (
            <Alert type="error" style={{ marginBottom: '16px' }}>{error}</Alert>
          )}

          <Button variant="primary" fullWidth onClick={handleBorrowRequest}>
            Confirm Request
          </Button>
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
  pinBox: {
    background: 'var(--primary)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  pinLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: '8px',
  },
  pinCode: {
    fontSize: '44px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '14px',
    marginBottom: '6px',
    fontFamily: 'Inter, sans-serif',
  },
  pinMeta: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.65)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  bookCard: {
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
  bookTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  bookAuthor: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  bookMeta: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  confirmTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  confirmSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
    lineHeight: '1.6',
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
  dropoffBadge: {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  marginTop: '10px',
  padding: '5px 12px',
  background: 'rgba(255,255,255,0.15)',
  borderRadius: '20px',
  fontSize: '12px',
  color: '#fff',
},
dropoffMeta: {
  fontSize: '11px',
  color: 'var(--text-muted)',
  marginTop: '3px',
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
},
contactReveal: {
  background: 'var(--primary-light)',
  border: '1px solid rgba(30,58,138,0.15)',
  borderRadius: 'var(--radius-md)',
  padding: '14px 16px',
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
},
contactRevealTitle: {
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--primary)',
  marginBottom: '2px',
},
contactRow: {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '13px',
  color: 'var(--text-primary)',
},
};

export default Books;