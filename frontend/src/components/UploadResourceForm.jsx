import React, { useState } from 'react';
import axios from 'axios';
import api from '../utils/api';

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

const UploadResourceForm = ({ courses, onUploaded, onClose }) => {
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    resource_type: 'notes',
    semester: '',
    year: '',
    listing_type: 'gift',
    price: '',
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file or take a photo first');
      return;
    }
    if (!form.course_id || !form.title) {
      setError('Course and title are required');
      return;
    }
    if (form.listing_type !== 'gift' && !form.price) {
      setError('Price is required for borrow or buy listings');
      return;
    }

    setUploading(true);
    try {
      // Step 1: Upload file directly to Cloudinary (unsigned)
      const cloudForm = new FormData();
      cloudForm.append('file', file);
      cloudForm.append('upload_preset', UPLOAD_PRESET);
      cloudForm.append('folder', 'roshni_resources');

      const cloudRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        cloudForm
      );

      const { secure_url, public_id, bytes } = cloudRes.data;

      // Step 2: Save metadata to our backend
      await api.post('/resources', {
        course_id: form.course_id,
        title: form.title,
        resource_type: form.resource_type,
        semester: form.semester ? parseInt(form.semester) : null,
        year: form.year ? parseInt(form.year) : null,
        file_url: secure_url,
        cloudinary_id: public_id,
        file_size_kb: Math.round(bytes / 1024),
        listing_type: form.listing_type,
        price: form.listing_type !== 'gift' ? parseFloat(form.price) : null,
        delivery_mode: 'online',
      });

      onUploaded();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
        'Upload failed. Please check your file and try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Upload Resource</h2>
          <button style={styles.closeBtn} onClick={onClose}>Close</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>

          <div style={styles.field}>
            <label style={styles.label}>Course</label>
            <select
              style={styles.input}
              name="course_id"
              value={form.course_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a course</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.course_code} — {c.course_name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Title</label>
            <input
              style={styles.input}
              type="text"
              name="title"
              placeholder="e.g. Midterm Notes Chapter 1-5"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1, marginRight: '10px' }}>
              <label style={styles.label}>Type</label>
              <select
                style={styles.input}
                name="resource_type"
                value={form.resource_type}
                onChange={handleChange}
              >
                <option value="notes">Notes</option>
                <option value="past_paper">Past Paper</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Semester</label>
              <select
                style={styles.input}
                name="semester"
                value={form.semester}
                onChange={handleChange}
              >
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Listing Type</label>
            <select
              style={styles.input}
              name="listing_type"
              value={form.listing_type}
              onChange={handleChange}
            >
              <option value="gift">Gift — Free for everyone</option>
              <option value="borrow">Borrow — Rent per day</option>
              <option value="buy">Buy — One-time purchase</option>
            </select>
          </div>

          {form.listing_type !== 'gift' && (
            <div style={styles.field}>
              <label style={styles.label}>
                Price (PKR) {form.listing_type === 'borrow' ? 'per day' : ''}
              </label>
              <input
                style={styles.input}
                type="number"
                name="price"
                placeholder={form.listing_type === 'borrow' ? 'e.g. 20' : 'e.g. 200'}
                value={form.price}
                onChange={handleChange}
                min="1"
                required
              />
              <p style={styles.hint}>
                Borrow/Buy purchases are not yet live — this listing will be visible but not purchasable until that feature ships.
              </p>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>File</label>
            <input
              style={styles.fileInput}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFileChange}
              required
            />
            <p style={styles.hint}>
              Choose a file from your device, or use your camera to take a photo directly
            </p>
            {file && <p style={styles.fileName}>Selected: {file.name}</p>}
          </div>

          <button
            type="submit"
            style={uploading ? { ...styles.submitBtn, opacity: 0.7 } : styles.submitBtn}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Resource'}
          </button>

        </form>
      </div>
    </div>
  );
};

const styles = {
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
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
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
  error: {
    backgroundColor: '#ffe5e5',
    color: '#c0392b',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
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
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  fileInput: {
    width: '100%',
    padding: '10px 0',
    fontSize: '14px',
  },
  hint: {
    fontSize: '12px',
    color: '#aaa',
    marginTop: '6px',
  },
  fileName: {
    fontSize: '13px',
    color: '#2d6a4f',
    fontWeight: '600',
    marginTop: '8px',
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
};

export default UploadResourceForm;