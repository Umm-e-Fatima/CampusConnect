const webpush = require('web-push');
const pool = require('../config/db');
const { sendSellerNotificationEmail } = require('./email.utils');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send push notification to a user
 * Falls back to email if push fails or no subscription exists
 */
const notifySeller = async (sellerId, payload, fallbackEmail) => {
  // Try push notification first
  try {
    const result = await pool.query(
      'SELECT subscription FROM push_subscriptions WHERE user_id = $1',
      [sellerId]
    );

    if (result.rows.length > 0) {
      const subscription = result.rows[0].subscription;
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );
      console.log(`Push notification sent to user ${sellerId}`);
      return;
    }
  } catch (err) {
    console.error('Push notification failed:', err.message);
    // Fall through to email
  }

  // Fallback — send email
  if (fallbackEmail) {
    try {
      await sendSellerNotificationEmail(
        fallbackEmail,
        payload.title,
        payload.body
      );
      console.log(`Fallback email sent to ${fallbackEmail}`);
    } catch (emailErr) {
      console.error('Fallback email also failed:', emailErr.message);
    }
  }
};

module.exports = { notifySeller };