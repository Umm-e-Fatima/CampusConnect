import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pin, setPin] = useState(null);
  const [pinExpiry, setPinExpiry] = useState(null);
  const [pinInfo, setPinInfo] = useState(null);
  const [confirmData, setConfirmData] = useState({ request_id: '', pin: '' });
  const [confirmMsg, setConfirmMsg] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    author: '',
    course_code: '',
    condition: 'good',
    listing_type: 'gift',
    price: '',
    borrow_days_limit: '',
    women_only: false,
  });
  const [borrowDays, setBorrowDays] = useState('');
  const navigate = useNavigate();

  // Fetch course code suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await api.get('/books/distinct-courses');
        setSuggestions(res.data);
      } catch (err) {
        // Non-critical
      }
    };
    fetchSuggestions();
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

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line
  }, [filterType, filterCode]);

  const handleRequest = async (book) => {
    try {
      const body = {};
      if (book.listing_type === 'borrow') {
        if (!borrowDays || borrowDays < 1 || borrowDays > 15) {
          setError('Please enter borrow duration between 1 and 15 days');
          return;
        }
        body.borrow_days = parseInt(borrowDays);
      }
      const res = await api.post(`/books/${book.id}/request`, body);
      setPin(res.data.pin);
      setPinExpiry(res.data.expires_at);
      setPinInfo({
        due_date: res.data.due_date,
        total_price: res.data.total_price,
      });
      setError('');
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request book');
    }
  };

  const handleConfirmPin = async () => {
    try {
      await api.post('/books/confirm-pin', confirmData);
      setConfirmMsg('Exchange completed successfully');
      setConfirmData({ request_id: '', pin: '' });
    } catch (err) {
      setConfirmMsg(err.response?.data?.error || 'PIN confirmation failed');
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
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
        listing_type: 'gift', price: '', borrow_days_limit: '', women_only: false,
      });
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing');
    }
  };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/home')}>
          Back
        </button>
        <h1 style={styles.title}>Book Exchange</h1>
        <button
          style={styles.createBtn}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'List a Book'}
        </button>
      </div>

      {/* Create Listing Form */}
      {showCreateForm && (
        <div style={styles.formBox}>
          <h2 style={styles.formTitle}>List a Book</h2>
          <form onSubmit={handleCreateListing}>

            <div style={styles.field}>
              <label style={styles.label}>Book Title</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. Introduction to Algorithms"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Author</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. Thomas Cormen"
                value={createForm.author}
                onChange={(e) => setCreateForm({ ...createForm, author: e.target.value })}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Course Code (optional)</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. CS-301"
                value={createForm.course_code}
                onChange={(e) => setCreateForm({ ...createForm, course_code: e.target.value })}
                list="book-course-suggestions"
              />
              <datalist id="book-course-suggestions">
                {suggestions.map(code => (
                  <option key={code} value={code} />
                ))}
              </datalist>
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.field, flex: 1, marginRight: '10px' }}>
                <label style={styles.label}>Condition</label>
                <select
                  style={styles.input}
                  value={createForm.condition}
                  onChange={(e) => setCreateForm({ ...createForm, condition: e.target.value })}
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>Listing Type</label>
                <select
                  style={styles.input}
                  value={createForm.listing_type}
                  onChange={(e) => setCreateForm({ ...createForm, listing_type: e.target.value })}
                >
                  <option value="gift">Gift-Free</option>
                  <option value="borrow">Borrow-Per day</option>
                  <option value="buy">Buy-Fixed price</option>
                </select>
              </div>
            </div>

            {createForm.listing_type !== 'gift' && (
              <div style={styles.field}>
                <label style={styles.label}>
                  Price (PKR){createForm.listing_type === 'borrow' ? ' per day' : ''}
                </label>
                <input
                  style={styles.input}
                  type="number"
                  placeholder={createForm.listing_type === 'borrow' ? 'e.g. 20' : 'e.g. 200'}
                  value={createForm.price}
                  onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                  min="1"
                  required
                />
              </div>
            )}

            {createForm.listing_type === 'borrow' && (
              <div style={styles.field}>
                <label style={styles.label}>Max Borrow Duration (days)</label>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="Max 15 days"
                  value={createForm.borrow_days_limit}
                  onChange={(e) => setCreateForm({ ...createForm, borrow_days_limit: e.target.value })}
                  min="1"
                  max="15"
                  required
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={createForm.women_only}
                  onChange={(e) => setCreateForm({ ...createForm, women_only: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Restrict to female students only
              </label>
            </div>

            <button type="submit" style={styles.submitBtn}>
              Create Listing
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={activeTab === 'browse' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('browse')}
        >
          Browse Listings
        </button>
        <button
          style={activeTab === 'confirm' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('confirm')}
        >
          Confirm PIN
        </button>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          {/* Filters */}
          <div style={styles.filters}>
            <input
              style={styles.filterInput}
              type="text"
              placeholder="Filter by course code e.g. CS-301"
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              list="book-filter-suggestions"
            />
            <datalist id="book-filter-suggestions">
              {suggestions.map(code => (
                <option key={code} value={code} />
              ))}
            </datalist>

            <select
              style={styles.select}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="paid">Paid</option>
              <option value="gift">Gift</option>
              <option value="borrow">Borrow</option>
            </select>

            {filterCode && (
              <button style={styles.clearBtn} onClick={() => setFilterCode('')}>
                Clear
              </button>
            )}
          </div>

          {/* PIN Result */}
          {pin && (
            <div style={styles.pinBox}>
              <p style={styles.pinLabel}>
                Your PIN — show this to the seller at the campus drop point
              </p>
              <p style={styles.pinCode}>{pin}</p>
              <p style={styles.pinExpiry}>
                Expires at: {new Date(pinExpiry).toLocaleTimeString()}
              </p>
              {pinInfo?.due_date && (
                <p style={styles.pinExpiry}>
                  Return by: {new Date(pinInfo.due_date).toLocaleDateString()}
                </p>
              )}
              {pinInfo?.total_price && (
                <p style={styles.pinExpiry}>
                  Total to pay: {pinInfo.total_price}
                </p>
              )}
            </div>
          )}

          {/* Borrow days input */}
          <div style={{ marginBottom: '16px' }}>
            <input
              style={{ ...styles.filterInput, maxWidth: '240px' }}
              type="number"
              placeholder="Borrow duration (days, max 15)"
              value={borrowDays}
              onChange={(e) => setBorrowDays(e.target.value)}
              min="1"
              max="15"
            />
            <p style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
              Only needed if requesting a Borrow listing
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {loading && <p style={styles.message}>Loading listings...</p>}

          {!loading && books.length === 0 && (
            <div style={styles.empty}>
              <h3 style={styles.emptyTitle}>No listings available</h3>
              <p style={styles.emptyText}>Check back later or list your own book</p>
            </div>
          )}

          <div style={styles.list}>
            {books.map(b => (
              <div key={b.id} style={styles.card}>
                <div style={styles.cardLeft}>
                  <div style={styles.badgeRow}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor:
                        b.listing_type === 'gift'   ? '#e8f5e9' :
                        b.listing_type === 'borrow' ? '#e3f2fd' : '#fff8e1',
                      color:
                        b.listing_type === 'gift'   ? '#2d6a4f' :
                        b.listing_type === 'borrow' ? '#1565c0' : '#f57f17',
                    }}>
                      {b.listing_type.charAt(0).toUpperCase() + b.listing_type.slice(1)}
                    </span>
                    <span style={styles.conditionBadge}>{b.condition}</span>
                    {b.women_only && (
                      <span style={styles.womenBadge}>Women Only</span>
                    )}
                  </div>

                  <h3 style={styles.cardTitle}>{b.title}</h3>
                  {b.author && (
                    <p style={styles.cardAuthor}>by {b.author}</p>
                  )}
                  <p style={styles.cardMeta}>
                    {b.course_code && `${b.course_code} · `}
                    Seller: {b.seller_name}
                    {b.listing_type !== 'gift' && ` · Rs. ${b.price}${b.listing_type === 'borrow' ? '/day' : ''}`}
                  </p>
                </div>

                <button
                  style={styles.requestBtn}
                  onClick={() => handleRequest(b)}
                >
                  Request
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirm PIN Tab */}
      {activeTab === 'confirm' && (
        <div style={styles.confirmBox}>
          <h2 style={styles.confirmTitle}>Confirm Book Exchange</h2>
          <p style={styles.confirmSubtitle}>
            Enter the request ID and PIN the buyer shows you to complete the exchange
          </p>

          {confirmMsg && (
            <div style={
              confirmMsg.includes('success') ? styles.success : styles.error
            }>
              {confirmMsg}
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Request ID</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Paste the request ID"
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
            Confirm Exchange
          </button>
        </div>
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
    flex: 1,
  },
  createBtn: {
    padding: '10px 20px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  formBox: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    marginBottom: '24px',
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2d6a4f',
    marginBottom: '20px',
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
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterInput: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    flex: 1,
    minWidth: '180px',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '10px 16px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#555',
  },
  pinBox: {
    backgroundColor: '#2d6a4f',
    color: '#fff',
    padding: '24px',
    borderRadius: '12px',
    textAlign: 'center',
    marginBottom: '24px',
  },
  pinLabel: {
    fontSize: '14px',
    marginBottom: '8px',
    opacity: 0.85,
  },
  pinCode: {
    fontSize: '48px',
    fontWeight: '700',
    letterSpacing: '12px',
    marginBottom: '8px',
  },
  pinExpiry: {
    fontSize: '13px',
    opacity: 0.75,
    marginTop: '4px',
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
  },
  badgeRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  conditionBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#f5f5f5',
    color: '#888',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  womenBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#fce4ec',
    color: '#c2185b',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
  },
  cardAuthor: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '4px',
  },
  cardMeta: {
    fontSize: '13px',
    color: '#aaa',
  },
  requestBtn: {
    padding: '8px 20px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  confirmBox: {
    backgroundColor: '#fff',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    maxWidth: '480px',
  },
  confirmTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2d6a4f',
    marginBottom: '8px',
  },
  confirmSubtitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  field: {
    marginBottom: '16px',
  },
  row: {
    display: 'flex',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '6px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#555',
    cursor: 'pointer',
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
  submitBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  confirmBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default Books;