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
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/courses',   require('./routes/course.routes'));
app.use('/api/resources', require('./routes/resource.routes'));
app.use('/api/books',     require('./routes/book.routes'));
app.use('/api/qna',       require('./routes/qna.routes'));

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
app.listen(PORT, () => console.log(`Roshni API → http://localhost:${PORT}`));