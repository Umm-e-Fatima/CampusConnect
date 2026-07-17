import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';

const CLOUD_NAME    = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

const UploadResourceForm = ({ onUploaded, onClose }) => {
  const [form, setForm] = useState({
    course_code: '', title: '', resource_type: 'notes',
    semester: '', listing_type: 'gift', price: '', payment_info: '',
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
        payment_info:  form.listing_type !== 'gift' ? form.payment_info.trim() || null : null,
      });

      onUploaded();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const listingTagLabel = () => {
    if (form.listing_type === 'gift') return { text: 'Gift — Free', free: true };
    if (form.listing_type === 'borrow') return { text: `Borrow · Rs.${form.price || '0'}/day`, free: false };
    return { text: `Buy · Rs.${form.price || '0'}`, free: false };
  };
  const previewTag = listingTagLabel();
  const isPaper = form.resource_type === 'past_paper';

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
        .upl-overlay { position: fixed; inset: 0; background: rgba(58,54,48,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; font-family: 'Nunito', sans-serif; }
        .upl-modal { width: 440px; max-width: 100%; max-height: 92vh; overflow-y: auto; background: var(--card); border: 1px solid var(--line); border-radius: 32px 12px 32px 12px; padding: 30px; box-shadow: 0 24px 50px rgba(40,25,10,.3); }
        .upl-modal-head { display: flex; justify-content: space-between; align-items: center; }
        .upl-modal-head h2 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 19px; color: var(--teal-d); margin: 0; }
        .upl-close-btn { background: none; border: none; color: var(--inks); font-size: 13px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600; }
        .upl-error { background: #F5E6EA; color: var(--rose-d); border: 1px solid rgba(150,71,93,0.2); border-radius: 10px; padding: 10px 14px; font-size: 12.5px; margin-top: 14px; }
        .upl-label { display: block; font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 600; color: var(--ink); margin: 16px 0 7px; }
        .upl-input, .upl-select { width: 100%; background: var(--cream); border: 1px solid var(--line); border-radius: 14px; padding: 11px 16px; color: var(--ink); font-size: 13px; font-family: 'Nunito', sans-serif; }
        .upl-input:focus, .upl-select:focus { outline: none; border-color: var(--teal); }
        .upl-hint { font-size: 11px; color: var(--inks); margin-top: 6px; }
        .upl-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .upl-file-drop { border: 2px dashed var(--line); border-radius: 14px; padding: 14px; margin-top: 6px; }
        .upl-file-drop input[type="file"] { width: 100%; font-size: 12px; color: var(--inks); }
        .upl-file-selected { font-size: 12px; color: var(--teal); margin-top: 6px; font-weight: 600; }
        .upl-btn-primary { width: 100%; margin-top: 22px; padding: 14px; background: var(--orange); color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13px; border-radius: 999px; border: none; cursor: pointer; box-shadow: 0 6px 14px rgba(226,144,60,.3); }
        .upl-btn-primary:hover { background: var(--orange-d); }
        .upl-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .upl-preview-label { font-family: 'Poppins', sans-serif; font-size: 10.5px; font-weight: 600; color: var(--inks); letter-spacing: .04em; text-transform: uppercase; margin: 18px 0 10px; display: flex; align-items: center; gap: 8px; }
        .upl-preview-label::after { content: ""; flex-grow: 1; height: 1px; background: var(--line); }
        .upl-idx-preview-wrap { display: flex; justify-content: center; padding: 6px 0 4px; }
        .upl-idx-card { width: 150px; min-height: 180px; background: var(--cream); border-radius: 3px; padding: 18px 13px 12px; position: relative; box-shadow: 0 10px 18px rgba(50,25,8,.18); display: flex; flex-direction: column; justify-content: space-between; }
        .upl-idx-card .upl-rod-hole { position: absolute; top: -8px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; border-radius: 50%; background: #8C6A3F; box-shadow: inset 0 2px 3px rgba(0,0,0,.35); }
        .upl-idx-card .upl-course-tab { font-family: 'Poppins', sans-serif; font-size: 9.5px; font-weight: 700; color: #fff; background: var(--teal); padding: 3px 8px; border-radius: 5px; width: fit-content; }
        .upl-idx-card.upl-type-paper .upl-course-tab { background: var(--rose-d); }
        .upl-idx-card h5 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 13px; color: var(--ink); margin: 9px 0 3px; line-height: 1.2; }
        .upl-idx-card .upl-tag { font-family: 'Poppins', sans-serif; font-size: 9px; font-weight: 700; color: var(--orange-d); background: #FBEAD5; padding: 2px 7px; border-radius: 999px; width: fit-content; margin-top: 5px; }
        .upl-idx-card .upl-tag.free { color: var(--teal-d); background: #E1EEE9; }
      `}</style>

      <div className="upl-overlay">
        <div className="upl-modal">
          <div className="upl-modal-head">
            <h2>Upload Resource</h2>
            <button type="button" className="upl-close-btn" onClick={onClose}>Close</button>
          </div>

          {error && <div className="upl-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label className="upl-label">Course Code</label>
            <input
              className="upl-input"
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
            <div className="upl-hint">type your course code,previous codes appear as suggestions</div>

            <label className="upl-label">Title</label>
            <input
              className="upl-input"
              name="title"
              placeholder="e.g. Midterm Notes Chapter 1-5"
              value={form.title}
              onChange={handleChange}
              required
            />

            <div className="upl-row2" style={{ marginTop: '16px' }}>
              <div>
                <label className="upl-label" style={{ marginTop: 0 }}>Type</label>
                <select className="upl-select" name="resource_type" value={form.resource_type} onChange={handleChange}>
                  <option value="notes">Notes</option>
                  <option value="past_paper">Past Paper</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="upl-label" style={{ marginTop: 0 }}>Semester</label>
                <select className="upl-select" name="semester" value={form.semester} onChange={handleChange}>
                  <option value="">—</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="upl-label">Listing Type</label>
            <select className="upl-select" name="listing_type" value={form.listing_type} onChange={handleChange}>
              <option value="gift">Gift:Free for everyone</option>
              <option value="borrow">Borrow:Rent per day (PKR)</option>
              <option value="buy">Buy:One-time purchase (PKR)</option>
            </select>

            {form.listing_type !== 'gift' && (
              <>
                <label className="upl-label">
                  Price (PKR){form.listing_type === 'borrow' ? ' per day' : ''}
                </label>
                <input
                  className="upl-input"
                  type="number"
                  name="price"
                  placeholder={form.listing_type === 'borrow' ? 'e.g. 20' : 'e.g. 200'}
                  value={form.price}
                  onChange={handleChange}
                  min="1"
                  required
                />
                <div className="upl-hint">Borrow/Buy purchase flow active,buyers will go through PIN confirmation</div>

                <label className="upl-label">Payment Info</label>
                <input
                  className="upl-input"
                  name="payment_info"
                  placeholder="e.g. JazzCash: 03XX-XXXXXXX or bank account details"
                  value={form.payment_info}
                  onChange={handleChange}
                />
                <div className="upl-hint">Shown to the buyer as soon as they request,this is how they will pay you</div>
              </>
            )}

            <label className="upl-label">File</label>
            <div className="upl-file-drop">
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={e => setFile(e.target.files[0])}
              />
              {file && <div className="upl-file-selected">Selected: {file.name}</div>}
              {!file && <div className="upl-hint" style={{ marginTop: '2px' }}>Choose a PDF or image, or use your camera</div>}
            </div>

            <div className="upl-preview-label">Drawer preview</div>
            <div className="upl-idx-preview-wrap">
              <div className={`upl-idx-card${isPaper ? ' upl-type-paper' : ''}`}>
                <div className="upl-rod-hole"></div>
                <div className="upl-course-tab">{form.course_code || 'CS-301'}</div>
                <h5>{form.title || 'Untitled resource'}</h5>
                <div className={`upl-tag${previewTag.free ? ' free' : ''}`}>{previewTag.text}</div>
              </div>
            </div>

            <button type="submit" className="upl-btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Resource'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default UploadResourceForm;