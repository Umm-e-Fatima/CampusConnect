const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');
const { generatePIN, getPINExpiry } = require('../utils/pin.utils');

// GET /api/books  list available books at user's university
router.get('/', authenticate, async (req, res) => {
  const { type } = req.query; // paid, gift, borrow
  try {
    const result = await pool.query(
      `SELECT b.*, 
              u.full_name as seller_name,
              c.course_code
       FROM book_listings b
       JOIN users u ON b.seller_id = u.id
       LEFT JOIN courses c ON b.course_id = c.id
       WHERE b.university_id = $1
         AND b.is_active = TRUE
         AND b.status = 'available'
         ${type ? 'AND b.listing_type = $2' : ''}
       ORDER BY b.created_at DESC`,
      type ? [req.user.university_id, type] : [req.user.university_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// GET /api/books/:id  single listing detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, 
              u.full_name as seller_name,
              c.course_code
       FROM book_listings b
       JOIN users u ON b.seller_id = u.id
       LEFT JOIN courses c ON b.course_id = c.id
       WHERE b.id = $1 AND b.is_active = TRUE`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Listing not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// POST /api/books  create a new book listing
router.post('/', authenticate, async (req, res) => {
  const { title, author, course_id, condition, listing_type, price, women_only } = req.body;

  if (!title || !listing_type)
    return res.status(400).json({ error: 'title and listing_type are required' });
  if (listing_type === 'paid' && !price)
    return res.status(400).json({ error: 'price is required for paid listings' });

  try {
    const result = await pool.query(
      `INSERT INTO book_listings
        (seller_id, university_id, title, author, course_id, condition, listing_type, price, women_only)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [req.user.id, req.user.university_id, title, author, course_id, condition, listing_type, price || null, women_only || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// POST /api/books/confirm-pin  seller confirms PIN to complete exchange
// NOTE: this route must be defined BEFORE /:id/request to avoid conflict
router.post('/confirm-pin', authenticate, async (req, res) => {
  const { request_id, pin } = req.body;

  if (!request_id || !pin)
    return res.status(400).json({ error: 'request_id and pin are required' });

  try {
    const result = await pool.query(
      "SELECT * FROM book_requests WHERE id = $1 AND status = 'pin_issued'",
      [request_id]
    );
    const bookRequest = result.rows[0];

    if (!bookRequest)
      return res.status(404).json({ error: 'Request not found' });
    if (bookRequest.pin_code !== pin)
      return res.status(400).json({ error: 'Invalid PIN' });
    if (new Date() > new Date(bookRequest.pin_expires_at))
      return res.status(400).json({ error: 'PIN has expired' });

    // Mark request and listing as completed
    await pool.query(
      "UPDATE book_requests SET status = 'completed', pin_confirmed = TRUE, updated_at = NOW() WHERE id = $1",
      [request_id]
    );
    await pool.query(
      "UPDATE book_listings SET status = 'completed', updated_at = NOW() WHERE id = $1",
      [bookRequest.listing_id]
    );

    res.json({ message: 'Exchange completed successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'PIN confirmation failed' });
  }
});

// POST /api/books/:id/request  request a book, generates PIN
router.post('/:id/request', authenticate, async (req, res) => {
  try {
    // Check listing exists and is available
    const listing = await pool.query(
      "SELECT * FROM book_listings WHERE id = $1 AND status = 'available' AND is_active = TRUE",
      [req.params.id]
    );
    if (!listing.rows[0])
      return res.status(404).json({ error: 'Listing not available' });

    // Prevent seller from requesting their own book
    if (listing.rows[0].seller_id === req.user.id)
      return res.status(400).json({ error: 'You cannot request your own listing' });

    // Women-only check
    if (listing.rows[0].women_only) {
      const user = await pool.query('SELECT gender FROM users WHERE id = $1', [req.user.id]);
      if (user.rows[0]?.gender !== 'female')
        return res.status(403).json({ error: 'This listing is restricted to female students' });
    }

    const pin_code = generatePIN();
    const pin_expires_at = getPINExpiry();

    await pool.query(
      `INSERT INTO book_requests (listing_id, requester_id, pin_code, pin_expires_at, status)
       VALUES ($1,$2,$3,$4,'pin_issued')`,
      [req.params.id, req.user.id, pin_code, pin_expires_at]
    );

    // Mark listing as pending so others can't request it
    await pool.query(
      "UPDATE book_listings SET status = 'pending', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );

    res.status(201).json({
      message: 'PIN generated. Show this to the seller at the campus drop point.',
      pin: pin_code,
      expires_at: pin_expires_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// DELETE /api/books/:id  seller cancels their own listing
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT seller_id FROM book_listings WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Listing not found' });
    if (result.rows[0].seller_id !== req.user.id)
      return res.status(403).json({ error: 'You can only delete your own listings' });

    await pool.query(
      "UPDATE book_listings SET is_active = FALSE, updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );
    res.json({ message: 'Listing removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove listing' });
  }
});

module.exports = router;