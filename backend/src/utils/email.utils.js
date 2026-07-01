const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"Roshni Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Roshni Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2d6a4f;">روشنی Roshni</h2>
        <p>Thank you for registering on Roshni-the peer learning platform for Pakistani university students.</p>
        <p>Your verification code is:</p>
        <div style="
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 12px;
          color: #2d6a4f;
          padding: 20px;
          background: #f0f4f8;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        ">
          ${otpCode}
        </div>
        <p style="color: #888; font-size: 13px;">
          This code expires in 10 minutes. If you did not register on Roshni, ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };