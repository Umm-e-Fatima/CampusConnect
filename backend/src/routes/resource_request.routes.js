const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');
const { generatePIN, getPINExpiry } = require('../utils/pin.utils');
const { generateWatermarkedSignedURL } = require('../utils/cloudinary.utils');
const { notifySeller } = require('../utils/push.utils');

// POST /api/resource-requests/:resourceId
// Buyer requests access to a paid resource

router.post('/:resourceId', authenticate, async (req, res) => {
  const { borrow_days, delivery_mode } = req.body;

  try {
    // Fetch the resource
    const resource = await pool.query(
      'SELECT * FROM resources WHERE id = $1 AND is_active = TRUE',
      [req.params.resourceId]
    );
    if (resource.rows.length === 0)
      return res.status(404).json({ error: 'Resource not found' });

    const r = resource.rows[0];

    // Gift resources are free — no request needed
    if (r.listing_type === 'gift')
      return res.status(400).json({ error: 'This resource is free — no request needed' });

    // Prevent owner from requesting their own resource
    if (r.uploaded_by === req.user.id)
      return res.status(400).json({ error: 'You cannot request your own resource' });

    // Borrow listings require borrow_days
    if (r.listing_type === 'borrow') {
      if (!borrow_days || borrow_days < 1 || borrow_days > 15)
        return res.status(400).json({ error: 'borrow_days must be between 1 and 15' });
    }

    // Calculate total price
    const totalPrice = r.listing_type === 'borrow'
      ? (parseFloat(r.price) * parseInt(borrow_days)).toFixed(2)
      : parseFloat(r.price).toFixed(2);

    // Generate PIN
    const pin_code = generatePIN();
    const pin_expires_at = getPINExpiry();

    // Calculate download window — 24 hours from seller confirmation
    // (set properly when seller confirms, not now)
    const result = await pool.query(
      `INSERT INTO resource_requests
        (resource_id, requester_id, delivery_mode, borrow_days,
         pin_code, pin_expires_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')
       RETURNING *`,
      [
        req.params.resourceId,
        req.user.id,
        delivery_mode || 'online',
        r.listing_type === 'borrow' ? parseInt(borrow_days) : null,
        pin_code,
        pin_expires_at,
      ]
    );

// Notify seller via push + email fallback
const seller = await pool.query(
  'SELECT id, email, full_name FROM users WHERE id = $1',
  [r.uploaded_by]
);

if (seller.rows[0]) {
  const sellerUser = seller.rows[0];
  await notifySeller(
    sellerUser.id,
    {
      title: 'New Resource Request',
      body: `Someone wants to access your resource "${r.title}". Open CampusConnect to confirm payment.`,
      url: '/resource-requests',
    },
    sellerUser.email
  );
}

  res.status(201).json({
    message: `Request created. Pay Rs. ${totalPrice} to the seller then show them your PIN.`,
    request_id: result.rows[0].id,
    pin: pin_code,
    pin_expires_at,
    total_price: `Rs. ${totalPrice}`,
    seller_instructions: r.listing_type === 'borrow'
      ? `Borrow for ${borrow_days} days at Rs. ${r.price}/day`
      : `One-time purchase at Rs. ${r.price}`,
  });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});


// GET /api/resource-requests/seller/pending
// Seller sees all pending requests for their resources

router.get('/seller/pending', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rr.*, 
              r.title as resource_title,
              r.course_code,
              r.price,
              r.listing_type,
              u.full_name as requester_name,
              u.email as requester_email
       FROM resource_requests rr
       JOIN resources r ON rr.resource_id = r.id
       JOIN users u ON rr.requester_id = u.id
       WHERE r.uploaded_by = $1
         AND rr.status IN ('pending', 'pin_issued')
       ORDER BY rr.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});


// GET /api/resource-requests/buyer/my-requests
// Buyer sees their own requests and download status
 
