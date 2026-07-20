require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1); // tells Express to trust Vercel's forwarded headers

// ── Security ──
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());

// ── Routes ──
app.use('/api/auth',              require('./routes/auth.routes'));
// ...(rest of your routes stay exactly the same)