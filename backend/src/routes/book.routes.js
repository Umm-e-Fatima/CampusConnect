const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');
const { generatePIN, getPINExpiry } = require('../utils/pin.utils');

// Reverts any listing stuck in 'pending' whose PIN expired without confirmation
const revertExpiredPending = async () => {
  await pool.query(
    `UPDATE book_listings
     SET status = 'available', updated_at = NOW()
     WHERE status = 'pending'
       AND id IN (
         SELECT listing_id FROM book_requests
         WHERE status = 'pin_issued' AND pin_expires_at < NOW()
       )`
  );
};

// GET /api/books?type=paid&course_code=CS-301
router.get('/', authenticate, async (req, res) => {
  const { type, course_code } = req.query;
  try {
    await revertExpiredPending();

    const conditions = ['b.is_active = TRUE', "b.status = 'available'"];
    const params = [];

    if (type) {
      params.push(type);
      conditions.push(`b.listing_type = $${params.length}`);
    }
    if (course_code) {
      params.push(course_code);
      conditions.push(`b.course_code = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT b.*, u.full_name as seller_name
       FROM book_listings b
       JOIN users u ON b.seller_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY b.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// GET /api/books/distinct-courses — for autosuggest
router.get('/distinct-courses', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT course_code FROM book_listings WHERE course_code IS NOT NULL ORDER BY course_code`
    );
    res.json(result.rows.map(r => r.course_code));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course codes' });
  }
});

// GET /api/books/seller/pending — seller sees requests awaiting their PIN confirmation
router.get('/seller/pending', authenticate, async (req, res) => {
  try {
    await revertExpiredPending();

    const result = await pool.query(
      `SELECT br.id, br.borrow_days, br.borrow_due_date, br.created_at,
              bl.title, bl.author, bl.course_code, bl.listing_type, bl.price,
              u.full_name as requester_name, u.email as requester_email
       FROM book_requests br
       JOIN book_listings bl ON br.listing_id = bl.id
       JOIN users u ON br.requester_id = u.id
       WHERE bl.seller_id = $1 AND br.status = 'pin_issued'
       ORDER BY br.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// GET /api/books/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.full_name as seller_name
       FROM book_listings b
       JOIN users u ON b.seller_id = u.id
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

// POST /api/books — create listing
router.post('/', authenticate, async (req, res) => {
  const {
    title, author, course_code, condition,
    listing_type, price, women_only,
    borrow_days_limit, dropoff_location, contact_info, payment_info,
  } = req.body;

  if (!title || !listing_type)
    return res.status(400).json({ error: 'title and listing_type are required' });
  if (listing_type !== 'gift' && !price)
    return res.status(400).json({ error: 'price is required for borrow or buy listings' });
  if (listing_type === 'borrow' && !borrow_days_limit)
    return res.status(400).json({ error: 'borrow_days_limit is required for borrow listings' });

  try {
    const result = await pool.query(
    `INSERT INTO book_listings
      (seller_id, title, author, course_code, condition,
      listing_type, price, women_only, dropoff_location, contact_info, payment_info)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      req.user.id,
      title,
      author,
      course_code ? course_code.trim().toUpperCase() : null,
      condition,
      listing_type,
      price || null,
      women_only || false,
      dropoff_location || null,
      contact_info || null,
      payment_info || null,
    ]
  );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// POST /api/books/confirm-pin — seller confirms PIN
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

    await pool.query(
      `UPDATE book_requests
       SET status = 'completed', pin_confirmed = TRUE, updated_at = NOW()
       WHERE id = $1`,
      [request_id]
    );
    await pool.query(
      `UPDATE book_listings
       SET status = 'completed', updated_at = NOW()
       WHERE id = $1`,
      [bookRequest.listing_id]
    );

    // Fetch seller contact info to share with buyer after confirmation
    const listingResult = await pool.query(
      `SELECT b.contact_info, b.dropoff_location, u.full_name as seller_name
      FROM book_listings b
      JOIN users u ON b.seller_id = u.id
      WHERE b.id = $1`,
      [bookRequest.listing_id]
    );
    const listing = listingResult.rows[0];

    res.json({
      message: 'Exchange completed successfully',
      seller_name: listing?.seller_name || null,
      contact_info: listing?.contact_info || null,
      dropoff_location: listing?.dropoff_location || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'PIN confirmation failed' });
  }
});

// POST /api/books/:id/request — buyer requests a book
router.post('/:id/request', authenticate, async (req, res) => {
  const { borrow_days } = req.body;

  try {
    await revertExpiredPending();

    const listing = await pool.query(
      "SELECT * FROM book_listings WHERE id = $1 AND status = 'available' AND is_active = TRUE",
      [req.params.id]
    );
    if (!listing.rows[0])
      return res.status(404).json({ error: 'Listing not available' });

    if (listing.rows[0].seller_id === req.user.id)
      return res.status(400).json({ error: 'You cannot request your own listing' });

    if (listing.rows[0].women_only) {
      const user = await pool.query('SELECT gender FROM users WHERE id = $1', [req.user.id]);
      if (user.rows[0]?.gender !== 'female')
        return res.status(403).json({ error: 'This listing is restricted to female students' });
    }

    if (listing.rows[0].listing_type === 'borrow' && !borrow_days)
      return res.status(400).json({ error: 'borrow_days is required for borrow listings' });

    const pin_code = generatePIN();
    const pin_expires_at = getPINExpiry();

    let borrow_due_date = null;
    if (listing.rows[0].listing_type === 'borrow' && borrow_days) {
      borrow_due_date = new Date();
      borrow_due_date.setDate(borrow_due_date.getDate() + parseInt(borrow_days));
    }

    const insertResult = await pool.query(
      `INSERT INTO book_requests
        (listing_id, requester_id, pin_code, pin_expires_at, status, borrow_days, borrow_due_date)
       VALUES ($1,$2,$3,$4,'pin_issued',$5,$6)
       RETURNING id`,
      [req.params.id, req.user.id, pin_code, pin_expires_at, borrow_days || null, borrow_due_date]
    );

    await pool.query(
      "UPDATE book_listings SET status = 'pending', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );

    const totalPrice = listing.rows[0].listing_type === 'borrow'
      ? (listing.rows[0].price * borrow_days).toFixed(2)
      : listing.rows[0].price;

    res.status(201).json({
      message: 'PIN generated. Show this to the seller at the campus drop point.',
      request_id: insertResult.rows[0].id,
      pin: pin_code,
      expires_at: pin_expires_at,
      dropoff_location: listing.rows[0].dropoff_location || null,
      payment_info: listing.rows[0].payment_info || null,
      ...(borrow_due_date && { due_date: borrow_due_date }),
      ...(totalPrice && { total_price: `Rs. ${totalPrice}` }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// DELETE /api/books/:id — seller removes their listing
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