router.get('/buyer/my-requests', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rr.*,
              r.title as resource_title,
              r.course_code,
              r.listing_type,
              r.price,
              u.full_name as seller_name
       FROM resource_requests rr
       JOIN resources r ON rr.resource_id = r.id
       JOIN users u ON r.uploaded_by = u.id
       WHERE rr.requester_id = $1
       ORDER BY rr.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your requests' });
  }
});


// POST /api/resource-requests/confirm-pin
// Seller confirms PIN — grants buyer download access

router.post('/confirm-pin', authenticate, async (req, res) => {
  const { request_id, pin } = req.body;

  if (!request_id || !pin)
    return res.status(400).json({ error: 'request_id and pin are required' });

  try {
    // Fetch request + resource together
    const result = await pool.query(
      `SELECT rr.*, r.uploaded_by, r.title
       FROM resource_requests rr
       JOIN resources r ON rr.resource_id = r.id
       WHERE rr.id = $1`,
      [request_id]
    );
    const request = result.rows[0];

    if (!request)
      return res.status(404).json({ error: 'Request not found' });

    // Only the resource owner can confirm
    if (request.uploaded_by !== req.user.id)
      return res.status(403).json({ error: 'Only the resource owner can confirm this PIN' });

    if (request.pin_code !== pin)
      return res.status(400).json({ error: 'Invalid PIN' });

    if (new Date() > new Date(request.pin_expires_at))
      return res.status(400).json({ error: 'PIN has expired. Ask buyer to request again.' });

    if (request.seller_confirmed)
      return res.status(400).json({ error: 'This PIN has already been confirmed' });

    // Grant 24-hour download window
    const download_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE resource_requests
       SET seller_confirmed    = TRUE,
           status              = 'completed',
           download_expires_at = $1,
           updated_at          = NOW()
       WHERE id = $2`,
      [download_expires_at, request_id]
    );

    res.json({
      message: 'Payment confirmed. Buyer can now download the resource within 24 hours (3 attempts).',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PIN confirmation failed' });
  }
});

 
// POST /api/resource-requests/:requestId/download
// Buyer downloads resource — generates fresh signed watermarked URL

router.post('/:requestId/download', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rr.*, 
              r.cloudinary_id,
              r.title,
              u.full_name as buyer_name,
              u.email as buyer_email
       FROM resource_requests rr
       JOIN resources r ON rr.resource_id = r.id
       JOIN users u ON rr.requester_id = u.id
       WHERE rr.id = $1`,
      [req.params.requestId]
    );
    const request = result.rows[0];

    if (!request)
      return res.status(404).json({ error: 'Request not found' });

    // Only the buyer can download
    if (request.requester_id !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    // Check seller has confirmed payment
    if (!request.seller_confirmed)
      return res.status(403).json({ error: 'Seller has not yet confirmed your payment' });

    // Check 24-hour window hasn't expired
    if (new Date() > new Date(request.download_expires_at))
      return res.status(403).json({ error: 'Your 24-hour download window has expired' });

    // Check download attempt limit (max 3)
    if (request.download_count >= 3)
      return res.status(403).json({ error: 'Maximum download attempts (3) reached' });

    // Generate fresh watermarked signed URL
    const { url, expiresAt } = generateWatermarkedSignedURL(
      request.cloudinary_id,
      request.buyer_email,
      request.buyer_name
    );

    // Increment download count
    await pool.query(
      `UPDATE resource_requests
       SET download_count = download_count + 1,
           updated_at     = NOW()
       WHERE id = $1`,
      [req.params.requestId]
    );

    res.json({
      download_url: url,
      url_expires_at: new Date(expiresAt * 1000).toISOString(),
      attempts_remaining: 3 - (request.download_count + 1),
      window_expires_at: request.download_expires_at,
      message: request.download_count + 1 >= 3
        ? 'This was your final download attempt.'
        : `Download link expires in 10 minutes. You have ${3 - (request.download_count + 1)} attempt(s) remaining within 24 hours.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
});

module.exports = router;