const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/courses  list all courses for user's university
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM courses
       WHERE university_id = $1 AND is_active = TRUE
       ORDER BY course_code`,
      [req.user.university_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// POST /api/courses  admin only, adds a new course
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin only' });

  const { course_code, course_name, department, semester } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO courses (university_id, course_code, course_name, department, semester)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.university_id, course_code, course_name, department, semester]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

module.exports = router;