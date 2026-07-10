import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';
import { Button, Field, Input, Select, Alert, Modal } from './UI';

const CLOUD_NAME   = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

const UploadResourceForm = ({ onUploaded, onClose }) => {
  const [form, setForm] = useState({
    course_code: '', title: '', resource_type: 'notes',
    semester: '', listing_type: 'gift', price: '',
  });
  const [suggestions, setSuggestions] = useState([]);
  const [file, setFile]               = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    api.get('/resources/distinct-courses')
      .then(res => setSuggestions(res.data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) { setError('Please select a file or take a photo'); return; }
    if (!form.course_code.trim() || !form.title.trim()) {
      setError('Course code and title are required'); return;
    }
    if (form.listing_type !== 'gift' && !form.price) {
      setError('Price is required for borrow or buy listings'); return;
    }

    setUploading(true);
    try {
      const cloudForm = new FormData();
      cloudForm.append('file', file);
      cloudForm.append('upload_preset', UPLOAD_PRESET);
      cloudForm.append('folder', 'roshni_resources');

      const cloudRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        cloudForm
      );
      const { secure_url, public_id, bytes } = cloudRes.data;

      await api.post('/resources', {
        course_code:   form.course_code.trim().toUpperCase(),
        title:         form.title,
        resource_type: form.resource_type,
        semester:      form.semester ? parseInt(form.semester) : null,
        file_url:      secure_url,
        cloudinary_id: public_id,
        file_size_kb:  Math.round(bytes / 1024),
        listing_type:  form.listing_type,
        price:         form.listing_type !== 'gift' ? parseFloat(form.price) : null,
        delivery_mode: 'online',
      });

      onUploaded();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Upload Resource" onClose={onClose} maxWidth="480px">

      {error && <Alert type="error" style={{ marginBottom: '16px' }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>

        <Field label="Course Code" hint="Type your course code — previous codes appear as suggestions">
          <Input
            name="course_code"
            placeholder="e.g. CS-301"
            value={form.course_code}
            onChange={handleChange}
            list="upload-course-suggestions"
            required
          />
          <datalist id="upload-course-suggestions">
            {suggestions.map(c => <option key={c} value={c} />)}
          </datalist>
        </Field>

        <Field label="Title">
          <Input
            name="title"
            placeholder="e.g. Midterm Notes Chapter 1-5"
            value={form.title}
            onChange={handleChange}
            required
          />
        </Field>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Type" style={{ flex: 1 }}>
            <Select name="resource_type" value={form.resource_type} onChange={handleChange}>
              <option value="notes">Notes</option>
              <option value="past_paper">Past Paper</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Semester" style={{ width: '110px' }}>
            <Select name="semester" value={form.semester} onChange={handleChange}>
              <option value="">—</option>
              {[1,2,3,4,5,6,7,8].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Listing Type">
          <Select name="listing_type" value={form.listing_type} onChange={handleChange}>
            <option value="gift">Gift — Free for everyone</option>
            <option value="borrow">Borrow — Rent per day (PKR)</option>
            <option value="buy">Buy — One-time purchase (PKR)</option>
          </Select>
        </Field>

        {form.listing_type !== 'gift' && (
          <Field
            label={`Price (PKR)${form.listing_type === 'borrow' ? ' per day' : ''}`}
            hint="Borrow/Buy purchase flow active — buyers will go through PIN confirmation"
          >
            <Input
              type="number"
              name="price"
              placeholder={form.listing_type === 'borrow' ? 'e.g. 20' : 'e.g. 200'}
              value={form.price}
              onChange={handleChange}
              min="1"
              required
            />
          </Field>
        )}

        <Field
          label="File"
          hint="Choose a PDF or image from your device, or use your camera"
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={e => setFile(e.target.files[0])}
            style={{ width: '100%', fontSize: '13px', padding: '8px 0' }}
          />
          {file && (
            <p style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px', fontWeight: '500' }}>
              Selected: {file.name}
            </p>
          )}
        </Field>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Resource'}
        </Button>

      </form>
    </Modal>
  );
};

export default UploadResourceForm;