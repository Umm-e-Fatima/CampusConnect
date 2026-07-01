import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import UploadResourceForm from '../components/UploadResourceForm';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const navigate = useNavigate();

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
              <span style={styles.comingSoonBtn}>
                Coming Soon
              </span>
            )}
          </div>
        ))}
      </div>

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
};

export default Resources;