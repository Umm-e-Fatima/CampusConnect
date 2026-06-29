const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/resources?course_id=xxx  fetch notes/papers for a course
router.get('/', authenticate, async (req, res) => {
  const { course_id, type } = req.query;
  try {
    const result = await pool.query(
      `SELECT r.*, 
              u.full_name as uploader_name, 
              c.course_code
       FROM resources r
       JOIN users u ON r.uploaded_by = u.id
       JOIN courses c ON r.course_id = c.id
       WHERE r.is_active = TRUE
         AND c.university_id = $1
         ${course_id ? 'AND r.course_id = $2' : ''}
         ${type ? `AND r.resource_type = ${course_id ? '$3' : '$2'}` : ''}
       ORDER BY r.created_at DESC`,
      [req.user.university_id, ...(course_id ? [course_id] : []), ...(type ? [type] : [])]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// GET /api/resources/:id  single resource detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.full_name as uploader_name, c.course_code
       FROM resources r
       JOIN users u ON r.uploaded_by = u.id
       JOIN courses c ON r.course_id = c.id
       WHERE r.id = $1 AND r.is_active = TRUE`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Resource not found' });

    // Increment download count
    await pool.query(
      'UPDATE resources SET download_count = download_count + 1 WHERE id = $1',
      [req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// POST /api/resources  save resource after Cloudinary upload
router.post('/', authenticate, async (req, res) => {
  const { course_id, title, resource_type, semester, year, file_url, cloudinary_id, file_size_kb } = req.body;

  if (!course_id || !title || !file_url || !cloudinary_id)
    return res.status(400).json({ error: 'course_id, title, file_url and cloudinary_id are required' });

  try {
    const result = await pool.query(
      `INSERT INTO resources
        (uploaded_by, course_id, title, resource_type, semester, year, file_url, cloudinary_id, file_size_kb)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [req.user.id, course_id, title, resource_type, semester, year, file_url, cloudinary_id, file_size_kb]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save resource' });
  }
});

// DELETE /api/resources/:id  only uploader can delete their own resource
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