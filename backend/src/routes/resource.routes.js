const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/resources?course_code=CS-301&type=notes
router.get('/', authenticate, async (req, res) => {
  const { course_code, type } = req.query;
  try {
    const conditions = ['r.is_active = TRUE'];
    const params = [];

    if (course_code) {
      params.push(course_code);
      conditions.push(`r.course_code = $${params.length}`);
    }
    if (type) {
      params.push(type);
      conditions.push(`r.resource_type = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT r.*, u.full_name as uploader_name
       FROM resources r
       JOIN users u ON r.uploaded_by = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// GET /api/resources/distinct-courses — for autosuggest dropdown
router.get('/distinct-courses', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT course_code FROM resources ORDER BY course_code`
    );
    res.json(result.rows.map(r => r.course_code));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course codes' });
  }
});

// GET /api/resources/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.full_name as uploader_name
       FROM resources r
       JOIN users u ON r.uploaded_by = u.id
       WHERE r.id = $1 AND r.is_active = TRUE`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Resource not found' });

    await pool.query(
      'UPDATE resources SET download_count = download_count + 1 WHERE id = $1',
      [req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// POST /api/resources
router.post('/', authenticate, async (req, res) => {
  const {
    course_code, title, resource_type, semester, year,
    file_url, cloudinary_id, file_size_kb,
    listing_type, price, delivery_mode, payment_info,
  } = req.body;

  if (!course_code || !title || !file_url || !cloudinary_id)
    return res.status(400).json({ error: 'course_code, title, file_url and cloudinary_id are required' });

  const finalListingType = listing_type || 'gift';
  if (finalListingType !== 'gift' && !price)
    return res.status(400).json({ error: 'price is required for borrow or buy listings' });

  try {
    const result = await pool.query(
      `INSERT INTO resources
        (uploaded_by, course_code, title, resource_type, semester, year,
         file_url, cloudinary_id, file_size_kb, listing_type, price, delivery_mode, payment_info)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.user.id, course_code.trim().toUpperCase(), title, resource_type, semester, year,
        file_url, cloudinary_id, file_size_kb,
        finalListingType, price || null, delivery_mode || 'online', payment_info || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save resource' });
  }
});

// DELETE /api/resources/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT uploaded_by FROM resources WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Resource not found' });
    if (result.rows[0].uploaded_by !== req.user.id)
      return res.status(403).json({ error: 'You can only delete your own resources' });

    await pool.query(
      'UPDATE resources SET is_active = FALSE WHERE id = $1',
      [req.params.id]
    );
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

module.exports = router;