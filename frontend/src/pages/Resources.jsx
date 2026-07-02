import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import UploadResourceForm from '../components/UploadResourceForm';
import { useAuth } from '../context/AuthContext';

const Resources = () => {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [resources, setResources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [requestForm, setRequestForm] = useState(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [borrowDays, setBorrowDays] = useState('');
  
  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data);
      } catch (err) {
        console.error('Failed to fetch courses', err);
      }
    };

    fetchCourses();
  }, []);

  // Fetch resources
  const fetchResources = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {};

      if (selectedCourse) params.course_id = selectedCourse;
      if (selectedType) params.type = selectedType;

      const res = await api.get('/resources', { params });
      setResources(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedCourse, selectedType]);

  const handleRequest = (resource) => {
  setRequestForm(resource);
  setRequestMsg('');
  setBorrowDays('');
};
  
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

const submitRequest = async () => {
  try {
    const body = { delivery_mode: 'online' };
    if (requestForm.listing_type === 'borrow') {
      if (!borrowDays || borrowDays < 1 || borrowDays > 15) {
        setRequestMsg('Please enter borrow duration between 1 and 15 days');
        return;
      }
      body.borrow_days = parseInt(borrowDays);
    }
    const res = await api.post(`/resource-requests/${requestForm.id}`, body);
    setRequestMsg(res.data.message);
    setRequestMsg(`${res.data.message} | PIN: ${res.data.pin} | Request ID: ${res.data.request_id}`);
  } catch (err) {
    setRequestMsg(err.response?.data?.error || 'Request failed');
  }
};

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          style={styles.backBtn}
          onClick={() => navigate('/home')}
        >
          Back
        </button>

        <h1 style={styles.title}>Resource Hub</h1>

        <button
          style={styles.uploadBtn}
          onClick={() => setShowUpload(true)}
        >
          Upload Resource
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <select
          style={styles.select}
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">All Courses</option>

          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.course_code} — {c.course_name}
            </option>
          ))}
        </select>

        <select
          style={styles.select}
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="notes">Notes</option>
          <option value="past_paper">Past Papers</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p style={styles.message}>
          Loading resources...
        </p>
      )}

      {/* Empty State */}
      {!loading && resources.length === 0 && (
        <div style={styles.empty}>
          <h3 style={styles.emptyTitle}>
            No resources found
          </h3>

          <p style={styles.emptyText}>
            Be the first to upload notes for this course.
          </p>
        </div>
      )}

      {/* Resource List */}
      <div style={styles.list}>
        {resources.map((r) => (
          <div key={r.id} style={styles.card}>
            <div style={styles.cardLeft}>
              <span style={styles.badge}>
                {r.resource_type === 'past_paper'
                  ? 'Past Paper'
                  : r.resource_type === 'notes'
                  ? 'Notes'
                  : 'Other'}
              </span>

              {r.listing_type !== 'gift' && (
                <span style={styles.priceBadge}>
                  {r.listing_type === 'borrow'
                    ? `Rs. ${r.price}/day`
                    : `Rs. ${r.price}`}
                </span>
              )}

              <h3 style={styles.cardTitle}>
                {r.title}
              </h3>

              <p style={styles.cardMeta}>
                {r.course_code} &bull; Uploaded by {r.uploader_name} &bull;{' '}
                {r.download_count} downloads
              </p>
            </div>

            <div style={styles.cardActions}>
                {r.listing_type === 'gift' ? (
                  <a
                    href={r.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.downloadBtn}
                  >
                    Download
                  </a>
                ) : (
                  <button
                    style={styles.requestBtn}
                    onClick={() => handleRequest(r)}
                  >
                    Request Access
                  </button>
                )}

                {r.uploaded_by === user?.id && (
                  <button
                    style={styles.deleteBtn}
                    onClick={() => setDeleteConfirmId(r.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
          </div>
        ))}
      </div>

      {/* Request Access Modal */}
      {requestForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Request Access</h2>
              <button style={styles.closeBtn} onClick={() => setRequestForm(null)}>
                Close
              </button>
            </div>

            <p style={styles.resourceInfo}>
              <strong>{requestForm.title}</strong> · {requestForm.course_code}
            </p>
            <p style={styles.resourceInfo}>
              {requestForm.listing_type === 'borrow'
                ? `Rs. ${requestForm.price}/day`
                : `Rs. ${requestForm.price} one-time`}
            </p>

            {requestForm.listing_type === 'borrow' && (
              <div style={styles.field}>
                <label style={styles.label}>How many days? (max 15)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max="15"
                  placeholder="e.g. 3"
                  value={borrowDays}
                  onChange={(e) => setBorrowDays(e.target.value)}
                />
                {borrowDays && requestForm.price && (
                  <p style={styles.priceCalc}>
                    Total: Rs. {(requestForm.price * borrowDays).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <p style={styles.paymentNote}>
              Pay the seller directly via JazzCash or bank transfer,
              then show them your PIN to confirm.
            </p>

            {requestMsg && (
              <div style={requestMsg.includes('failed') || requestMsg.includes('error')
                ? styles.error : styles.success}>
                {requestMsg}
              </div>
            )}

            {!requestMsg && (
              <button style={styles.submitBtn} onClick={submitRequest}>
                Confirm Request
              </button>
            )}

            {requestMsg && !requestMsg.includes('failed') && (
              <button
                style={styles.submitBtn}
                onClick={() => {
                  setRequestForm(null);
                  navigate('/resource-requests');
                }}
              >
                View My Requests
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadResourceForm
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            fetchResources();
          }}
        />
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Remove Resource</h2>
            </div>
            <p style={{ fontSize: '15px', color: '#555', marginBottom: '24px', lineHeight: '1.6' }}>
              Are you sure you want to remove this resource? It will no longer be visible to other students.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={styles.submitBtn}
                onClick={handleDelete}
              >
                Yes, Remove
              </button>
              <button
                style={{ ...styles.submitBtn, backgroundColor: '#fff', color: '#555', border: '1px solid #ddd' }}
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
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
  },
  uploadBtn: {
    marginLeft: 'auto',
    padding: '10px 20px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  filters: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    minWidth: '200px',
  },
  error: {
    backgroundColor: '#ffe5e5',
    color: '#c0392b',
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
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#e8f5e9',
    color: '#2d6a4f',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    marginRight: '8px',
    marginBottom: '8px',
  },
  priceBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#fff8e1',
    color: '#f57f17',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '6px',
  },
  cardMeta: {
    fontSize: '13px',
    color: '#aaa',
  },
  downloadBtn: {
    padding: '8px 20px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  comingSoonBtn: {
    padding: '8px 20px',
    backgroundColor: '#f5f5f5',
    color: '#aaa',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  overlay: {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  zIndex: 1000,
},
modal: {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '28px',
  width: '100%',
  maxWidth: '420px',
  maxHeight: '90vh',
  overflowY: 'auto',
},
modalHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
},
modalTitle: {
  fontSize: '20px',
  fontWeight: '700',
  color: '#2d6a4f',
},
closeBtn: {
  padding: '6px 14px',
  backgroundColor: '#f5f5f5',
  border: 'none',
  borderRadius: '8px',
  fontSize: '13px',
  cursor: 'pointer',
  color: '#555',
},
resourceInfo: {
  fontSize: '15px',
  color: '#333',
  marginBottom: '8px',
},
field: {
  marginBottom: '16px',
  marginTop: '16px',
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
priceCalc: {
  fontSize: '14px',
  fontWeight: '600',
  color: '#2d6a4f',
  marginTop: '6px',
},
paymentNote: {
  fontSize: '13px',
  color: '#888',
  lineHeight: '1.6',
  marginTop: '16px',
  marginBottom: '16px',
  padding: '12px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
},
success: {
  backgroundColor: '#e8f5e9',
  color: '#2d6a4f',
  padding: '10px',
  borderRadius: '8px',
  marginBottom: '16px',
  fontSize: '13px',
  lineHeight: '1.6',
},
requestBtn: {
  padding: '8px 20px',
  backgroundColor: '#1565c0',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
},
submitBtn: {
  width: '100%',
  padding: '12px',
  backgroundColor: '#2d6a4f',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  marginTop: '8px',
},
cardActions: {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  alignItems: 'flex-end',
},
deleteBtn: {
  padding: '6px 16px',
  backgroundColor: '#fff',
  color: '#c0392b',
  border: '1px solid #c0392b',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
},
};

export default Resources;