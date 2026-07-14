require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

//  Security 
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());

//  Routes 
app.use('/api/auth',              require('./routes/auth.routes'));
app.use('/api/courses',           require('./routes/course.routes'));
app.use('/api/resources',         require('./routes/resource.routes'));
app.use('/api/books',             require('./routes/book.routes'));
app.use('/api/qna',               require('./routes/qna.routes'));
app.use('/api/resource-requests', require('./routes/resource_request.routes'));
// Stats endpoint
app.get('/api/stats', require('./middleware/auth.middleware').authenticate, async (req, res) => {
  try {
    const pool = require('./config/db');
    const [resources, listings, questions] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM resources WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM book_listings WHERE is_active = TRUE AND status = $1', ['available']),
      pool.query('SELECT COUNT(*) FROM answers WHERE is_active = TRUE'),
    ]);
    res.json({
      resources_shared:    parseInt(resources.rows[0].count),
      active_listings:     parseInt(listings.rows[0].count),
      questions_answered:  parseInt(questions.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── Push Subscription 
app.post('/api/push/subscribe', require('./middleware/auth.middleware').authenticate, async (req, res) => {
  try {
    const pool = require('./config/db');
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: 'Subscription required' });

    await pool.query(
      `INSERT INTO push_subscriptions (user_id, subscription)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET subscription = $2, updated_at = NOW()`,
      [req.user.id, JSON.stringify(subscription)]
    );
    res.json({ message: 'Subscription saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});
//  Health Check 
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'roshni-api' }));

//  404 
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

//  Error Handler 
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CampusConnect API → http://localhost:${PORT}`));