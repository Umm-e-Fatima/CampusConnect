const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/qna?course_code=CS-301
router.get('/', authenticate, async (req, res) => {
  const { course_code } = req.query;
  try {
    const conditions = ['q.is_active = TRUE'];
    const params = [];

    if (course_code) {
      params.push(course_code);
      conditions.push(`q.course_code = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT q.id, q.body, q.upvote_count, q.is_resolved,
              q.created_at, q.course_code,q.author_id,
              CASE WHEN q.is_anonymous THEN 'Anonymous'
                   ELSE u.full_name END as author_name
       FROM questions q
       JOIN users u ON q.author_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY q.upvote_count DESC, q.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// GET /api/qna/distinct-courses — for autosuggest
router.get('/distinct-courses', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT course_code FROM questions
       WHERE course_code IS NOT NULL
       ORDER BY course_code`
    );
    res.json(result.rows.map(r => r.course_code));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course codes' });
  }
});

// GET /api/qna/:id — single question with answers
router.get('/:id', authenticate, async (req, res) => {
  try {
    const question = await pool.query(
      `SELECT q.id, q.body, q.upvote_count, q.is_resolved,
              q.created_at, q.course_code,q.author_id,
              CASE WHEN q.is_anonymous THEN 'Anonymous'
                   ELSE u.full_name END as author_name
       FROM questions q
       JOIN users u ON q.author_id = u.id
       WHERE q.id = $1 AND q.is_active = TRUE`,
      [req.params.id]
    );
    if (question.rows.length === 0)
      return res.status(404).json({ error: 'Question not found' });

    const answers = await pool.query(
      `SELECT a.id, a.body, a.upvote_count, a.is_accepted,
              a.author_id,
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

// POST /api/qna — post anonymous question
router.post('/', authenticate, async (req, res) => {
  const { course_code, body } = req.body;

  if (!course_code || !body)
    return res.status(400).json({ error: 'course_code and body are required' });

  try {
    const result = await pool.query(
      `INSERT INTO questions (author_id, course_code, body)
       VALUES ($1,$2,$3) RETURNING *`,
      [req.user.id, course_code.trim().toUpperCase(), body]
    );
    res.status(201).json({ ...result.rows[0], author_name: 'Anonymous' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post question' });
  }
});

// POST /api/qna/:id/answers
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

// POST /api/qna/:id/upvote
router.post('/:id/upvote', authenticate, async (req, res) => {
  const { target_type } = req.body;

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

// PATCH /api/qna/:id/resolve
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
// PATCH /api/qna/:id — edit question
router.patch('/:id', authenticate, async (req, res) => {
  const { body } = req.body;
  try {
    const result = await pool.query(
      'SELECT author_id FROM questions WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Question not found' });
    if (result.rows[0].author_id !== req.user.id)
      return res.status(403).json({ error: 'You can only edit your own questions' });

    await pool.query(
      'UPDATE questions SET body = $1 WHERE id = $2',
      [body, req.params.id]
    );
    res.json({ message: 'Question updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// DELETE /api/qna/:id — delete question
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT author_id FROM questions WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Question not found' });
    if (result.rows[0].author_id !== req.user.id)
      return res.status(403).json({ error: 'You can only delete your own questions' });

    await pool.query(
      'UPDATE questions SET is_active = FALSE WHERE id = $1',
      [req.params.id]
    );
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// PATCH /api/qna/answers/:id — edit answer
router.patch('/answers/:id', authenticate, async (req, res) => {
  const { body } = req.body;
  try {
    const result = await pool.query(
      'SELECT author_id FROM answers WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Answer not found' });
    if (result.rows[0].author_id !== req.user.id)
      return res.status(403).json({ error: 'You can only edit your own answers' });

    await pool.query(
      'UPDATE answers SET body = $1 WHERE id = $2',
      [body, req.params.id]
    );
    res.json({ message: 'Answer updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update answer' });
  }
});

// DELETE /api/qna/answers/:id — delete answer
router.delete('/answers/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT author_id FROM answers WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Answer not found' });
    if (result.rows[0].author_id !== req.user.id)
      return res.status(403).json({ error: 'You can only delete your own answers' });

    await pool.query(
      'UPDATE answers SET is_active = FALSE WHERE id = $1',
      [req.params.id]
    );
    res.json({ message: 'Answer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete answer' });
  }
});

module.exports = router;