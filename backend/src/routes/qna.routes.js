const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/qna?course_id=xxx — fetch all questions
router.get('/', authenticate, async (req, res) => {
  const { course_id } = req.query;
  try {
    const result = await pool.query(
      `SELECT q.id, q.body, q.upvote_count, q.is_resolved,
              q.created_at, c.course_code,
              CASE WHEN q.is_anonymous THEN 'Anonymous'
                   ELSE u.full_name END as author_name
       FROM questions q
       JOIN users u ON q.author_id = u.id
       JOIN courses c ON q.course_id = c.id
       WHERE q.is_active = TRUE
         AND c.university_id = $1
         ${course_id ? 'AND q.course_id = $2' : ''}
       ORDER BY q.upvote_count DESC, q.created_at DESC`,
      course_id ? [req.user.university_id, course_id] : [req.user.university_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// GET /api/qna/:id — single question with its answers
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Fetch question
    const question = await pool.query(
      `SELECT q.id, q.body, q.upvote_count, q.is_resolved,
              q.created_at, c.course_code,
              CASE WHEN q.is_anonymous THEN 'Anonymous'
                   ELSE u.full_name END as author_name
       FROM questions q
       JOIN users u ON q.author_id = u.id
       JOIN courses c ON q.course_id = c.id
       WHERE q.id = $1 AND q.is_active = TRUE`,
      [req.params.id]
    );
    if (question.rows.length === 0)
      return res.status(404).json({ error: 'Question not found' });

    // Fetch answers for this question
    const answers = await pool.query(
      `SELECT a.id, a.body, a.upvote_count, a.is_accepted,
              a.created_at,
              CASE WHEN a.is_anonymous THEN 'Anonymous'
                   ELSE u.full_name END as author_name
       FROM answers a
       JOIN users u ON a.author_id = u.id
       WHERE a.question_id = $1 AND a.is_active = TRUE
       ORDER BY a.is_accepted DESC, a.upvote_count DESC`,
      [req.params.id]
    );

    res.json({ ...question.rows[0], answers: answers.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// POST /api/qna — post a new anonymous question
router.post('/', authenticate, async (req, res) => {
  const { course_id, body } = req.body;

  if (!course_id || !body)
    return res.status(400).json({ error: 'course_id and body are required' });

  try {
    const result = await pool.query(
      `INSERT INTO questions (author_id, course_id, body)
       VALUES ($1,$2,$3) RETURNING *`,
      [req.user.id, course_id, body]
    );
    res.status(201).json({ ...result.rows[0], author_name: 'Anonymous' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post question' });
  }
});

// POST /api/qna/:id/answers — post an answer to a question
router.post('/:id/answers', authenticate, async (req, res) => {
  const { body } = req.body;

  if (!body)
    return res.status(400).json({ error: 'body is required' });

  try {
    const result = await pool.query(
      `INSERT INTO answers (question_id, author_id, body)
       VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.id, body]
    );
    res.status(201).json({ ...result.rows[0], author_name: 'Anonymous' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post answer' });
  }
});

// POST /api/qna/:id/upvote — upvote a question or answer
router.post('/:id/upvote', authenticate, async (req, res) => {
  const { target_type } = req.body; // 'question' or 'answer'

  if (!target_type || !['question', 'answer'].includes(target_type))
    return res.status(400).json({ error: 'target_type must be question or answer' });

  try {
    await pool.query(
      'INSERT INTO upvotes (user_id, target_type, target_id) VALUES ($1,$2,$3)',
      [req.user.id, target_type, req.params.id]
    );

    const table = target_type === 'question' ? 'questions' : 'answers';
    await pool.query(
      `UPDATE ${table} SET upvote_count = upvote_count + 1 WHERE id = $1`,
      [req.params.id]
    );

    res.json({ message: 'Upvoted successfully' });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'You have already upvoted this' });
    res.status(500).json({ error: 'Failed to upvote' });
  }
});

// PATCH /api/qna/:id/resolve — question author marks as resolved
router.patch('/:id/resolve', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT author_id FROM questions WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Question not found' });
    if (result.rows[0].author_id !== req.user.id)
      return res.status(403).json({ error: 'Only the question author can mark it resolved' });

    await pool.query(
      'UPDATE questions SET is_resolved = TRUE WHERE id = $1',
      [req.params.id]
    );
    res.json({ message: 'Question marked as resolved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve question' });
  }
});

module.exports = router;