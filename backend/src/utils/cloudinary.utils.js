const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generates a signed, time-limited, watermarked Cloudinary URL
 * for paid resource downloads.
 *
 * @param {string} publicId       - Cloudinary public_id of the file
 * @param {string} buyerEmail     - Buyer's email (baked into watermark)
 * @param {string} buyerName      - Buyer's full name (baked into watermark)
 * @returns {string}              - Signed URL, expires in 10 minutes
 */
const generateWatermarkedSignedURL = (publicId, buyerEmail, buyerName) => {
  const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes from now

  const watermarkText = `${buyerName} | ${buyerEmail} | ${new Date().toISOString().split('T')[0]}`;

  const url = cloudinary.url(publicId, {
    resource_type: 'auto',
    type: 'upload',
    sign_url: true,
    expires_at: expiresAt,
    transformation: [
      {
        overlay: {
          font_family: 'Arial',
          font_size: 28,
          font_weight: 'bold',
          text: encodeURIComponent(watermarkText),
        },
        color: '#FF0000',
        opacity: 40,
        angle: -30,
        gravity: 'center',
      },
    ],
  });

  return { url, expiresAt };
};

module.exports = { generateWatermarkedSignedURL };